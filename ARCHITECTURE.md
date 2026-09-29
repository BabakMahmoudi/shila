# Shila Architecture (Proposed)

## Status and scope

This is a planning document based on `idea.txt`, not a description of deployed software. Shila is a Persian-first, chat-style personal assistant whose first use case is personal expense tracking, particularly daily purchases. Cloudflare deployment, Cloudflare Agents memory, Cloudflare D1, and Google authentication are the stated technology directions; the precise product, service, and provider choices still need validation.

The initial flow should let a signed-in user describe a payment or purchase in natural language, resolve ambiguity, confirm the extracted details, store the transaction, and review their own spending. No transfer of money is implied by recording a payment.

## Conceptual components

1. **Chat client:** Persian-first, RTL-friendly conversation and transaction review. It displays proposed records and asks for confirmation or corrections; it does not directly write to the ledger.
2. **Authentication boundary:** Google sign-in establishes an application user identity. Server-side authorization uses that identity for every conversation and ledger operation; the client cannot choose another user's ID.
3. **Assistant orchestration:** A Cloudflare-hosted service manages the conversation, calls an LLM for interpretation or responses, requests clarification, and routes explicit user actions to application services. LLM output is untrusted input.
4. **Conversation memory:** Cloudflare Agents memory retains the conversation and contextual information needed for continuity, subject to retention and deletion policies. Memory is not the authoritative transaction store.
5. **Transaction service and ledger:** Application logic validates amounts, units, dates, ownership, and confirmed user intent before writing financial records to Cloudflare D1. D1 is the source of truth for financial history and later spending summaries.

Conceptual path: `User -> chat client -> authenticated assistant service -> extraction/clarification -> confirmation -> validated transaction service -> D1`. Conversation context is maintained separately through Cloudflare Agents memory. Reports read the authorized user's D1 records, not a model's recollection.

## Transaction lifecycle

1. Receive a user message such as a payment to a person or a daily purchase. An LLM may propose structured fields and identify missing or uncertain information.
2. Resolve ambiguity before saving: amount and currency/unit (including what `KT` means), payment versus purchase, date/time, counterparty or merchant when known, and optional item, quantity, or price information. Preserve the original wording as provenance only if retention is justified.
3. Present the proposed record to the user and require a clear confirmation. Corrections return to the draft; unconfirmed drafts are not ledger transactions.
4. Validate again on the server and create a user-owned D1 record. Use a request or confirmation identifier to prevent duplicate entries on retries. Provide a way to correct or reverse mistakes while retaining an audit trail.
5. Read records for summaries with clear units, date ranges, and provenance. Do not present model-derived estimates as posted transactions.

## Data and trust boundaries

- **Identity:** Verify Google sign-in server-side and map it to a stable application user ID. Apply ownership checks to memory and D1 access, not just to UI routes.
- **Financial data:** Store canonical numeric values with explicit currency/unit and timestamps; do not silently convert Persian numerals, colloquial abbreviations, or local calendar dates without validation. Define precision, timezone, and calendar behavior before implementation.
- **Model calls:** Treat prompts, extracted fields, and generated answers as fallible. Limit exposure of personal data to external providers, validate structured output, and prevent tool calls from bypassing confirmation or authorization.
- **Privacy:** Use least-privilege access, secret management, encryption in transit, appropriate retention and deletion policies, and redacted operational logs. Obtain separate consent for media or SMS ingestion. Bank messages and photos may contain unrelated sensitive information.
- **Insights:** Spending warnings and price comparisons must distinguish personal history from broader samples, note sample size and time/location where relevant, and avoid unsupported claims about inflation or a "bad purchase."

## Phased capabilities

- **Initial focus:** Text chat, Google sign-in, clarification and confirmation of expenses, D1 transaction history, and basic per-user spending review.
- **Later exploration:** User-supplied purchase photos, asynchronous voice transcription, price observations from transactions, contextual price questions, historical price trends, and opt-in bank-SMS reconciliation. Each requires its own consent, provenance, validation, and failure-handling design.
- **Future possibilities:** Real-time voice and in-app payments. Payment initiation needs separate compliance, security, and provider decisions and must not be conflated with expense recording.

## Decisions to resolve before implementation

- Amount conventions: supported currencies/units, the meaning of `KT`, decimal precision, and exchange or conversion policy.
- Locale conventions: Persian digit handling, calendar input/display, transaction timezone, and mixed Persian/English messages.
- Record semantics: required transaction fields, purchase line items, corrections/reversals, deduplication, and whether income or transfers are in scope.
- Platform specifics: Cloudflare runtime and Agents memory APIs, D1 schema and migration workflow, LLM provider, Google auth flow, and attachment storage if media is added.
- Data governance: retention and deletion for conversations and financial records, external model data processing, consent for future SMS/media use, and how price observations can be aggregated without exposing individual users.
