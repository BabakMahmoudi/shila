import type { Env } from "../types";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./types";

export function createOpenAIProvider(env: Env): LLMProvider {
  return new OpenAICompatibleProvider({
    name: "openai",
    apiKey: env.OPENAI_API_KEY ?? "",
    baseURL: env.OPENAI_BASE_URL,
    defaultModel: env.SHILA_MODEL ?? "gpt-4o-mini",
    vision: true,
    maxTokensField: "max_completion_tokens",
  });
}
