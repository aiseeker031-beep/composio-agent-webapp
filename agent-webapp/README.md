# Omni Composio Agent

A standalone Next.js web app inside the Composio fork. It uses Composio sessions and Vercel AI SDK so the model can discover and execute tools across the full Composio toolkit catalog at runtime.

## Important behavior

- No toolkit allow-list is passed to `composio.create(userId)`, so every toolkit in the catalog is discoverable.
- Tool schemas are discovered dynamically instead of injecting thousands of tools into the model context.
- A toolkit being discoverable does **not** mean the user's account is connected. Composio handles connection/auth flows when a requested app needs authorization.
- The AI model can use any OpenAI-compatible endpoint. The Base URL, API key and model can be entered in the UI, or configured with environment variables.

## Local setup

```bash
cd agent-webapp
npm install
cp .env.example .env.local
npm run dev
```

Required:

```env
COMPOSIO_API_KEY=...
```

Optional server-side AI defaults:

```env
AI_BASE_URL=https://your-provider.example/v1
AI_API_KEY=...
AI_MODEL=your-model-id
```

## Vercel

Create a Vercel project from this repository and set the Root Directory to:

```
agent-webapp
```

Use Node.js 22 and add `COMPOSIO_API_KEY` as an environment variable. You can also add `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` if you want server defaults.

The app deliberately keeps `COMPOSIO_API_KEY` server-side. AI API keys entered in the Settings modal are sent with the chat request and are not saved by the UI.
