export type TokenRequest = {
  roomName: string;
  identity: string;
};

export type TokenResponse = {
  token: string;
  url: string;
};

export type DispatchRequest = {
  roomName: string;
  agentName?: string;
  metadata?: unknown;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export async function fetchLiveKitToken(
  payload: TokenRequest,
): Promise<TokenResponse> {
  const response = await fetch(`${API_BASE_URL}/livekit/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Token request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (typeof body?.token !== "string" || typeof body?.url !== "string") {
    throw new Error("Invalid token response from server.");
  }

  return body;
}

export async function dispatchAgent(payload: DispatchRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/agent/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Dispatch failed with status ${response.status}`;
    throw new Error(message);
  }
}

export type AgentConfig = {
  systemPrompt: string;
  updatedAt: string;
};

export async function fetchAgentConfig(): Promise<AgentConfig> {
  const response = await fetch(`${API_BASE_URL}/agent/config`, {
    method: "GET",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Config fetch failed with status ${response.status}`;
    throw new Error(message);
  }

  const config = body?.config;
  if (
    typeof config?.systemPrompt !== "string" ||
    typeof config?.updatedAt !== "string"
  ) {
    throw new Error("Invalid config response from server.");
  }

  return config;
}

export async function updateAgentConfig(systemPrompt: string): Promise<AgentConfig> {
  const response = await fetch(`${API_BASE_URL}/agent/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ systemPrompt }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Config update failed with status ${response.status}`;
    throw new Error(message);
  }

  const config = body?.config;
  if (
    body?.ok !== true ||
    typeof config?.systemPrompt !== "string" ||
    typeof config?.updatedAt !== "string"
  ) {
    throw new Error("Invalid config update response from server.");
  }

  return config;
}

export type KbDoc = {
  id: string;
  title: string;
  createdAt: string;
  chunkCount: number;
};

export type KbSearchResult = {
  docId: string;
  docTitle: string;
  chunkId: string;
  snippet: string;
  score: number;
};

export async function kbUpload(file: File): Promise<{ ok: true; doc: KbDoc }> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/kb/upload`, {
    method: "POST",
    body: formData,
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Upload failed with status ${response.status}`;
    throw new Error(message);
  }

  if (
    body?.ok !== true ||
    typeof body?.doc?.id !== "string" ||
    typeof body?.doc?.title !== "string" ||
    typeof body?.doc?.createdAt !== "string" ||
    typeof body?.doc?.chunkCount !== "number"
  ) {
    throw new Error("Invalid upload response from server.");
  }

  return body;
}

export async function kbListDocs(): Promise<{ docs: KbDoc[] }> {
  const response = await fetch(`${API_BASE_URL}/kb/docs`, { method: "GET" });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `List docs failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!Array.isArray(body?.docs)) {
    throw new Error("Invalid docs response from server.");
  }

  return { docs: body.docs as KbDoc[] };
}

export async function kbDeleteDoc(id: string): Promise<{ ok: true }> {
  const response = await fetch(`${API_BASE_URL}/kb/docs/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Delete failed with status ${response.status}`;
    throw new Error(message);
  }

  if (body?.ok !== true) {
    throw new Error("Invalid delete response from server.");
  }

  return body;
}

export async function kbSearch(
  query: string,
  topK?: number,
): Promise<{ results: KbSearchResult[] }> {
  const response = await fetch(`${API_BASE_URL}/kb/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(topK ? { query, topK } : { query }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof body?.error === "string"
        ? body.error
        : `Search failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!Array.isArray(body?.results)) {
    throw new Error("Invalid search response from server.");
  }

  return { results: body.results as KbSearchResult[] };
}
