import type { ChatMessage } from "@shila/contracts";

import { newId, nowMs } from "../db";
import type { Memory } from "./types";

/**
 * D1-backed {@link Memory}. Sessions are scoped by `(user_id, session_id)`;
 * all reads are per-user.
 */
export class D1Memory implements Memory {
  constructor(private readonly db: D1Database) {}

  async appendMessage(userId: string, sessionId: string, message: ChatMessage): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO messages (id, user_id, session_id, role, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(newId(), userId, sessionId, message.role, message.content, message.created_at ?? nowMs())
      .run();
  }

  async getHistory(userId: string, sessionId: string, limit = 20): Promise<ChatMessage[]> {
    const result = await this.db
      .prepare(
        `SELECT role, content, created_at FROM messages
         WHERE user_id = ? AND session_id = ?
         ORDER BY created_at DESC, rowid DESC
         LIMIT ?`,
      )
      .bind(userId, sessionId, limit)
      .all<ChatMessage>();

    // Query returns newest-first for the LIMIT; callers expect chronological order.
    return (result.results ?? []).reverse();
  }

  async getContext(userId: string, key: string): Promise<string | null> {
    const row = await this.db
      .prepare(`SELECT value FROM context WHERE user_id = ? AND key = ?`)
      .bind(userId, key)
      .first<{ value: string }>();
    return row?.value ?? null;
  }

  async setContext(userId: string, key: string, value: string): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO context (user_id, key, value, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, key)
         DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      )
      .bind(userId, key, value, nowMs())
      .run();
  }
}
