import { ChromaClient, type Collection } from "chromadb";
import type { StoredChunk, VectorSearchResult, VectorStore } from "./types.js";

type ChromaMetadata = {
  chunkId: string;
  docId: string;
  docTitle: string;
};

export class ChromaVectorStore implements VectorStore {
  private readonly client: ChromaClient;
  private readonly collectionName: string;
  private collectionPromise: Promise<Collection> | null = null;

  constructor(chromaUrl: string, collectionName: string) {
    this.client = new ChromaClient({ path: chromaUrl });
    this.collectionName = collectionName;
  }

  async initialize(): Promise<void> {
    await this.getCollection();
  }

  private async getCollection(): Promise<Collection> {
    if (!this.collectionPromise) {
      this.collectionPromise = this.client.getOrCreateCollection({
        name: this.collectionName,
      });
    }

    return this.collectionPromise;
  }

  async addChunks(chunks: StoredChunk[]): Promise<void> {
    if (chunks.length === 0) return;

    const collection = await this.getCollection();
    await collection.add({
      ids: chunks.map((chunk) => chunk.chunkId),
      embeddings: chunks.map((chunk) => chunk.embedding),
      documents: chunks.map((chunk) => chunk.text),
      metadatas: chunks.map((chunk) => ({
        chunkId: chunk.chunkId,
        docId: chunk.docId,
        docTitle: chunk.docTitle,
      })),
    });
  }

  async search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]> {
    const collection = await this.getCollection();

    const result = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      include: ["metadatas", "documents", "distances"],
    });

    const metadatas = result.metadatas?.[0] ?? [];
    const documents = result.documents?.[0] ?? [];
    const distances = result.distances?.[0] ?? [];

    const output: VectorSearchResult[] = [];

    for (let index = 0; index < metadatas.length; index += 1) {
      const metadata = metadatas[index] as ChromaMetadata | null;
      const text = documents[index] ?? "";
      const distance = distances[index] ?? 1;

      if (!metadata || typeof metadata.docId !== "string") continue;

      output.push({
        chunkId: metadata.chunkId,
        docId: metadata.docId,
        docTitle: metadata.docTitle,
        text,
        score: 1 - distance,
      });
    }

    return output;
  }

  async deleteByDocId(docId: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.delete({ where: { docId } });
  }
}
