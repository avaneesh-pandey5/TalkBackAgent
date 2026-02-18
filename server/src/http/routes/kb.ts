import Busboy from "busboy";
import type { IncomingMessage, ServerResponse } from "node:http";
import { HttpError } from "../../utils/errors.js";
import { readJsonBody, sendJson } from "../../utils/http.js";
import type { KbService, UploadInput } from "../../rag/kbService.js";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

function getPathWithoutQuery(urlValue: string): string {
  const queryIndex = urlValue.indexOf("?");
  return queryIndex === -1 ? urlValue : urlValue.slice(0, queryIndex);
}

function parseDeleteDocPath(pathname: string): string | null {
  const match = pathname.match(/^\/kb\/docs\/([^/]+)$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

async function parseSingleUpload(request: IncomingMessage): Promise<UploadInput> {
  const contentType = request.headers["content-type"];
  if (!contentType?.toLowerCase().startsWith("multipart/form-data")) {
    throw new HttpError(400, "Invalid file upload. Expected multipart/form-data.");
  }

  return new Promise<UploadInput>((resolve, reject) => {
    let fileBuffer: Buffer | null = null;
    let filename = "";
    let mimeType = "";
    let fileFound = false;
    let tooLarge = false;

    const busboy = Busboy({
      headers: request.headers,
      limits: {
        files: 1,
        fileSize: MAX_UPLOAD_BYTES,
      },
    });

    busboy.on("file", (_fieldName, file, info) => {
      fileFound = true;
      filename = info.filename;
      mimeType = info.mimeType;

      const chunks: Buffer[] = [];

      file.on("data", (chunk: Buffer) => {
        chunks.push(chunk);
      });

      file.on("limit", () => {
        tooLarge = true;
      });

      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("finish", () => {
      if (tooLarge) {
        reject(new HttpError(413, "File too large."));
        return;
      }

      if (!fileFound || !fileBuffer || fileBuffer.length === 0) {
        reject(new HttpError(400, "Invalid file upload. Expected one non-empty file."));
        return;
      }

      resolve({
        filename,
        mimeType,
        buffer: fileBuffer,
      });
    });

    busboy.on("error", () => {
      reject(new HttpError(400, "Invalid multipart form data."));
    });

    request.pipe(busboy);
  });
}

export async function handleKbRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  kbService: KbService,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const pathname = getPathWithoutQuery(request.url ?? "/");

  if (method === "POST" && pathname === "/kb/upload") {
    const file = await parseSingleUpload(request);

    try {
      const doc = await kbService.upload(file);
      sendJson(response, 200, { ok: true, doc });
      return true;
    } catch (error) {
      console.error("KB upload failed", error);

      if (error instanceof HttpError) {
        throw error;
      }

      if (error instanceof Error && error.message === "UNSUPPORTED_FILE_TYPE") {
        sendJson(response, 400, {
          error: "Invalid file. Supported file types are .pdf and .txt.",
        });
        return true;
      }

      if (error instanceof Error && error.message === "EMPTY_DOCUMENT") {
        sendJson(response, 400, { error: "Invalid file. Could not extract text." });
        return true;
      }

      if (error instanceof Error && error.message.startsWith("EMBEDDING_FAILED:")) {
        sendJson(response, 500, {
          error: "Embedding failed. Check OPENAI_API_KEY and embedding model access.",
        });
        return true;
      }

      if (error instanceof Error && error.message.startsWith("VECTOR_STORE_FAILED:")) {
        sendJson(response, 500, {
          error: "Vector store write failed. Check CHROMA_URL/CHROMA_COLLECTION and Chroma server status.",
        });
        return true;
      }

      sendJson(response, 500, { error: "Failed to process and store document." });
      return true;
    }
  }

  if (method === "GET" && pathname === "/kb/docs") {
    const docs = await kbService.listDocs();
    sendJson(response, 200, { docs });
    return true;
  }

  if (method === "DELETE") {
    const docId = parseDeleteDocPath(pathname);
    if (docId) {
      const deleted = await kbService.deleteDoc(docId);
      if (!deleted) {
        sendJson(response, 404, { error: "Document not found." });
        return true;
      }

      sendJson(response, 200, { ok: true });
      return true;
    }
  }

  if (method === "POST" && pathname === "/kb/search") {
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with { query, topK? }.",
      });
      return true;
    }

    const query = (body as { query?: unknown }).query;
    const topKRaw = (body as { topK?: unknown }).topK;

    if (typeof query !== "string" || !query.trim()) {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with { query, topK? }.",
      });
      return true;
    }

    let topK = 5;
    if (topKRaw !== undefined) {
      if (typeof topKRaw !== "number" || !Number.isFinite(topKRaw)) {
        sendJson(response, 400, {
          error: "Invalid payload. Expected JSON body with { query, topK? }.",
        });
        return true;
      }
      topK = Math.max(1, Math.min(20, Math.floor(topKRaw)));
    }

    try {
      const results = await kbService.search(query, topK);
      sendJson(response, 200, { results });
      return true;
    } catch {
      sendJson(response, 500, { error: "Failed to search knowledge base." });
      return true;
    }
  }

  return false;
}
