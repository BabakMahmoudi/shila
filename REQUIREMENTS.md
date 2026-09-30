# Shila Requirements

## Status and use

This is a proposed, testable scope for Shila's first release, derived from `idea.txt`. It is not an implementation claim or approval to build every item. Review and mark requirements **Approved** before treating them as committed work. Keep IDs stable when wording changes; record material scope changes here. `ARCHITECTURE.MD` describes proposed system boundaries, while `AGENTS.md` tells coding agents how to work in this repository.

## Proposed first-release requirements

Each requirement below has status **Proposed**. Acceptance criteria describe observable behavior, not a prescribed framework or schema.

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| REQ-001 | Users can sign in with Google before accessing private conversations or financial data. | An unauthenticated request cannot read or write a user's private data; a signed-in user cannot access another user's data. |
| REQ-002 | The chat experience supports Persian text and right-to-left reading and input. | Users can enter and review Persian messages, Persian digits, and mixed Persian/English expense descriptions without broken direction or meaning. |
| REQ-003 | Users can describe an expense or everyday purchase in text and receive a draft interpretation. | The draft identifies known amount, currency/unit, date, counterparty or merchant when supplied, and purchase details when supplied; missing or inferred fields are distinguished from stated facts. |
| REQ-004 | Ambiguous or missing details are clarified before recording. | If a unit such as `KT`, a date, or a required field cannot be interpreted safely, Shila asks rather than silently choosing a meaning or inventing data. |
| REQ-005 | A transaction is saved only after explicit user confirmation of the interpreted details. | The user can review and correct a draft; an unconfirmed or rejected draft produces no financial record, even if the model proposes one. |
| REQ-006 | Confirmed expenses are validated and recorded as user-owned financial history. | Invalid or incomplete records are rejected at the server boundary; conversational memory alone never counts as a saved transaction. |
| REQ-007 | Retried confirmations do not create duplicate transactions, and users can correct mistakes without losing the change history. | Replaying a confirmation does not add another record; a correction or reversal remains traceable to the original record. |
| REQ-008 | Users can review their own recorded expenses and basic spending summaries. | Records and totals are limited to the authenticated user and displayed with clear amount units and date ranges; drafts are excluded. |
| REQ-009 | Financial data and conversation context remain separate and private. | Private operations enforce ownership checks; secrets and sensitive financial content are not exposed in logs or committed files; model calls receive only data needed for the task. |
| REQ-010 | The primary client is a browser-accessible, installable PWA. | On supported browsers the user can install Shila without an Android APK; the initial expense flow also works in a normal browser without SMS access. Offline operation is not implied. |
| REQ-011 | For a purchase, Shila invites the user to identify what was bought without requiring per-item prices. | From a message such as "2 bottles of milk, 16 eggs and 2 cakes for 350 KT," the draft lists known items and quantities alongside the paid total; the user can correct or omit item details and still save a valid expense. Non-purchase payments need no purchase items. |
| REQ-012 | Saved purchases retain item details separately from the amount paid. | A confirmed purchase can have multiple item descriptions and quantities with unknown unit or line prices; unknowns remain unknown rather than being allocated from the basket total or a market estimate. |
| REQ-013 | The day-one conversation accepts editable text and gives written responses, including when a user dictates into the text field using browser or device speech input. | The text field remains usable without speech support; dictated text can be reviewed and corrected before submission, and expense interpretation and confirmation follow the same path as typed text. Shila does not require microphone permission to complete the initial flow. |

## Platform direction

The product idea calls for Cloudflare deployment, Cloudflare Agents memory for conversations/context, Cloudflare D1 for financial transactions, Google authentication, and a chat-style UI. Next.js is the selected web framework for the primary PWA, with a single deployed web application preferred; see `ARCHITECTURE.MD` for the decision and integration checks. These directions are not evidence that an implementation or specific API already exists. LLM provider, schema, and exact deployment layout remain undecided.

## Pricing priority (release timing open)

