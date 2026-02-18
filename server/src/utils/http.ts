import type { IncomingMessage, ServerResponse } from "node:http";
import { RequestBodyTooLargeError } from "./errors.js";

export const MAX_BODY_BYTES = 1024 * 1024;

export function applyCors(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  applyCors(response);
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;

  for await (const chunk of request) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bufferChunk.length;

    if (total > MAX_BODY_BYTES) {
      throw new RequestBodyTooLargeError();
    }

    chunks.push(bufferChunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};

  return JSON.parse(raw) as unknown;
}
