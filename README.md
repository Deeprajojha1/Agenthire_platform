# AgentHire

Spec-driven multi-agent recruitment platform.

## Structure

- `client` contains the Next.js 15 JavaScript recruiter console and public candidate pages.
- `server` contains the modular Express JavaScript API, services, agents, workflows, uploads, and logs.
- `specs` contains the business-rule contract used by scoring, workflow order, retries, RAG, prompts, and node states.

## Local Run

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` plus `JWT_SECRET`.
2. Copy `client/.env.local.example` to `client/.env.local`.
3. Run MongoDB and optionally Qdrant on `localhost:6333`.
4. Install and start each app:

```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```
