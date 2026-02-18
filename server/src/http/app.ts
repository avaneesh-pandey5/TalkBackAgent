import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { EnvConfig } from "../config/env.js";
import type { AgentConfigStore } from "../services/agentConfigStore.js";
import { HttpError, RequestBodyTooLargeError } from "../utils/errors.js";
import { applyCors, sendJson } from "../utils/http.js";
import { handleAgentConfigRoute } from "./routes/agentConfig.js";
import { handleAgentDispatchRoute } from "./routes/agentDispatch.js";
import { handleLiveKitTokenRoute } from "./routes/livekit.js";

type AppDependencies = {
  env: EnvConfig;
  agentConfigStore: AgentConfigStore;
};

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  deps: AppDependencies,
): Promise<void> {
  applyCors(response);

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (await handleAgentConfigRoute(request, response, deps.agentConfigStore)) {
    return;
  }

  if (await handleLiveKitTokenRoute(request, response, deps.env)) {
    return;
  }

  if (await handleAgentDispatchRoute(request, response, deps.env)) {
    return;
  }

  sendJson(response, 404, { error: "Not found" });
}

export function createAppServer(deps: AppDependencies) {
  return createServer(async (request, response) => {
    try {
      await handleRequest(request, response, deps);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.statusCode, { error: error.message });
        return;
      }

      if (error instanceof SyntaxError) {
        sendJson(response, 400, { error: "Malformed JSON body." });
        return;
      }

      if (error instanceof RequestBodyTooLargeError) {
        sendJson(response, 413, { error: "Request body too large." });
        return;
      }

      console.error("Unhandled server error", error);
      sendJson(response, 500, { error: "Internal server error." });
    }
  });
}
