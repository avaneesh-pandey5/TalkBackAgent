import type { IncomingMessage, ServerResponse } from "node:http";
import type { EnvConfig } from "../../config/env.js";
import { LIVEKIT_ENV_ERROR, hasLiveKitCredentials } from "../../config/env.js";
import { createLiveKitToken } from "../../services/livekitTokenService.js";
import type { TokenRequest } from "../../types/api.js";
import { readJsonBody, sendJson } from "../../utils/http.js";

function validateTokenRequest(body: unknown): TokenRequest | null {
  if (!body || typeof body !== "object") return null;

  const candidate = body as Partial<TokenRequest>;
  const roomName = candidate.roomName;
  const identity = candidate.identity;

  if (typeof roomName !== "string" || typeof identity !== "string") return null;

  const trimmedRoom = roomName.trim();
  const trimmedIdentity = identity.trim();
  if (!trimmedRoom || !trimmedIdentity) return null;

  return {
    roomName: trimmedRoom,
    identity: trimmedIdentity,
  };
}

export async function handleLiveKitTokenRoute(
  request: IncomingMessage,
  response: ServerResponse,
  env: EnvConfig,
): Promise<boolean> {
  if (request.method !== "POST" || request.url !== "/livekit/token") {
    return false;
  }

  if (!hasLiveKitCredentials(env)) {
    sendJson(response, 500, { error: LIVEKIT_ENV_ERROR });
    return true;
  }

  const body = await readJsonBody(request);
  const parsed = validateTokenRequest(body);

  if (!parsed) {
    sendJson(response, 400, {
      error: "Invalid payload. Expected JSON body with { roomName, identity }.",
    });
    return true;
  }

  const token = createLiveKitToken(
    parsed.roomName,
    parsed.identity,
    env.livekitApiKey as string,
    env.livekitApiSecret as string,
  );

  sendJson(response, 200, {
    token,
    url: env.livekitUrl,
  });
  return true;
}
