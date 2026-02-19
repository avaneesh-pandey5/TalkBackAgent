# TalkBackAgent

Voice assistant app built with:

- React frontend (`/`)
- Node API server (`/server`)
- LiveKit Agents worker (`/server/src/agent`)
- LiveKit for realtime audio transport

## Setup

1. Install dependencies.

```bash
# repo root
npm install

# backend/agent
cd server
npm install
```

2. Create environment files.

- Root: `.env`
- Server: `server/.env.local` (preferred for secrets)

3. Start a LiveKit server (local or cloud; see below).

4. Run backend API, backend agent worker, and frontend.

## Environment Variables

### Backend (`server/.env.local` or root `.env`)

Required:

```bash
LIVEKIT_URL=ws://localhost:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
OPENAI_API_KEY=...
```

Optional:

```bash
API_PORT=8787
CHROMA_URL=http://localhost:8000
CHROMA_COLLECTION=talkback_kb

# Optional override used by the agent worker for API calls.
API_BASE_URL=http://localhost:8787
AGENT_CONFIG_API_BASE_URL=http://localhost:8787
```

Provider keys (required by your selected voice pipeline providers):

```bash
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
OPENAI_API_KEY=...
```

Notes:

- `OPENAI_API_KEY` is required by this codebase for KB embeddings.
- The agent currently uses `deepgram/nova-3:multi` (STT), `openai/gpt-4.1-mini` (LLM), and `cartesia/sonic-3:...` (TTS).

### Frontend (root `.env`)

Optional:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

## Run Frontend + Backend

Use three terminals.

Terminal 1: API server

```bash
cd server
npm run dev:api
```

Terminal 2: LiveKit agent worker

```bash
cd server
npm run dev:agent
```

If first worker run in this repo:

```bash
cd server
npm run download-files
```

Terminal 3: frontend

```bash
cd .
npm run dev
```

Open the frontend URL printed by Vite, then click `Connect`.

## Run LiveKit

### Option A: Local LiveKit (recommended for development)

Install `livekit-server`, then run:

```bash
livekit-server --dev
```

Defaults in dev mode:

- API key: `devkey`
- API secret: `secret`
- URL: `ws://localhost:7880`

If you need LAN access from other devices:

```bash
livekit-server --dev --bind 0.0.0.0
```

### Option B: LiveKit Cloud

1. Create a LiveKit Cloud project.
2. Copy Project URL, API key, and API secret.
3. Set:

```bash
LIVEKIT_URL=wss://<your-project>.livekit.cloud
LIVEKIT_API_KEY=<cloud-api-key>
LIVEKIT_API_SECRET=<cloud-api-secret>
```

4. Restart API + agent worker after updating env vars.

## Known Limitations / Tradeoffs

- In-memory state:
  - Agent prompt config and per-room session state are stored in memory.
  - They reset on backend restart.
- KB metadata persistence gap:
  - Uploaded files are written to disk and vectors may be persisted in Chroma.
  - Document list metadata (`/kb/docs`) is in-memory and is not rebuilt on restart.
- Retrieval still blocks LLM start:
  - KB search still runs before LLM generation, so retrieval latency affects first token.
- Preemptive generation tradeoff:
  - Enabled to reduce perceived delay.
  - Can occasionally increase partial/aborted starts if user speech changes near turn boundaries.
- Limited observability:
  - No full latency metrics pipeline yet (STT/EOU/LLM/TTS p50/p95 not emitted).
