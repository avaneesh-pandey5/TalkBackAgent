import type { KbSource } from "./kbSearchClient.js";

export class SessionStateClient {
  constructor(private readonly apiBaseUrl: string) {}

  async updateRoomState(
    roomName: string,
    payload: {
      sources?: KbSource[];
      lastAnswer?: string;
    },
  ): Promise<void> {
    const sources = payload.sources?.map((source) => ({
      docId: source.docId,
      docTitle: source.docTitle,
      chunkId: source.chunkId,
      snippet: source.snippet,
    }));

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/session/${encodeURIComponent(roomName)}/state`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(sources ? { sources } : {}),
            ...(payload.lastAnswer ? { lastAnswer: payload.lastAnswer } : {}),
          }),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        console.warn("Session state update failed", {
          roomName,
          status: response.status,
          error: body?.error,
        });
      } else {
        console.debug("Session state updated", {
          roomName,
          sourceCount: sources?.length ?? 0,
          hasLastAnswer: Boolean(payload.lastAnswer),
        });
      }
    } catch (error) {
      console.warn("Session state update request failed", { roomName, error });
    }
  }
}
