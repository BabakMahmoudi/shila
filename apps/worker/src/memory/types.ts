import type { ChatMessage } from "@shila/contracts";

/**
 * Conversation + context storage.
 *
 * The surface deliberately mirrors the Cloudflare Agents Session API
 * (history plus context blocks) so the D1 backing can later be swapped for
 * `agents/experimental/memory/session` without touching callers. Keep the
 * method names stable.
 */
export interface Memory {
  appendMessage(userId: string, sessionId: string, message: ChatMessage): Promise<void>;
  getHistory(userId: string, sessionId: string, limit?: number): Promise<ChatMessage[]>;
  getContext(userId: string, key: string): Promise<string | null>;
  setContext(userId: string, key: string, value: string): Promise<void>;
}
