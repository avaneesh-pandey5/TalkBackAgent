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
