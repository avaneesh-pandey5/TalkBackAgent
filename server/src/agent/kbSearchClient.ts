export type KbSource = {
  docId: string;
  docTitle: string;
  chunkId: string;
  snippet: string;
  score: number;
};

export class KbSearchClient {
  constructor(private readonly apiBaseUrl: string) {}

  async search(query: string, topK = 4): Promise<KbSource[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/kb/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, topK }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        console.warn("KB search request failed", {
          status: response.status,
          error: body?.error,
        });
        return [];
      }

      const body = (await response.json().catch(() => null)) as
        | { results?: KbSource[] }
        | null;
      const results = Array.isArray(body?.results) ? body.results : [];
      console.debug("KB search results", {
        queryLength: query.length,
        topK,
        count: results.length,
      });
      return results;
    } catch (error) {
      console.warn("KB search fetch failed", error);
      return [];
    }
  }
}
