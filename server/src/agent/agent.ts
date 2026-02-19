import { llm, voice, type ChatContext, type ToolContext } from "@livekit/agents";
import type { KbSearchClient } from "./kbSearchClient.js";
import type { SessionStateClient } from "./sessionStateClient.js";

type AgentDeps = {
  systemPrompt: string;
  roomName: string;
  kbSearchClient: KbSearchClient;
  sessionStateClient: SessionStateClient;
};

function getLastUserQuery(chatCtx: ChatContext): string {
  for (let index = chatCtx.items.length - 1; index >= 0; index -= 1) {
    const item = chatCtx.items[index];
    if (item?.type !== "message" || item.role !== "user") continue;
    const text = item.textContent?.trim();
    if (text) return text;
  }
  return "";
}

function buildKbContextBlock(
  results: Awaited<ReturnType<KbSearchClient["search"]>>,
): string {
  if (results.length === 0) {
    return "No relevant KB excerpts were found for this user query.";
  }

  const lines = results.map((result, index) => {
    return `[${index + 1}] (docTitle=${result.docTitle}, docId=${result.docId}, chunkId=${result.chunkId}, score=${result.score.toFixed(4)}): ${result.snippet}`;
  });

  return [
    "You have access to the following knowledge base excerpts (may be relevant):",
    ...lines,
    "Use these excerpts when useful. If they do not answer the question, say so clearly and avoid fabricating details.",
  ].join("\n");
}

export class Agent extends voice.Agent {
  private readonly roomName: string;
  private readonly kbSearchClient: KbSearchClient;
  private readonly sessionStateClient: SessionStateClient;

  constructor(deps: AgentDeps) {
    super({
      instructions: deps.systemPrompt,
    });

    this.roomName = deps.roomName;
    this.kbSearchClient = deps.kbSearchClient;
    this.sessionStateClient = deps.sessionStateClient;
  }

  override async llmNode(
    chatCtx: ChatContext,
    toolCtx: ToolContext,
    modelSettings: voice.ModelSettings,
  ) {
    const query = getLastUserQuery(chatCtx);
    const sources = query ? await this.kbSearchClient.search(query, 4) : [];

    void this.sessionStateClient.updateRoomState(this.roomName, {
      sources,
    });

    if (sources.length === 0) {
      return voice.Agent.default.llmNode(this, chatCtx, toolCtx, modelSettings);
    }

    const enriched = chatCtx.copy();
    enriched.addMessage({
      role: "system",
      content: buildKbContextBlock(sources),
    });

    return voice.Agent.default.llmNode(this, enriched, toolCtx, modelSettings);
  }

  override async onUserTurnCompleted(chatCtx: ChatContext, newMessage: llm.ChatMessage) {
    if (newMessage.role === "assistant") {
      const text = newMessage.textContent?.trim();
      if (text) {
        await this.sessionStateClient.updateRoomState(this.roomName, {
          lastAnswer: text,
        });
      }
    }
    return super.onUserTurnCompleted(chatCtx, newMessage);
  }
}
