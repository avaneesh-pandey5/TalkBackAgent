import type { StoredChunk, VectorSearchResult, VectorStore } from "./types.js";

function cosineSimilarity(a: number[], b: number[]): number {
  const len = Math.min(a.length, b.length);
  if (len === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    normA += av * av;
    normB += bv * bv;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class MemoryVectorStore implements VectorStore {
  private readonly chunks = new Map<string, StoredChunk>();

  async addChunks(chunks: StoredChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.chunkId, chunk);
    }
  }

  async search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]> {
    const scored: VectorSearchResult[] = [];

    for (const chunk of this.chunks.values()) {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      scored.push({
        chunkId: chunk.chunkId,
        docId: chunk.docId,
        docTitle: chunk.docTitle,
        text: chunk.text,
        score,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  async deleteByDocId(docId: string): Promise<void> {
    for (const [chunkId, chunk] of this.chunks.entries()) {
      if (chunk.docId === docId) {
        this.chunks.delete(chunkId);
      }
    }
  }
}
