import type { Env } from "../types";
import { OpenAICompatibleProvider } from "./openai-compatible";
import type { LLMProvider } from "./types";

export function createDeepSeekProvider(env: Env): LLMProvider {
  return new OpenAICompatibleProvider({
    name: "deepseek",
    apiKey: env.DEEPSEEK_API_KEY ?? "",
    baseURL: env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1",
    defaultModel: env.SHILA_MODEL ?? "deepseek-chat",
    // DeepSeek's hosted API is text-only today; the flag is future-proofing.
    vision: false,
    maxTokensField: "max_tokens",
  });
}
