/**
 * Worker environment bindings. Values are configured via `wrangler.toml` [vars]
 * and secrets (`.dev.vars` locally, `wrangler secret put` in prod).
 */
export interface Env {
  DB: D1Database;
  SHILA_MODEL_PROVIDER?: string;
  SHILA_MODEL?: string;
  DEEPSEEK_API_KEY?: string;
  DEEPSEEK_BASE_URL?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
}

export type AppBindings = { Bindings: Env };
