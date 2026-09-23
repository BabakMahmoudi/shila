import { describe, expect, it } from "vitest";

import { ChatRequest, CreateTransaction, ExpenseExtraction } from "../src/index";

describe("ExpenseExtraction", () => {
  it("accepts a well-formed transaction", () => {
    const result = ExpenseExtraction.safeParse({
      kind: "transaction",
      amount: 120000,
      category: null,
      counterparty: "حسن",
      description: "پرداخت",
      occurred_at: null,
    });

    expect(result.success).toBe(true);
    if (result.success && result.data.kind === "transaction") {
      expect(result.data.currency).toBe("IRT");
      expect(result.data.amount).toBe(120000);
    }
  });

  it("accepts a clarification", () => {
    const result = ExpenseExtraction.safeParse({
      kind: "clarification",
      question: "چقدر پرداخت کردی؟",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a transaction without an amount", () => {
    const result = ExpenseExtraction.safeParse({
      kind: "transaction",
      currency: "IRT",
      category: null,
      counterparty: null,
      description: "no amount",
      occurred_at: null,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer (float) amounts", () => {
    const result = ExpenseExtraction.safeParse({
      kind: "transaction",
      amount: 120.5,
      category: null,
      counterparty: null,
      description: "float",
      occurred_at: null,
    });
    expect(result.success).toBe(false);
  });
});

describe("CreateTransaction", () => {
  it("defaults currency, source, and nullables", () => {
    const result = CreateTransaction.parse({ amount: 5000 });
    expect(result.currency).toBe("IRT");
    expect(result.source).toBe("text");
    expect(result.category).toBeNull();
  });
});

describe("ChatRequest", () => {
  it("defaults the session id and rejects empty text", () => {
    expect(ChatRequest.parse({ text: "سلام" }).session_id).toBe("default");
    expect(ChatRequest.safeParse({ text: "" }).success).toBe(false);
  });
});
