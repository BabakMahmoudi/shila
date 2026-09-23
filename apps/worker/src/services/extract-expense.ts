import { ExpenseExtraction } from "@shila/contracts";

import type { ContentPart, LLMProvider, Message } from "../llm/types";

/**
 * Persian extraction instructions. `json` appears literally because OpenAI and
 * DeepSeek JSON mode require the word in the prompt.
 */
export const EXTRACTION_PROMPT = `تو دستیار مالی «شیلا» هستی. پیام کاربر را به یک تراکنش مالی ساختاریافته تبدیل کن و فقط یک شیء json برگردان.

قواعد:
- مبلغ باید عدد صحیح به «تومان» باشد. اگر کاربر واحد دیگری گفته بود تبدیل کن:
  «KT» یا «کیلوتومان» یعنی ضربدر ۱۰۰۰ تومان؛ «هزار تومان» یعنی ضربدر ۱۰۰۰؛ «میلیون تومان» یعنی ضربدر ۱۰۰۰۰۰۰.
- ارقام فارسی (۱۲۰) و ترکیبی را به عدد لاتین تبدیل کن.
- «currency» فقط زمانی مقدار بده که واحد پول صریحاً ذکر شده باشد، وگرنه «IRT».
- «category» و «counterparty» را فقط اگر در متن آمده پر کن، در غیر این صورت null بگذار.
- «description» خلاصهٔ فارسی همان تراکنش است.
- «occurred_at» زمان وقوع به شکل ISO 8601 یا null اگر ذکر نشده باشد.
- اگر مبلغ یا یکی از اجزای ضروری مبهم/ناموجود باشد، هرگز حدس نزن؛ به‌جای آن خروجی را با این شکل برگردان:
  {"kind":"clarification","question":"سؤال کوتاه فارسی برای رفع ابهام"}
- در حالت موفق فقط این شکل را برگردان:
  {"kind":"transaction","amount":عدد,"currency":"IRT","category":string|null,"counterparty":string|null,"description":string,"occurred_at":string|null}`;

export interface ExtractExpenseInput {
  text: string;
  history?: Message[];
  now?: Date;
}

/**
 * Runs structured extraction over a single user message, optionally with
 * short-term history for resolving references ("همان", "او").
 */
export async function extractExpense(
  provider: LLMProvider,
  input: ExtractExpenseInput,
): Promise<ExpenseExtraction> {
  const historyText = (input.history ?? [])
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const sections = [
    `زمان فعلی (ISO): ${(input.now ?? new Date()).toISOString()}`,
    historyText ? `تاریخچه گفتگو:\n${historyText}` : "",
    `پیام کاربر:\n${input.text}`,
  ].filter(Boolean);

  const content: ContentPart[] = [
    { type: "text", text: EXTRACTION_PROMPT },
    { type: "text", text: sections.join("\n\n") },
  ];

  return provider.extractJson(content, ExpenseExtraction);
}
