import type { Env } from "../types";
import { createDeepSeekProvider } from "./deepseek";
import { createOpenAIProvider } from "./openai";
import type { LLMProvider } from "./types";

export * from "./types";

/**
 * Resolves the configured provider. Defaults to DeepSeek.
 * Add a case here when a new adapter lands.
 */
export function createProvider(env: Env): LLMProvider {
  switch ((env.SHILA_MODEL_PROVIDER ?? "deepseek").toLowerCase()) {
    case "openai":
      return createOpenAIProvider(env);
    case "deepseek":
    default:
      return createDeepSeekProvider(env);
  }
}
