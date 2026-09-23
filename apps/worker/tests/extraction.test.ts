import type { ZodType, ZodTypeDef } from "zod";
import { describe, expect, it } from "vitest";

import type {
  AssistantMessage,
  ChatOptions,
  ContentPart,
  LLMProvider,
  Message,
} from "../src/llm/types";
import { extractExpense } from "../src/services/extract-expense";

class MockProvider implements LLMProvider {
  readonly name = "mock";
  readonly capabilities = { vision: false };

  constructor(private readonly result: unknown) {}

  async chat(_messages: Message[], _opts?: ChatOptions): Promise<AssistantMessage> {
    return { role: "assistant", content: "" };
  }

  // eslint-disable-next-line require-yield
  async *streamChat(_messages: Message[], _opts?: ChatOptions): AsyncIterable<string> {
    return;
  }

  async extractJson<T>(
    _content: ContentPart[],
    schema: ZodType<T, ZodTypeDef, unknown>,
    _opts?: ChatOptions,
  ): Promise<T> {
    return schema.parse(this.result);
  }
}

describe("extractExpense", () => {
  it("returns a structured transaction for a clear Persian expense", async () => {
    const provider = new MockProvider({
      kind: "transaction",
      amount: 120000,
      currency: "IRT",
      category: null,
      counterparty: "حسن",
      description: "پرداخت ۱۲۰ هزار تومان به حسن",
      occurred_at: null,
    });

    const result = await extractExpense(provider, { text: "۱۲۰ هزار تومان به حسن دادم" });

    expect(result.kind).toBe("transaction");
    if (result.kind === "transaction") {
      expect(result.amount).toBe(120000);
      expect(result.counterparty).toBe("حسن");
    }
  });

  it("passes through a clarification instead of guessing", async () => {
    const provider = new MockProvider({ kind: "clarification", question: "چقدر پرداخت کردی؟" });

    const result = await extractExpense(provider, { text: "بابک پول دادم" });

    expect(result.kind).toBe("clarification");
    if (result.kind === "clarification") {
      expect(result.question).toBe("چقدر پرداخت کردی؟");
    }
  });

  it("rejects an extraction that invents no amount", async () => {
    const provider = new MockProvider({
      kind: "transaction",
      currency: "IRT",
      category: null,
      counterparty: null,
      description: "missing amount",
      occurred_at: null,
    });

    await expect(extractExpense(provider, { text: "یه چیزی خریدم" })).rejects.toThrow();
  });
});
