import type { IncomingMessage, ServerResponse } from "node:http";
import type { AgentConfigStore } from "../../services/agentConfigStore.js";
import { normalizeSystemPrompt } from "../../services/agentConfigStore.js";
import { readJsonBody, sendJson } from "../../utils/http.js";

function validatePromptRequest(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const systemPrompt = (body as { systemPrompt?: unknown }).systemPrompt;
  if (typeof systemPrompt !== "string") return null;

  const normalized = normalizeSystemPrompt(systemPrompt);
  if (!normalized) return null;

  return normalized;
}

export async function handleAgentConfigRoute(
  request: IncomingMessage,
  response: ServerResponse,
  store: AgentConfigStore,
): Promise<boolean> {
  if (request.method === "GET" && request.url === "/agent/config") {
    sendJson(response, 200, { config: store.get() });
    return true;
  }

  if (request.method === "POST" && request.url === "/agent/config") {
    const body = await readJsonBody(request);
    const systemPrompt = validatePromptRequest(body);

    if (!systemPrompt) {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with non-empty { systemPrompt }.",
      });
      return true;
    }

    const config = store.set(systemPrompt);
    sendJson(response, 200, { ok: true, config });
    return true;
  }

  return false;
}
