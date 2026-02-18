export type StoredChunk = {
  chunkId: string;
  docId: string;
  docTitle: string;
  text: string;
  embedding: number[];
};

export type VectorSearchResult = {
  chunkId: string;
  docId: string;
  docTitle: string;
  text: string;
  score: number;
};

export interface VectorStore {
  addChunks(chunks: StoredChunk[]): Promise<void>;
  search(queryEmbedding: number[], topK: number): Promise<VectorSearchResult[]>;
  deleteByDocId(docId: string): Promise<void>;
}
