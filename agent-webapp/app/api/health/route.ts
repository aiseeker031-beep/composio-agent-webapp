export const runtime = "nodejs";

export async function GET() {
  return Response.json(
    {
      ok: true,
      composioConfigured: Boolean(process.env.COMPOSIO_API_KEY),
      serverAIConfigured: Boolean(
        process.env.AI_BASE_URL && process.env.AI_API_KEY && process.env.AI_MODEL,
      ),
      toolAccess: "dynamic",
    },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
