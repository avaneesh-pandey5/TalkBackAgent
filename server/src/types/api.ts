export type TokenRequest = {
  roomName: string;
  identity: string;
};

export type TokenResponse = {
  token: string;
  url: string;
};

export type PromptConfig = {
  systemPrompt: string;
  updatedAt: string;
};

export type PromptConfigResponse = {
  config: PromptConfig;
};

export type PromptConfigUpdateRequest = {
  systemPrompt: string;
};

export type PromptConfigUpdateResponse = {
  ok: true;
  config: PromptConfig;
};

export type DispatchRequest = {
  roomName: string;
  agentName?: string;
  metadata?: unknown;
};

export type DispatchParsedRequest = {
  roomName: string;
  agentName: string;
  metadata: string;
};
