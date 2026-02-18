import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from "@livekit/agents";
import * as livekit from "@livekit/agents-plugin-livekit";
import * as silero from "@livekit/agents-plugin-silero";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "../config/env.js";
import { Agent } from "./agent.js";
import { KbSearchClient } from "./kbSearchClient.js";
import { PromptConfigClient, resolveApiBaseUrl } from "./promptConfigClient.js";
import { SessionStateClient } from "./sessionStateClient.js";

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile("../.env");
loadEnvFile("../.env.local");

const promptConfigClient = new PromptConfigClient({
  apiBaseUrl: resolveApiBaseUrl(),
  ttlMs: 3000,
});
const apiBaseUrl = resolveApiBaseUrl();
const kbSearchClient = new KbSearchClient(apiBaseUrl);
const sessionStateClient = new SessionStateClient(apiBaseUrl);

function resolveRoomName(ctx: JobContext): string {
  const fromRoom = ctx.room.name;
  if (typeof fromRoom === "string" && fromRoom.trim()) {
    return fromRoom.trim();
  }

  const fromJob = ctx.job.room?.name;
  if (typeof fromJob === "string" && fromJob.trim()) {
    return fromJob.trim();
  }

  return "unknown-room";
}

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad as silero.VAD;
    const systemPrompt = await promptConfigClient.getSystemPrompt();
    const roomName = resolveRoomName(ctx);

    const session = new voice.AgentSession({
      vad,
      stt: "deepgram/nova-3:multi",
      llm: "openai/gpt-4.1-mini",
      tts: "cartesia/sonic-3:9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    await session.start({
      agent: new Agent({
        systemPrompt,
        roomName,
        kbSearchClient,
        sessionStateClient,
      }),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    session.on("conversation_item_added", (event) => {
      if (event.item.type !== "message" || event.item.role !== "assistant") return;
      const text = event.item.textContent?.trim();
      if (!text) return;

      void sessionStateClient.updateRoomState(roomName, {
        lastAnswer: text,
      });
    });

    await ctx.connect();

    session.generateReply({
      instructions: `Greet the user and offer your assistance. System prompt: ${systemPrompt}`,
    });
  },
});

cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: "my-agent",
  }),
);
