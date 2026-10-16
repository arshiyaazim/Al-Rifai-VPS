# Handoff — Al-Rifa’i VPS 2.0

Read README, docs/OWNER-REQUIREMENTS.md, docs/REQUIREMENTS.md and docs/VALIDATION.md first. This is one standalone editable React/Vite + Node + PostgreSQL app; the canonical Sites checkout/deployed page was not modified. Deliverable scope is source ZIP, not permission to publish/deploy/send messages.

## Product and business rules

- Live operational tables are primary: valid frontend/file/WhatsApp data reaches the same active register/accounts and structured assistant. Do not revert to disconnected observation-only tables.
- New attached requirements supersede hardcoded single Admin/Accountant. Database-managed effective-dated accounts, parties, contacts, groups and bindings control routing. Client management is explicitly required. Cargo, booking, capacity, registration/slip numbers remain excluded.
- Direct automatic Accounts: bound Admin sender → verified designated Accountant receiver only. Groups default review. Explicit Super Admin group policy + matching binding + actual authorized sender is necessary for group cash. Group name/member list alone is never authority.
- New config starts no earlier than approval and does not retro-authorize old messages. Scheduled changes preserve current versions until effective time. Source-bound Super Admin historical-file attestation is explicit and separately logged. Never infer recipient from file title or phone from contact name.
- Employee ID is distinct from payout mobile and contact identity. Two-number message post-name payout cannot create/remap employee. A lone post-name number may identify employee; separate payout unavailable.
- Same valid master/escort/start date: one program. Exact replay links/skips; incomplete/conflicting identities require review. Do not silently remove source evidence or overwrite conflicts. Changed source-linked record updates only after review/revision check, never a second standalone payment. Distinct real payments need specific reference/reason rather than silent deduplication.
- Client service order creates Draft, not confirmed assignment. Completion needs end date + end shift + release point + human confirmation. Voucher/media placeholder is not a release slip. OCR/signature classifier not implemented.

## Code map

- UI src/Administration.jsx, DataSources.jsx, RecordEditor.jsx, Reports.jsx; app/ inherited maritime register/accounts; lib/ pure filters/structured assistant.
- server/management.mjs: validated entities, related contacts, stable group sender IDs, effective entity timelines and rebuilt binding snapshots. Phone-mode JID follows selected contact; explicit mode stays explicit.
- server/routing.mjs: source/chat/actual actor/time/intent permission gates BEFORE finance parsing. routing_digest includes current activation version; no client-supplied routing proof trusted.
- server/imports.mjs: original file storage, preparation/preview, stable-ID/anchor matching, sealed context, stale preview guards, confirmation and review. TXT source has no upstream ID: ambiguity must stay visible.
- server/intake.mjs + extract.py: raw envelope → server verified route → parser → canonical writer. Same-ID body edits retain message_changes and correction review. Do not reparse using broad content alone.
- server/records.mjs: canonical writer, advisory lock, validation, duplicate/business keys, optimistic revisions, employee/payout identity, evidence and audit.
- server/reviews.mjs: link/accept/dismiss/apply_update; identity cannot be bypassed by review acceptance. Structured owner CSV is manual submission; conversation-derived CSV is identity-gated.
- integrations/mcp-consumer.mjs: three read-tool allowlist; profile/peer/group actor identity, dynamic routing scope, activation starts, persistent per-chat checkpoints/seen hashes. Optional Hermes uses original envelopes and own private source token.
- database/migrations/001_initial.sql and 002_dynamic_routing.sql: SHA checked. Add future migrations; never edit an applied file. 20 tables including schema_migrations; 2 views; no business seeds.
- server/reports.mjs: 21 reports, CSV/JSON/HTML/print. New configuration reports require Admin/Super Admin. Assistant is deterministic structured read-only, not external LLM.

## Next work, in order

1. Verify actual existing root VPS foundation /opt/vps, central PostgreSQL /opt/vps/infra/compose.yaml, private /etc/vps/infra, data /var/lib/vps/postgres and /opt/vps/docs/VPS_MAP.md. These are owner conventions, not a verified current connection. Reuse services/network; no second PostgreSQL/Core app merely for this register.
2. Place app at approved existing-app path, configure private env/own schema role, rehearse v1 upgrade and backup/restore. Deployment action must remain within owner's current authorization; this ZIP delivery changed no live service.
3. Verify real TCP PostgreSQL, private HTTPS/login, role boundaries and SSE across existing proxy. Do not trust Sites headers on VPS.
4. Configure authorized actual identities in UI before intake. Verify all effective dates/aliases/party links/group sender policy. Import prior files via preview and explicit historical source verification where needed; reconcile source items vs posted/review counts.
5. Privately pair/reuse existing WhatsApp bridge; confirm actual MCP_ACCOUNT_PHONE, tool schema and read-only policy. --once first; prove raw message, persisted business row, reports and assistant agree. Then phone replacement/replay/restart/gap tests. No QR/session/token in source or shared report.
6. Run real browser desktop/mobile CRUD, keyboard/focus, print and two-session SSE. Add OCR later only with actual release-slip vs voucher fixtures and the explicit end-date/shift/release-point rule. Duty/attendance and settlement automation remain separate scoped work.

## Validation and limitations

Run npm test (140 baseline + 107 routing/import checks), npm run check, npm run build. Tests use synthetic fixtures, actual HTTP/Python and temporary disk-backed PGlite PostgreSQL 18.6, not pg TCP or real WhatsApp. Update exact totals when tests change. No Docker/VPS/provider/browser QA was performed here. Real gateway/canonical import remains unconnected. Poll window/history coverage is not universal; gaps must stop cursor advancement, not hide missing data. No outbound WhatsApp tools. Do not claim all real messages can never be missing/duplicate without source reconciliation.

No production data, real chat exports, secrets, auth cache, node_modules/dist or temporary DBs belong in the ZIP. Preserve original source ZIP and historical provenance. Keep README/API/setup/validation and SOURCE-MANIFEST aligned with final code.
