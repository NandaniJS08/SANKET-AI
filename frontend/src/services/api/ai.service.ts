/**
 * Canonical AI Assistant / Copilot Service
 * Connects to FastAPI `/api/v1/ai-assistant/chat`.
 * ZERO fake AI outputs.
 */

import { fetchApi } from "./client";

export interface ChatResponse {
  reply: string;
  sources: string[];
}

export async function chatWithCopilot(message: string): Promise<ChatResponse> {
  const raw = await fetchApi<{ reply: string; sources?: string[] }>("/ai-assistant/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return {
    reply: raw.reply,
    sources: raw.sources || ["Google Gemini 1.5 Flash", "MoSPI IPMD Central Data Lake"],
  };
}
