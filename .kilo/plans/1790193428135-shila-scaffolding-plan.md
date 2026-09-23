# Shila — v1 Scaffolding Plan

## Goal

Stand up the Shila monorepo and prove the riskiest integration end-to-end: a Persian
text expense message flows through the LLM gateway → validated Zod schema → D1 insert →
chat confirmation. Everything else (auth, voice, image, Agents Session memory) is deferred
behind clean seams.

## Locked decisions

| Decision | Choice |
| --- | --- |
| Stack | pnpm workspaces monorepo, TypeScript strict everywhere |
| API | Cloudflare Workers + Hono |
| Web | React + Vite SPA, RTL Persian (Vazirmatn), minimal chat UI |
| Storage | Cloudflare D1 (transactions + memory backing) |
| LLM | Model-agnostic gateway; OpenAI + DeepSeek adapters via one OpenAI-compatible client; **DeepSeek default** |
| Memory | Option (b): `Memory` interface backed by D1 now; Agents Session API swap-in later |
| Auth | **Deferred** — placeholder `dev-user` this milestone; auth middleware as a seam |
| Voice / image / SMS | Out of scope this milestone |
| Monorepo tooling | pnpm + concurrently (no Turborepo) |
| Scope | Skeleton + text-expense slice |

## Prerequisites (for running, not for writing the plan)

- Node 20+, pnpm 8+, `wrangler` CLI installed.
- DeepSeek API key (default) and/or OpenAI key, provided as secrets.
- `wrangler dev` uses a local D1 via Miniflare, so no Cloudflare account is required to run locally.
- Google Cloud OAuth project: **not needed** this milestone (auth deferred).

## Target layout

```
shila/
├── package.json                # root scripts (dev/build/typecheck/lint/test)
├── pnpm-workspace.yaml         # packages: apps/*, packages/*
├── tsconfig.base.json          # shared strict TS config
├── eslint.config.js            # flat config
├── .prettierrc
├── .gitignore
├── packages/contracts/         # @shila/contracts — Zod schemas + shared types
│   └── src/{index,transaction,extraction,chat}.ts
└── apps/
    ├── worker/                 # @shila/worker — Cloudflare Worker
    │   ├── wrangler.toml       # D1 binding, vars, secrets
    │   ├── src/
    │   │   ├── index.ts        # Hono app
    │   │   ├── routes/{health,chat}.ts
    │   │   ├── llm/{types,index,openai-compatible,openai,deepseek}.ts
    │   │   ├── memory/{types,d1-memory}.ts
    │   │   ├── services/{extract-expense,transactions}.ts
    │   │   ├── db/{schema.sql,index}.ts
    │   │   └── auth/placeholder.ts
    │   └── vitest.config.ts
    └── web/                    # @shila/web — React SPA
        ├── vite.config.ts
        ├── index.html          # lang=fa, dir=rtl, Vazirmatn
        └── src/{main.tsx,App.tsx,api/client.ts,features/chat/*}
```

## Key contracts (must exist before wiring the slice)

### LLM gateway (`apps/worker/src/llm/types.ts`)

```ts
type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image_url: string };   // unused in v1, reserved for vision

interface LLMProvider {
  readonly capabilities: { vision: boolean };
  chat(messages: Message[], opts?: ChatOptions): Promise<AssistantMessage>;
  streamChat(messages: Message[], opts?: ChatOptions): AsyncIterable<string>;
  extractJson<T>(content: ContentPart[], schema: ZodSchema<T>): Promise<T>;
}
```

- `openai-compatible.ts` wraps the `openai` SDK with configurable `baseURL` (OpenAI vs DeepSeek).
- `index.ts` exposes `createProvider(env)` reading `SHILA_MODEL_PROVIDER` (default `deepseek`).
- Capability flag drives future vision routing (not used this milestone).

### Memory (`apps/worker/src/memory/types.ts`) — short-term + long-term

```ts
interface Memory {
  appendMessage(userId, sessionId, message): Promise<void>;
  getHistory(userId, sessionId, limit?): Promise<Message[]>;
  getContext(userId, key): Promise<string | null>;
  setContext(userId, key, value): Promise<void>;
}
```

- `d1-memory.ts` implements it over the `messages` + `context` tables.
- The surface deliberately mirrors the Agents Session API (history + context blocks) so the
  backing can be swapped later without touching callers.

### Extraction contract (`packages/contracts/src/extraction.ts`)

```ts
const ExpenseExtraction = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("transaction"),
    amount: z.number().int().positive(),       // integer Toman
    currency: z.string().default("IRT"),
    category: z.string().nullable(),
    counterparty: z.string().nullable(),
    description: z.string(),
    occurred_at: z.string().nullable(),
  }),
  z.object({
    kind: z.literal("clarification"),
    question: z.string(),
  }),
]);
```

