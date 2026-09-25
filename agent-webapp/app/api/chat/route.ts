import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

export const runtime = "nodejs";
export const maxDuration = 60;

type AIConfig = {
  baseURL?: string;
  apiKey?: string;
  model?: string;
};

type ChatBody = {
  messages?: UIMessage[];
  userId?: string;
  aiConfig?: AIConfig;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ChatBody;
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const userId = clean(body.userId);

    if (!userId || userId.length > 128) {
      return Response.json({ error: "Missing or invalid userId." }, { status: 400 });
    }

    const composioApiKey = clean(process.env.COMPOSIO_API_KEY);
    if (!composioApiKey) {
      return Response.json(
        { error: "COMPOSIO_API_KEY is not configured on the server." },
        { status: 500 },
      );
    }

    const baseURL = clean(body.aiConfig?.baseURL) || clean(process.env.AI_BASE_URL);
    const apiKey = clean(body.aiConfig?.apiKey) || clean(process.env.AI_API_KEY);
    const modelId = clean(body.aiConfig?.model) || clean(process.env.AI_MODEL);

    if (!baseURL || !apiKey || !modelId) {
      return Response.json(
        {
          error:
            "AI provider is not configured. Enter Base URL, API key and model in Settings, or configure AI_BASE_URL, AI_API_KEY and AI_MODEL on the server.",
        },
        { status: 400 },
      );
    }

    const aiProvider = createOpenAICompatible({
      name: "custom",
      baseURL,
      apiKey,
      includeUsage: true,
    });

    const composio = new Composio({
      apiKey: composioApiKey,
      provider: new VercelProvider({ strict: true }),
    });

    // Intentionally omit a toolkit filter. Composio sessions then expose
    // meta-tools that can discover any toolkit in the catalog at runtime.
    const session = await composio.create(userId);
    const tools = await session.tools();

    const result = streamText({
      model: aiProvider(modelId),
      system: `You are Omni Agent, a capable general-purpose AI assistant with Composio tools.

Use tools whenever the user asks you to read or act in an external app.
Discover the correct tool before execution. If an app is not connected, initiate the Composio connection flow and clearly give the user the connection link.
Never claim an external action succeeded unless the tool result confirms it.
For destructive, irreversible, financial, publishing, or permission-changing actions, make sure the user's request explicitly authorizes the action before executing it.
Keep responses concise and report tool failures accurately.`,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(14),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return Response.json({ error: message }, { status: 500 });
  }
}
