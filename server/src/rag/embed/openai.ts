import OpenAI from "openai";

export interface Embedder {
  embedTexts(texts: string[]): Promise<number[][]>;
}

export class OpenAIEmbedder implements Embedder {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = "text-embedding-3-small") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown embedding error.";
      throw new Error(`EMBEDDING_REQUEST_FAILED:${message}`);
    }
  }
}
