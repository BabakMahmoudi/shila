import type { Transaction, TransactionSource } from "@shila/contracts";

export function nowMs(): number {
  return Date.now();
}

export function newId(): string {
  return crypto.randomUUID();
}

export interface InsertTransactionInput {
  amount: number;
  currency?: string;
  category?: string | null;
  counterparty?: string | null;
  description?: string;
  source?: TransactionSource;
  raw_text?: string | null;
  /** Epoch milliseconds. Defaults to now when omitted. */
  occurred_at?: number | null;
}

/**
 * Persists a transaction for `userId`. All queries are scoped by user.
 */
export async function insertTransaction(
  db: D1Database,
  userId: string,
  input: InsertTransactionInput,
): Promise<Transaction> {
  const tx: Transaction = {
    id: newId(),
    user_id: userId,
    amount: input.amount,
    currency: input.currency ?? "IRT",
    category: input.category ?? null,
    counterparty: input.counterparty ?? null,
    description: input.description ?? "",
    source: input.source ?? "text",
    raw_text: input.raw_text ?? null,
    occurred_at: input.occurred_at ?? nowMs(),
    created_at: nowMs(),
  };

  await db
    .prepare(
      `INSERT INTO transactions
         (id, user_id, amount, currency, category, counterparty, description,
          source, raw_text, occurred_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      tx.id,
      tx.user_id,
      tx.amount,
      tx.currency,
      tx.category,
      tx.counterparty,
      tx.description,
      tx.source,
      tx.raw_text,
      tx.occurred_at,
      tx.created_at,
    )
    .run();

  return tx;
}

export async function listTransactions(
  db: D1Database,
  userId: string,
  limit = 50,
): Promise<Transaction[]> {
  const result = await db
    .prepare(
      `SELECT * FROM transactions
       WHERE user_id = ?
       ORDER BY COALESCE(occurred_at, created_at) DESC
       LIMIT ?`,
    )
    .bind(userId, limit)
    .all<Transaction>();

  return result.results ?? [];
}
