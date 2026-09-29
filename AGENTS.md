# Shila: Agent Instructions

## Source of truth

- Read `idea.txt` for the product vision and `ARCHITECTURE.MD` for the proposed system boundaries before changing the project.
- This repository is in a documentation/planning phase. Do not assume that an app, schema, API, deployment, or test command exists just because a future architecture describes one.
- Treat unconfirmed design choices in `ARCHITECTURE.MD` as proposals, not decisions. Keep product scope and architecture documents consistent when decisions are made.

## Product priorities

- Shila is an LLM-assisted personal assistant for Persian-speaking users. Its first focus is recording and reviewing personal expenses, especially everyday purchases, through a chat-style interface.
- Support Persian text and right-to-left presentation as first-class requirements. Do not assume English, Gregorian dates, or one interpretation of shorthand amounts such as `KT`.
- Distinguish facts supplied by a user from model inferences. Ask for missing or ambiguous transaction details; show the interpreted amount, currency/unit, date, counterparty, and purchase details for confirmation before creating a financial record.
- Do not invent prices, merchants, receipts, balances, or payment confirmations. Price comparisons and warnings must disclose their data source and uncertainty.
- Treat image understanding, voice messages, community price intelligence, historical price analysis, and bank-SMS reconciliation as later capabilities, not prerequisites for the first expense-recording flow. In-app payments and real-time voice are explicitly future possibilities.

## Architecture and safety boundaries

- The stated platform direction is Cloudflare deployment, Cloudflare Agents memory for conversations/context, Cloudflare D1 for financial transactions, and Google authentication. Specific frameworks, LLM vendors, data schemas, and deployment topology remain undecided.
- Keep durable financial records separate from conversational memory. A model suggestion must not become a ledger write without application-side validation and an explicit user confirmation path.
- Scope all private reads and writes to the authenticated user. Minimize sensitive data sent to model providers; never put credentials, bank messages, or financial details in logs or committed files.
- Make transaction creation safe against retries and duplicates; support correction or reversal with an audit trail rather than silently rewriting history.
- Ask for explicit permission before accessing photos, audio, or SMS. Never initiate payments or read device messages merely because the assistant can interpret a request.

## Working conventions

- Make small, reviewable changes aligned with the agreed phase. Do not implement speculative features from the roadmap without a specific request.
- When implementation begins, define input/output contracts and validation at the server boundary; test parsing ambiguity, confirmation, authorization, retries, and Persian/RTL behavior.
- Do not claim a check passed unless it ran. If the repository lacks implementation or tests, say so instead of inventing commands or results.
