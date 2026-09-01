import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * GET /api/ai/status
 * Returns whether the OpenAI API key is configured server-side.
 * This lets the client conditionally enable/disable the AI button
 * without ever exposing the key to the browser.
 */
export async function GET() {
  const configured = Boolean(process.env.OPENAI_API_KEY?.trim());
  return NextResponse.json({ configured });
}
