import { mkdir, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { chunkText } from "./chunk/chunkText.js";
import type { Embedder } from "./embed/openai.js";
import { extractTextFromPdf } from "./extract/pdf.js";
import { extractTextFromTxt } from "./extract/text.js";
import { ChromaVectorStore } from "./store/chroma.js";
import { MemoryVectorStore } from "./store/memory.js";
import type { StoredChunk, VectorStore } from "./store/types.js";

export type KbDocSummary = {
  id: string;
  title: string;
  createdAt: string;
  chunkCount: number;
};

type KbDocRecord = KbDocSummary & {
  filePath: string;
};

export type UploadInput = {
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

export type KbSearchResult = {
  docId: string;
  docTitle: string;
  chunkId: string;
  snippet: string;
  score: number;
};

const PDF_EXT = ".pdf";
const TXT_EXT = ".txt";

function inferFileExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === PDF_EXT || ext === TXT_EXT) return ext;
  return "";
}

function inferByMime(mimeType: string): string {
  const lowered = mimeType.toLowerCase();
  if (lowered === "application/pdf") return PDF_EXT;
  if (lowered === "text/plain") return TXT_EXT;
  return "";
}

function createSnippet(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.slice(0, 240);
}

export async function createVectorStore(
  chromaUrl: string,
  chromaCollection: string,
): Promise<{ store: VectorStore; backend: "chroma" | "memory" }> {
  try {
    const store = new ChromaVectorStore(chromaUrl, chromaCollection);
    await store.initialize();
    return { store, backend: "chroma" };
  } catch {
    return { store: new MemoryVectorStore(), backend: "memory" };
  }
}

export class KbService {
  private readonly docs = new Map<string, KbDocRecord>();

  constructor(
    private readonly vectorStore: VectorStore,
    private readonly embedder: Embedder,
    private readonly uploadDir: string,
  ) {}

  async upload(input: UploadInput): Promise<KbDocSummary> {
    const filename = path.basename(input.filename || "document");
    const extByName = inferFileExtension(filename);
    const extByMime = inferByMime(input.mimeType || "");
    const ext = extByName || extByMime;

    if (!ext || (ext !== PDF_EXT && ext !== TXT_EXT)) {
      throw new Error("UNSUPPORTED_FILE_TYPE");
    }

    const extractedText =
      ext === PDF_EXT
        ? await extractTextFromPdf(input.buffer)
        : await extractTextFromTxt(input.buffer);

    if (!extractedText.trim()) {
      throw new Error("EMPTY_DOCUMENT");
    }

    const chunks = chunkText(extractedText, { chunkSize: 1000, overlap: 200 });
    if (chunks.length === 0) {
      throw new Error("EMPTY_DOCUMENT");
    }

    const docId = randomUUID();
    const createdAt = new Date().toISOString();

    const texts = chunks.map((chunk) => chunk.text);
    let embeddings: number[][];
    try {
      embeddings = await this.embedder.embedTexts(texts);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown embedding error.";
      throw new Error(`EMBEDDING_FAILED:${reason}`);
    }

    if (embeddings.length !== chunks.length) {
      throw new Error("EMBEDDING_FAILED");
    }

    const storedChunks: StoredChunk[] = chunks.map((chunk, index) => {
      const chunkId = `${docId}:${chunk.index}`;
      return {
        chunkId,
        docId,
        docTitle: filename,
        text: chunk.text,
        embedding: embeddings[index] ?? [],
      };
    });

    try {
      await this.vectorStore.addChunks(storedChunks);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Unknown vector store error.";
      throw new Error(`VECTOR_STORE_FAILED:${reason}`);
    }

    await mkdir(this.uploadDir, { recursive: true });
    const filePath = path.join(this.uploadDir, `${docId}${ext}`);
    await writeFile(filePath, input.buffer);

    const summary: KbDocSummary = {
      id: docId,
      title: filename,
      createdAt,
      chunkCount: storedChunks.length,
    };

    this.docs.set(docId, {
      ...summary,
      filePath,
    });

    return summary;
  }

  async listDocs(): Promise<KbDocSummary[]> {
    return [...this.docs.values()]
      .map(({ filePath: _filePath, ...summary }) => summary)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async deleteDoc(docId: string): Promise<boolean> {
    const existing = this.docs.get(docId);
    if (!existing) {
      return false;
    }

    await this.vectorStore.deleteByDocId(docId);
    this.docs.delete(docId);

    await rm(existing.filePath, { force: true }).catch(() => undefined);

    const files = await readdir(this.uploadDir).catch(() => [] as string[]);
    for (const file of files) {
      if (file.startsWith(docId)) {
        await rm(path.join(this.uploadDir, file), { force: true }).catch(() => undefined);
      }
    }

    return true;
  }

  async search(query: string, topK = 5): Promise<KbSearchResult[]> {
    const cleaned = query.trim();
    if (!cleaned) {
      throw new Error("INVALID_QUERY");
    }

    const embeddings = await this.embedder.embedTexts([cleaned]);
    const embedding = embeddings[0] ?? [];
    const results = await this.vectorStore.search(embedding, topK);

    return results.map((result) => ({
      docId: result.docId,
      docTitle: result.docTitle,
      chunkId: result.chunkId,
      snippet: createSnippet(result.text),
      score: result.score,
    }));
  }
}