## D1 schema (v1)

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT, display_name TEXT,
  locale TEXT DEFAULT 'fa', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'IRT',
  category TEXT, counterparty TEXT, description TEXT,
  source TEXT NOT NULL DEFAULT 'text', raw_text TEXT,
  occurred_at INTEGER, created_at INTEGER NOT NULL
);
CREATE INDEX idx_transactions_user_time ON transactions(user_id, occurred_at);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, session_id TEXT NOT NULL,
  role TEXT NOT NULL, content TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX idx_messages_session ON messages(user_id, session_id, created_at);

CREATE TABLE IF NOT EXISTS context (
  user_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
  updated_at INTEGER NOT NULL, PRIMARY KEY (user_id, key)
);
```

Seed a `dev-user` row via migration so the slice runs without auth.

## End-to-end slice (the thing being proven)

`POST /chat { text: "120 هزار تومان به حسن دادم" }` →

1. `auth/placeholder.ts` resolves `user_id = "dev-user"`.
2. `memory.appendMessage(...)` records the user message.
3. `memory.getHistory(...)` provides short-term context.
4. `llm.extractJson(prompt + history, ExpenseExtraction)` runs (DeepSeek default).
5. `transaction` → `services/transactions.ts` inserts into D1 → Persian confirmation returned;
   `clarification` → return the question verbatim.
6. `memory.appendMessage(...)` records the assistant reply.
7. Respond to the web client.

## Ordered task list

1. **Root workspace** — `package.json` (private, scripts below), `pnpm-workspace.yaml`,
   `tsconfig.base.json`, `eslint.config.js`, `.prettierrc`, `.gitignore`.
2. **`packages/contracts`** — package.json + tsconfig; implement transaction, extraction, chat
   schemas/types; export from `index.ts`.
3. **Worker skeleton** — package.json + tsconfig + `wrangler.toml` (D1 binding, `SHILA_MODEL_PROVIDER`,
   secrets); Hono `index.ts`; `GET /health`.
4. **DB layer** — `db/schema.sql` migrations, `db/index.ts` query helpers, seed `dev-user`.
5. **LLM gateway** — `types.ts`, `openai-compatible.ts`, `openai.ts`, `deepseek.ts`, `index.ts` factory.
6. **Memory** — `memory/types.ts`, `memory/d1-memory.ts`.
7. **Services** — `extract-expense.ts` (Persian prompt + `extractJson` + "never guess" rule),
   `transactions.ts` (insert + list).
8. **Chat route** — wire steps 1–7 of the slice; return JSON the web client can render.
9. **Web skeleton** — Vite + React + TS, `index.html` (RTL/fa/Vazirmatn), minimal chat screen
   posting to the worker and rendering the confirmation.
10. **Root scripts** — align with `AGENTS.md`:

    ```json
    "dev": "concurrently -n worker,web \"pnpm --filter @shila/worker dev\" \"pnpm --filter @shila/web dev\"",
    "build": "pnpm --filter @shila/web build && pnpm --filter @shila/worker typecheck",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm -r lint",
    "test": "pnpm -r test"
    ```

11. **Tests (Vitest)** — schema validation (mock provider), extraction clarification path,
    transaction insert, D1 memory append/get.
12. **Full validation** (below).

## Validation

- `pnpm install` succeeds cleanly.
- `pnpm typecheck`, `pnpm lint`, `pnpm test` all pass from the root.
- `pnpm dev` runs worker (`wrangler dev`) + web (Vite) together.
- Manual: send a Persian expense message through the web UI; receive a structured Persian
  confirmation; confirm the row exists in local D1 (`wrangler d1 execute ... --local`).
- Manual: send an ambiguous message (e.g. "بابک پول دادم") → expect a clarification, not a guess.

## Risks

- **Persian extraction quality on DeepSeek** — mitigated by strict Zod + clarification path +
  "never invent" rule; test with the concrete `120 KT`-style phrases from `idea.txt`.
- **DeepSeek JSON mode specifics** — verify `response_format: { type: "json_object" }` and whether
  the prompt must include the word "json"; encode as per-provider capability/option in the adapter.
- **Monorepo module resolution** — use TS project references or package `exports` consistently so
  `@shila/contracts` is consumable from both apps.
- **Local D1 vs prod migrations** — keep migrations idempotent (`IF NOT EXISTS`), apply via
  `wrangler d1 migrations`.

## Out of scope (explicit)

Google OAuth, voice (Google STT/TTS), image analysis, Agents Session API swap-in (interface only),
PWA offline/service-worker polish, price lookup, warnings, inflation, SMS reconciliation.

## Open questions (non-blocking)

- None blocking for this milestone. The Agents Session swap-in, vision capability routing, and auth
  are all recorded as future seams here.
