import type { ZodType, ZodTypeDef } from "zod";

export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image_url: string };

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Request a JSON object response. */
  json?: boolean;
}

export interface AssistantMessage {
  role: "assistant";
  content: string;
}

/**
 * Provider-agnostic LLM surface. Capabilities drive routing (e.g. vision) so
 * callers never branch on a concrete provider.
 */
export interface LLMProvider {
  readonly name: string;
  readonly capabilities: { vision: boolean };
  chat(messages: Message[], opts?: ChatOptions): Promise<AssistantMessage>;
  streamChat(messages: Message[], opts?: ChatOptions): AsyncIterable<string>;
  extractJson<T>(
    content: ContentPart[],
    schema: ZodType<T, ZodTypeDef, unknown>,
    opts?: ChatOptions,
  ): Promise<T>;
}
