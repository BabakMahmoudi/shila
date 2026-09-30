# Shila: Agent Instructions

## Source of truth

- Read `idea.txt` for the product vision, `REQUIREMENTS.md` for proposed testable scope, and `ARCHITECTURE.MD` for proposed system boundaries before changing the project.
- This repository is in a documentation/planning phase. Do not assume that an app, schema, API, deployment, or test command exists just because a future architecture describes one.
- Treat proposed requirements and unconfirmed design choices as proposals, not decisions. Keep product scope and architecture documents consistent when decisions are made.

## Product priorities

- Shila is an LLM-assisted personal assistant for Persian-speaking users. Its first focus is recording and reviewing personal expenses, especially everyday purchases, through a chat-style interface.
- Support Persian text and right-to-left presentation as first-class requirements. Do not assume English, Gregorian dates, or one interpretation of shorthand amounts such as `KT`.
- Keep day-one interaction editable text in and written answers out. Users may dictate into the text field using browser/device speech input where available, but typing must always work; dictated text is reviewed and financial details still require confirmation. Do not assume reliable Persian speech recognition or require microphone access for the first release.
- Distinguish facts supplied by a user from model inferences. Ask for missing or ambiguous transaction details; show the interpreted amount, currency/unit, date, counterparty, and purchase details for confirmation before creating a financial record.
- Invite item descriptions and quantities for purchases without demanding individual prices; non-purchase payments need no item list. Store unknown line prices as unknown, never as allocated portions of the total or reference estimates.
- Do not invent prices, merchants, receipts, balances, or payment confirmations. High-priority future basket comparisons and warnings must disclose reference source, recency, region, and uncertainty; editor price observations are not the user's actual paid prices.
- Keep product identity, dated reference observations, and user-owned purchase history distinct. A defensible per-unit value derived from an older single-item purchase may inform a comparison, but must not fill an unknown actual line price in a later basket. Share eligible user-derived observations across users only with explicit opt-in and privacy-safe regional aggregation, never by exposing individual records or small identifying groups.
- Keep the initial purchase flow text-first. Later image understanding is optional draft assistance, not a prerequisite or proof of exact product identity; pilot an existing model on real multi-item photos and measure errors before adding detection, catalog-image retrieval, or fine-tuning. Evaluate receipt-price extraction separately.
- The primary client is an installable PWA that must work in a browser without an APK. Treat image understanding, uploaded voice messages, app-controlled speech input, location access, editor-backed price warnings, historical price analysis, and bank-SMS reconciliation as later capabilities, not prerequisites for the first expense-recording flow. In-app payments and real-time voice are explicitly future possibilities.

## Architecture and safety boundaries

- The selected web framework is Next.js, with a single Cloudflare-deployed PWA/backend preferred. Cloudflare Agents memory for conversations/context, Cloudflare D1 for financial transactions, and Google authentication remain the platform direction. The deployment adapter and integration must be validated; LLM vendor, data schemas, and exact deployment topology remain undecided.
- A later, optional Android APK may show the hosted PWA in a WebView and receive SMS through native code; the PWA itself cannot read incoming SMS. Users may instead explicitly share a bank message. Neither route bypasses authenticated reconciliation and confirmation, and no native wrapper framework is selected.
- Keep orchestration capable of routing to distinct domain capabilities later, but do not introduce autonomous specialists or an agent framework for the first expense flow without a demonstrated need. Cloudflare Agents memory does not imply a multi-agent framework.
- Keep durable financial records separate from conversational memory. A model suggestion must not become a ledger write without application-side validation and an explicit user confirmation path.
- Scope all private reads and writes to the authenticated user. Minimize sensitive data sent to model providers; never put credentials, bank messages, or financial details in logs or committed files.
- Make transaction creation safe against retries and duplicates; support correction or reversal with an audit trail rather than silently rewriting history.
- Ask for explicit permission before accessing photos, audio, location, or SMS. Never initiate payments or read device messages merely because the assistant can interpret a request.

## Working conventions

- Make small, reviewable changes aligned with the agreed phase. Do not implement speculative features from the roadmap without a specific request.
- When implementation begins, define input/output contracts and validation at the server boundary; test parsing ambiguity, confirmation, authorization, retries, and Persian/RTL behavior.
- Do not claim a check passed unless it ran. If the repository lacks implementation or tests, say so instead of inventing commands or results.
