import type { Transaction } from "@shila/contracts";

import {
  insertTransaction,
  listTransactions,
  type InsertTransactionInput,
} from "../db";

export async function createTransaction(
  db: D1Database,
  userId: string,
  input: InsertTransactionInput,
): Promise<Transaction> {
  return insertTransaction(db, userId, input);
}

export async function getRecentTransactions(
  db: D1Database,
  userId: string,
  limit = 50,
): Promise<Transaction[]> {
  return listTransactions(db, userId, limit);
}

export function formatToman(amount: number): string {
  return new Intl.NumberFormat("fa-IR").format(amount);
}

/** Persian confirmation shown in chat after a successful insert. */
export function confirmationMessage(tx: Transaction): string {
  const parts = [`${formatToman(tx.amount)} تومان`];
  if (tx.counterparty) {
    parts.push(`به ${tx.counterparty}`);
  }
  if (tx.category) {
    parts.push(`(${tx.category})`);
  }
  const occurred = tx.occurred_at ? new Date(tx.occurred_at) : null;
  const when =
    occurred && !Number.isNaN(occurred.getTime())
      ? ` در ${new Intl.DateTimeFormat("fa-IR", { dateStyle: "short" }).format(occurred)}`
      : "";
  return `ثبت شد: ${parts.join(" ")}${when}.`;
}
