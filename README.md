# TalkBackAgent

This project is basically a clone of ChatGPT's Talking Agent (but better).

## Run The Stack

### Backend API

```bash
cd server
npm run dev:api
```

### Backend Agent Worker

```bash
cd server
npm run dev:agent
```

If this is the first worker run in this repo, download model assets once:

```bash
cd server
npm run download-files
```

### Frontend

```bash
cd ..
npm run dev
```

## Environment

Required backend env vars in `server/.env.local` (or root `.env`):

```bash
LIVEKIT_API_KEY=...
LIVEKIT_API_SECRET=...
LIVEKIT_URL=wss://<your-livekit-host>
API_PORT=8787
```

Frontend API base URL (optional) in root `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8787
```

## Test Checklist

1. Start API (`npm run dev:api`) and agent (`npm run dev:agent`) in `server/`.
2. Start frontend (`npm run dev`) from repo root.
3. In UI, keep `roomName` and `identity`, then click `Connect`.
4. Speak and confirm you hear remote agent audio.
5. Click `Mute Mic` / `Unmute Mic` and verify mic state changes while connected.
6. Click `Disconnect`, then reconnect to validate connect/disconnect reliability.
7. In the prompt editor, change the prompt and click `Save Prompt`.
8. Disconnect and reconnect, then confirm agent behavior reflects the updated prompt.
