import { HttpError } from "../utils/errors.js";

type DispatchResult = unknown;

type DispatchSdk = {
  AgentDispatchClient: new (
    livekitUrl: string,
    apiKey: string,
    apiSecret: string,
  ) => {
    createDispatch(
      roomName: string,
      agentName: string,
      metadata?: string,
    ): Promise<DispatchResult>;
  };
};

export async function createAgentDispatch(
  livekitUrl: string,
  apiKey: string,
  apiSecret: string,
  roomName: string,
  agentName: string,
  metadata?: string,
): Promise<DispatchResult> {
  const sdk = (await import("livekit-server-sdk").catch(() => null)) as DispatchSdk | null;

  if (!sdk || !sdk.AgentDispatchClient) {
    throw new HttpError(
      500,
      "livekit-server-sdk is not available. Install server dependencies.",
    );
  }

  const dispatchClient = new sdk.AgentDispatchClient(livekitUrl, apiKey, apiSecret);
  return dispatchClient.createDispatch(roomName, agentName, metadata);
}
