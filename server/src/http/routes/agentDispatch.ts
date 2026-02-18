import type { IncomingMessage, ServerResponse } from "node:http";
import type { EnvConfig } from "../../config/env.js";
import { LIVEKIT_ENV_ERROR, hasLiveKitCredentials } from "../../config/env.js";
import { createAgentDispatch } from "../../services/agentDispatchService.js";
import type { DispatchParsedRequest, DispatchRequest } from "../../types/api.js";
import { readJsonBody, sendJson } from "../../utils/http.js";

function validateDispatchRequest(body: unknown): DispatchParsedRequest | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as DispatchRequest;
  const roomName = candidate.roomName;
  const agentNameRaw = candidate.agentName;

  if (typeof roomName !== "string" || !roomName.trim()) return null;

  const agentName =
    typeof agentNameRaw === "string" && agentNameRaw.trim()
      ? agentNameRaw.trim()
      : "my-agent";

  let metadata = "";
  if (typeof candidate.metadata === "string") {
    metadata = candidate.metadata;
  } else if (candidate.metadata && typeof candidate.metadata === "object") {
    metadata = JSON.stringify(candidate.metadata);
  }

  return {
    roomName: roomName.trim(),
    agentName,
    metadata,
  };
}

export async function handleAgentDispatchRoute(
  request: IncomingMessage,
  response: ServerResponse,
  env: EnvConfig,
): Promise<boolean> {
  if (request.method !== "POST" || request.url !== "/agent/dispatch") {
    return false;
  }

  if (!hasLiveKitCredentials(env)) {
    sendJson(response, 500, { error: LIVEKIT_ENV_ERROR });
    return true;
  }

  const body = await readJsonBody(request);
  const parsed = validateDispatchRequest(body);

  if (!parsed) {
    sendJson(response, 400, {
      error: "Invalid payload. Expected JSON body with { roomName, agentName? }.",
    });
    return true;
  }

  const dispatch = await createAgentDispatch(
    env.livekitUrl as string,
    env.livekitApiKey as string,
    env.livekitApiSecret as string,
    parsed.roomName,
    parsed.agentName,
    parsed.metadata || undefined,
  );

  sendJson(response, 200, {
    ok: true,
    dispatch,
  });
  return true;
}
