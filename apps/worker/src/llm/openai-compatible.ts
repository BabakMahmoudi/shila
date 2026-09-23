import OpenAI from "openai";
import type { ZodType, ZodTypeDef } from "zod";

import type {
  AssistantMessage,
  ChatOptions,
  ContentPart,
  LLMProvider,
  Message,
} from "./types";

export interface OpenAICompatibleConfig {
  name: string;
  apiKey: string;
  baseURL?: string;
  defaultModel: string;
  vision?: boolean;
  /**
   * OpenAI's newer models reject `max_tokens` in favour of
   * `max_completion_tokens`; DeepSeek still uses `max_tokens`.
   */
  maxTokensField?: "max_tokens" | "max_completion_tokens";
}

const JSON_INSTRUCTION =
  "You must respond with a single valid json object and nothing else. " +
  "Do not wrap the json in markdown code fences.";

function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced?.[1] ?? trimmed;
}

/**
 * Shared adapter for every provider that speaks the OpenAI chat-completions
 * API (OpenAI, DeepSeek, and future compatible endpoints). Divergences are
 * expressed through {@link OpenAICompatibleConfig} rather than subclasses.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  private readonly client: OpenAI;

  constructor(private readonly config: OpenAICompatibleConfig) {
    this.client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
  }

  get name(): string {
    return this.config.name;
  }

  get capabilities(): { vision: boolean } {
    return { vision: this.config.vision ?? false };
  }

  async chat(messages: Message[], opts?: ChatOptions): Promise<AssistantMessage> {
    const params = this.buildParams(messages, opts);
    const completion = await this.client.chat.completions.create(params);
    return { role: "assistant", content: completion.choices[0]?.message?.content ?? "" };
  }

  async *streamChat(messages: Message[], opts?: ChatOptions): AsyncIterable<string> {
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming = {
      ...this.buildParams(messages, opts),
      stream: true,
    };
    const stream = await this.client.chat.completions.create(params);
    for await (const chunk of stream) {
      // DeepSeek may emit `reasoning_content` on the delta; we intentionally
      // only surface user-visible `content`.
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        yield delta;
      }
    }
  }

  async extractJson<T>(
    content: ContentPart[],
    schema: ZodType<T, ZodTypeDef, unknown>,
    opts?: ChatOptions,
  ): Promise<T> {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: JSON_INSTRUCTION },
      { role: "user", content: this.toContentParts(content) },
    ];

    const completion = await this.client.chat.completions.create(
      this.buildJsonParams(messages, opts),
    );
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed: unknown = JSON.parse(stripCodeFences(raw));
    return schema.parse(parsed);
  }

  private buildParams(
    messages: Message[],
    opts: ChatOptions | undefined,
  ): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: opts?.model ?? this.config.defaultModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    };
    if (opts?.temperature !== undefined) {
      params.temperature = opts.temperature;
    }
    if (opts?.maxTokens !== undefined) {
      if (this.config.maxTokensField === "max_completion_tokens") {
        params.max_completion_tokens = opts.maxTokens;
      } else {
        params.max_tokens = opts.maxTokens;
      }
    }
    return params;
  }

  private buildJsonParams(
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    opts: ChatOptions | undefined,
  ): OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming {
    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: opts?.model ?? this.config.defaultModel,
      messages,
      response_format: { type: "json_object" },
      temperature: opts?.temperature ?? 0,
    };
    if (opts?.maxTokens !== undefined) {
      if (this.config.maxTokensField === "max_completion_tokens") {
        params.max_completion_tokens = opts.maxTokens;
      } else {
        params.max_tokens = opts.maxTokens;
      }
    }
    return params;
  }

  private toContentParts(
    parts: ContentPart[],
  ): OpenAI.Chat.Completions.ChatCompletionContentPart[] {
    return parts.map((part) =>
      part.type === "text"
        ? { type: "text", text: part.text }
        : { type: "image_url", image_url: { url: part.image_url } },
    );
  }
}
