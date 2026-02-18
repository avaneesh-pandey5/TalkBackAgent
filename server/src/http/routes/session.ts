import type { IncomingMessage, ServerResponse } from "node:http";
import type { SessionSource, SessionStore } from "../../session/sessionStore.js";
import { readJsonBody, sendJson } from "../../utils/http.js";

function getPathWithoutQuery(urlValue: string): string {
  const queryIndex = urlValue.indexOf("?");
  return queryIndex === -1 ? urlValue : urlValue.slice(0, queryIndex);
}

function parseRoomPath(pathname: string): string | null {
  const match = pathname.match(/^\/session\/([^/]+)\/state$/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}

function validateSources(value: unknown): SessionSource[] | null {
  if (!Array.isArray(value)) return null;

  const out: SessionSource[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const docId = (item as { docId?: unknown }).docId;
    const docTitle = (item as { docTitle?: unknown }).docTitle;
    const chunkId = (item as { chunkId?: unknown }).chunkId;
    const snippet = (item as { snippet?: unknown }).snippet;

    if (
      typeof docId !== "string" ||
      typeof docTitle !== "string" ||
      typeof chunkId !== "string" ||
      typeof snippet !== "string"
    ) {
      return null;
    }

    out.push({ docId, docTitle, chunkId, snippet });
  }

  return out;
}

export async function handleSessionRoutes(
  request: IncomingMessage,
  response: ServerResponse,
  sessionStore: SessionStore,
): Promise<boolean> {
  const method = request.method ?? "GET";
  const pathname = getPathWithoutQuery(request.url ?? "/");
  const roomName = parseRoomPath(pathname);
  if (!roomName) return false;

  if (method === "GET") {
    const state = sessionStore.get(roomName);
    if (!state) {
      sendJson(response, 404, { error: "Session not found." });
      return true;
    }
    sendJson(response, 200, state);
    return true;
  }

  if (method === "POST") {
    const body = await readJsonBody(request);
    if (!body || typeof body !== "object") {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with { sources?, lastAnswer? }.",
      });
      return true;
    }

    const rawSources = (body as { sources?: unknown }).sources;
    const rawLastAnswer = (body as { lastAnswer?: unknown }).lastAnswer;

    const sources = rawSources === undefined ? undefined : validateSources(rawSources);
    if (rawSources !== undefined && !sources) {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with { sources?, lastAnswer? }.",
      });
      return true;
    }

    if (rawLastAnswer !== undefined && typeof rawLastAnswer !== "string") {
      sendJson(response, 400, {
        error: "Invalid payload. Expected JSON body with { sources?, lastAnswer? }.",
      });
      return true;
    }

    const state = sessionStore.upsert(roomName, {
      sources,
      lastAnswer: rawLastAnswer,
    });
    sendJson(response, 200, state);
    return true;
  }

  sendJson(response, 405, { error: "Method not allowed." });
  return true;
}
