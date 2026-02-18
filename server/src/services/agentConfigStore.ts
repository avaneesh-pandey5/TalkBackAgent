import type { PromptConfig } from "../types/api.js";

const DEFAULT_SYSTEM_PROMPT = "You are a helpful voice AI assistant.";

export interface AgentConfigStore {
  get(): PromptConfig;
  set(systemPrompt: string): PromptConfig;
}

export function normalizeSystemPrompt(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function createDefaultConfig(): PromptConfig {
  return {
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };
}

export function createInMemoryAgentConfigStore(
  initialPrompt = DEFAULT_SYSTEM_PROMPT,
): AgentConfigStore {
  const sanitizedInitial = normalizeSystemPrompt(initialPrompt);
  let current: PromptConfig = {
    systemPrompt: sanitizedInitial || DEFAULT_SYSTEM_PROMPT,
    updatedAt: new Date().toISOString(),
  };

  return {
    get() {
      return current;
    },
    set(systemPrompt: string) {
      const next: PromptConfig = {
        systemPrompt: normalizeSystemPrompt(systemPrompt),
        updatedAt: new Date().toISOString(),
      };
      current = next;
      return current;
    },
  };
}

export function createDefaultAgentConfigStore(): AgentConfigStore {
  return createInMemoryAgentConfigStore(createDefaultConfig().systemPrompt);
}
