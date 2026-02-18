import type { PromptConfig } from "../types/api.js";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful voice AI assistant.";

type PromptConfigCache = {
  config: PromptConfig;
  expiresAt: number;
};

function normalizePrompt(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function getDefaultConfig(): PromptConfig {
  return {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };
}

function parsePromptConfig(body: unknown): PromptConfig | null {
  if (!body || typeof body !== "object") return null;

  const config = (body as { config?: unknown }).config;
  if (!config || typeof config !== "object") return null;

  const systemPrompt = (config as { systemPrompt?: unknown }).systemPrompt;
  const updatedAt = (config as { updatedAt?: unknown }).updatedAt;

  if (typeof systemPrompt !== "string" || typeof updatedAt !== "string") return null;

  const normalized = normalizePrompt(systemPrompt);
  if (!normalized) return null;

  return {
    systemPrompt: normalized,
    updatedAt,
  };
}

export type PromptConfigClientOptions = {
  apiBaseUrl: string;
  ttlMs?: number;
};

export class PromptConfigClient {
  private readonly apiBaseUrl: string;
  private readonly ttlMs: number;
  private cache: PromptConfigCache | null = null;

  constructor(options: PromptConfigClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, "");
    this.ttlMs = options.ttlMs ?? 3000;
  }

  async getPromptConfig(): Promise<PromptConfig> {
    const now = Date.now();
    if (this.cache && this.cache.expiresAt > now) {
      return this.cache.config;
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/agent/config`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const json = (await response.json()) as unknown;
      const parsed = parsePromptConfig(json);
      if (!parsed) {
        throw new Error("Invalid config response shape");
      }

      this.cache = {
        config: parsed,
        expiresAt: now + this.ttlMs,
      };
      return parsed;
    } catch (error) {
      if (this.cache) {
        return this.cache.config;
      }

      console.error("Failed to load prompt config from API, using default prompt.", error);
      const fallback = getDefaultConfig();
      this.cache = {
        config: fallback,
        expiresAt: now + this.ttlMs,
      };
      return fallback;
    }
  }

  async getSystemPrompt(): Promise<string> {
    const config = await this.getPromptConfig();
    return config.systemPrompt;
  }
}

export function resolveApiBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const explicit = env.AGENT_CONFIG_API_BASE_URL ?? env.API_BASE_URL;
  if (explicit && explicit.trim()) {
    return explicit.trim().replace(/\/+$/, "");
  }

  const apiPort = Number(env.API_PORT ?? 8787);
  const port = Number.isFinite(apiPort) && apiPort > 0 ? apiPort : 8787;
  return `http://localhost:${port}`;
}
