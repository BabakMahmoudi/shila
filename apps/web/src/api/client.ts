import type { ChatRequest, ChatResponse } from "@shila/contracts";

const API_BASE = "/api";

export async function sendChat(text: string): Promise<ChatResponse> {
  const body: ChatRequest = { text, session_id: "default" };
  const response = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`درخواست ناموفق بود (${response.status})`);
  }

  return (await response.json()) as ChatResponse;
}
