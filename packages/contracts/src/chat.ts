import { z } from "zod";

import { Transaction } from "./transaction";

export const ChatRole = z.enum(["system", "user", "assistant"]);
export type ChatRole = z.infer<typeof ChatRole>;

export const ChatMessage = z.object({
  role: ChatRole,
  content: z.string(),
  created_at: z.number().int().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessage>;

export const ChatRequest = z.object({
  text: z.string().min(1),
  session_id: z.string().min(1).default("default"),
});
export type ChatRequest = z.infer<typeof ChatRequest>;

export const ChatResponseKind = z.enum(["transaction", "clarification", "error"]);
export type ChatResponseKind = z.infer<typeof ChatResponseKind>;

export const ChatResponse = z.object({
  kind: ChatResponseKind,
  message: z.string(),
  transaction: Transaction.optional(),
  question: z.string().optional(),
});
export type ChatResponse = z.infer<typeof ChatResponse>;
