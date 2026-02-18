import { existsSync, readFileSync } from "node:fs";

export type EnvConfig = {
  apiPort: number;
  livekitUrl?: string;
  livekitApiKey?: string;
  livekitApiSecret?: string;
};

export function loadEnvFile(pathname: string): void {
  if (!existsSync(pathname)) return;

  const content = readFileSync(pathname, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIdx = line.indexOf("=");
    if (eqIdx < 0) continue;

    const key = line.slice(0, eqIdx).trim();
    const value = line.slice(eqIdx + 1).trim();
    if (!key || process.env[key] !== undefined) continue;

    process.env[key] = value;
  }
}

export function getEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  const apiPortRaw = env.API_PORT;
  const apiPort = Number(apiPortRaw ?? 8787);

  return {
    apiPort: Number.isFinite(apiPort) && apiPort > 0 ? apiPort : 8787,
    livekitUrl: env.LIVEKIT_URL,
    livekitApiKey: env.LIVEKIT_API_KEY,
    livekitApiSecret: env.LIVEKIT_API_SECRET,
  };
}

export function hasLiveKitCredentials(config: EnvConfig): boolean {
  return Boolean(config.livekitApiKey && config.livekitApiSecret && config.livekitUrl);
}

export const LIVEKIT_ENV_ERROR =
  "Server misconfigured: LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_URL are required.";
