import { z } from "zod";

/**
 * The extraction contract. The LLM must return either a fully-formed transaction
 * or a clarification request. It must never invent amount, currency, or counterparty.
 */
export const ExtractedTransaction = z.object({
  kind: z.literal("transaction"),
  amount: z.number().int().positive(),
  currency: z.string().default("IRT"),
  category: z.string().nullable(),
  counterparty: z.string().nullable(),
  description: z.string(),
  occurred_at: z.string().nullable(),
});
export type ExtractedTransaction = z.infer<typeof ExtractedTransaction>;

export const Clarification = z.object({
  kind: z.literal("clarification"),
  question: z.string(),
});
export type Clarification = z.infer<typeof Clarification>;

export const ExpenseExtraction = z.discriminatedUnion("kind", [
  ExtractedTransaction,
  Clarification,
]);
export type ExpenseExtraction = z.infer<typeof ExpenseExtraction>;
