export type SessionSource = {
  docId: string;
  docTitle: string;
  chunkId: string;
  snippet: string;
};

export type SessionState = {
  roomName: string;
  updatedAt: string;
  sources: SessionSource[];
  lastAnswer?: string;
};

export class SessionStore {
  private readonly states = new Map<string, SessionState>();

  get(roomName: string): SessionState | null {
    return this.states.get(roomName) ?? null;
  }

  upsert(
    roomName: string,
    payload: {
      sources?: SessionSource[];
      lastAnswer?: string;
    },
  ): SessionState {
    const current = this.states.get(roomName);

    const next: SessionState = {
      roomName,
      updatedAt: new Date().toISOString(),
      sources: payload.sources ?? current?.sources ?? [],
      lastAnswer: payload.lastAnswer ?? current?.lastAnswer,
    };

    this.states.set(roomName, next);
    return next;
  }
}
