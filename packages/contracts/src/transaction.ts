import { z } from "zod";

/**
 * A financial transaction. Amounts are always integer Toman (1 KT = 1,000 Toman).
 * Every transaction belongs to exactly one user.
 */
export const TransactionSource = z.enum(["text", "voice", "image"]);
export type TransactionSource = z.infer<typeof TransactionSource>;

export const Transaction = z.object({
  id: z.string(),
  user_id: z.string(),
  amount: z.number().int().positive(),
  currency: z.string().default("IRT"),
  category: z.string().nullable(),
  counterparty: z.string().nullable(),
  description: z.string(),
  source: TransactionSource.default("text"),
  raw_text: z.string().nullable(),
  occurred_at: z.number().int().nullable(),
  created_at: z.number().int(),
});
export type Transaction = z.infer<typeof Transaction>;

/**
 * Input accepted when persisting a new transaction. `id` and timestamps are
 * assigned by the storage layer.
 */
export const CreateTransaction = z.object({
  amount: z.number().int().positive(),
  currency: z.string().default("IRT"),
  category: z.string().nullable().default(null),
  counterparty: z.string().nullable().default(null),
  description: z.string().default(""),
  source: TransactionSource.default("text"),
  raw_text: z.string().nullable().default(null),
  occurred_at: z.number().int().nullable().default(null),
});
export type CreateTransaction = z.infer<typeof CreateTransaction>;
