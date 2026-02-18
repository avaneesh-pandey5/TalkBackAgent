import path from "node:path";
import { getEnvConfig, loadEnvFile } from "./config/env.js";
import { createAppServer } from "./http/app.js";
import { OpenAIEmbedder } from "./rag/embed/openai.js";
import { KbService, createVectorStore } from "./rag/kbService.js";
import { createDefaultAgentConfigStore } from "./services/agentConfigStore.js";

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile("../.env");
loadEnvFile("../.env.local");

const env = getEnvConfig();

async function bootstrap(): Promise<void> {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is required for KB embeddings.");
  }

  const embedder = new OpenAIEmbedder(env.openaiApiKey);
  const { store, backend } = await createVectorStore(env.chromaUrl, env.chromaCollection);
  console.log(`KB vector store backend: ${backend}`);

  const uploadDir = path.resolve(process.cwd(), "storage", "uploads");
  const kbService = new KbService(store, embedder, uploadDir);

  const agentConfigStore = createDefaultAgentConfigStore();
  const server = createAppServer({ env, agentConfigStore, kbService });

  server.listen(env.apiPort, () => {
    console.log(`Token API listening on http://localhost:${env.apiPort}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Failed to start API server", error);
  process.exit(1);
});
