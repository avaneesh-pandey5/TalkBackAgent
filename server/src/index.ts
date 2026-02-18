import { getEnvConfig, loadEnvFile } from "./config/env.js";
import { createAppServer } from "./http/app.js";
import { createDefaultAgentConfigStore } from "./services/agentConfigStore.js";

loadEnvFile(".env");
loadEnvFile(".env.local");
loadEnvFile("../.env");
loadEnvFile("../.env.local");

const env = getEnvConfig();
const agentConfigStore = createDefaultAgentConfigStore();
const server = createAppServer({ env, agentConfigStore });

server.listen(env.apiPort, () => {
  console.log(`Token API listening on http://localhost:${env.apiPort}`);
});