Useful price guidance is a top product priority. The first-release capture requirements above preserve itemized purchase facts needed for this capability, but price warnings, editor tools, and image processing are not yet committed to the first release. Resolve their release timing and reference-data quality criteria before specifying acceptance tests.

- Compare a confirmed basket total against a range built from recent, sufficiently comparable reference prices, without asking for every actual item price. Account for quantity, package size, variant, currency/unit, time, and region; do not warn when matches or evidence are too weak.
- Show the comparison's source, date/region, and uncertainty. A basket warning may say the total looks high for comparable goods, but cannot claim which item was overpriced when the user's item prices are unknown.
- Permit authorized price editors to submit identifiable products and dated, sourced price observations, with moderation/correction and stale-data handling. A product photo alone does not prove a selling price. Protect private users' transactions from editor access or disclosure.
- Keep product identities separate from dated price observations and private purchase history; do not store one universal "current price" per item. A confirmed single-item purchase may yield a derived per-unit historical reference only when its item, quantity, total, and any adjustments make that calculation valid. Retain date, region when known, currency/unit, and source; do not copy that reference into a later multi-item purchase as an actual line price.
- With explicit user opt-in, eligible user-derived observations may contribute to coarse regional price aggregates that help nearby users. Do not expose another user's transaction, identity, exact location/time, or a single identifying observation. Require enough independent, recent comparable observations before showing a regional reference or warning; remove invalid contributions after corrections, reversals, or consent withdrawal under the defined retention policy.
- Pilot optional user-supplied product photos with an existing vision model to suggest or refine item descriptions in the same text-first draft. Highlight conflicts for review, allow "unknown," and never treat visual guesses as confirmed facts or paid prices. Test on representative multi-item photos before committing to exact product recognition, custom detection, or fine-tuning.
- Evaluate receipt photos or digital invoices separately as possible sources of actual line prices for user review; their extraction errors and privacy risks differ from photos of goods. External receipt/order integrations, if any, need separate authorization.

## Future candidates, not first-release requirements

- Additional personal-assistance domains and possible specialist agents routed by an orchestrator; define each domain and its permissions before considering a multi-agent framework.
- Purpose-limited location access and uploaded voice-message input; these need explicit permission and separate handling of sensitive location or audio data. App-controlled microphone recognition, spoken replies, and real-time voice are not first-release requirements.
- Historical price analysis and inflation insights; these need defensible sources, time/location context, and clear limits on claims.
- Bank-SMS reconciliation is not required for the first release. A user may later explicitly share or paste a bank message into Shila; the browser/PWA cannot independently read incoming SMS. A separate, optional Android APK with a hosted WebView and native SMS receiver may later offer opt-in automatic receipt. Both paths create candidates for reconciliation and confirmation, never automatic ledger writes.
- In-app payments; payment initiation is separate from recording an expense and requires its own security, legal, and provider decisions.

## Open product decisions

- Which currencies and units are supported, and what should `KT` mean in a given user's context?
- Which fields are required for a valid expense versus a purchase? Are transfers, income, and partial payments in scope?
- How should Persian and Gregorian dates, timezones, and ambiguous shorthand be interpreted and displayed?
- What are the retention, export, and deletion expectations for conversation history and financial records?
- Which summaries are needed in the first release beyond listing and basic totals?
- How well does Persian (`fa-IR`) dictation work through target Chrome/keyboard combinations and networks, and what privacy notices are needed for speech processing provided by the browser or device?
- When do price-editor submission, basket comparisons, and photo/receipt-assisted capture launch, and what reference quality, match confidence, and freshness justify a warning?
- What evidence qualifies a user purchase as a usable historical price observation, and what consent, regional granularity, minimum contributor count, retention, and withdrawal rules protect shared aggregates?
- Do real Persian-language, multi-item shopping photos improve item identification enough to justify image support? Measure exact-product accuracy, appropriate abstention, correction effort, latency, and cost before selecting or training recognition models.
- For later SMS support, which sharing methods and bank message formats are supported, and how will the optional Android APK be authenticated, distributed, updated, and linked to a user?

Resolve these before finalizing related acceptance tests or implementation contracts. Do not infer answers from example messages.
