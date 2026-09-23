import { ChatRequest, type ChatResponse } from "@shila/contracts";
import { Hono } from "hono";

import { resolveUser } from "../auth/placeholder";
import { createProvider } from "../llm";
import { D1Memory } from "../memory/d1-memory";
import { extractExpense } from "../services/extract-expense";
import { confirmationMessage, createTransaction } from "../services/transactions";
import type { AppBindings } from "../types";

export const chatRoute = new Hono<AppBindings>();

function toEpochMs(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * End-to-end v1 slice:
 * message -> memory -> extraction -> validate -> D1 insert -> Persian reply.
 */
chatRoute.post("/", async (c) => {
  const body: unknown = await c.req.json().catch(() => null);
  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { kind: "error", message: "درخواست نامعتبر است." } satisfies ChatResponse,
      400,
    );
  }

  const { text, session_id: sessionId } = parsed.data;
  const user = await resolveUser(c);
  const memory = new D1Memory(c.env.DB);

  try {
    await memory.appendMessage(user.id, sessionId, { role: "user", content: text });
    const history = await memory.getHistory(user.id, sessionId, 10);

    const provider = createProvider(c.env);
    const extraction = await extractExpense(provider, {
      text,
      history: history.slice(0, -1),
    });

    let response: ChatResponse;

    if (extraction.kind === "transaction") {
      const tx = await createTransaction(c.env.DB, user.id, {
        amount: extraction.amount,
        currency: extraction.currency,
        category: extraction.category,
        counterparty: extraction.counterparty,
        description: extraction.description,
        source: "text",
        raw_text: text,
        occurred_at: toEpochMs(extraction.occurred_at),
      });
      response = { kind: "transaction", message: confirmationMessage(tx), transaction: tx };
    } else {
      response = { kind: "clarification", message: extraction.question, question: extraction.question };
    }

    await memory.appendMessage(user.id, sessionId, { role: "assistant", content: response.message });
    return c.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای ناشناخته";
    return c.json(
      { kind: "error", message: `متأسفم، پردازش پیام ممکن نشد: ${message}` } satisfies ChatResponse,
      500,
    );
  }
});
