# Validation status — VPS 2.0

## Local PASS

Previously recorded baseline: **247 checks** = baseline 140 + dynamic-routing/import 107; `npm run check` and `npm run build` were reported clean before the 2026-10-17 cash-policy patch. The new branch adds a focused cash identity test and updates routing expectations, but these changed tests, type-check and build have **not yet been executed in this environment**. Do not treat the historical 247 total as validation of this patch. Tests use temporary disk-backed **PGlite PostgreSQL 18.6**, real HTTP/SSE, actual Python parsing and synthetic MCP stdio. They do not contact owner WhatsApp or production DB and do not emulate PostgreSQL TCP permissions/network/concurrency in full.

| Area | Tested behavior |
| --- | --- |
| Schema | Fresh/repeated migration, no business seed, v1→v2 preserves old records/password and promotes first owner |
| Privacy/roles | No login/forged Sites headers denied, wrong password/session/origin checks, Viewer writes denied; ordinary Admin cannot configure authority |
| CRUD | Create/view/edit, revision conflict, soft-delete/restore and persistence |
| Identity | Management may retain multiple configured parties, but automatic WhatsApp cash is locked to private fixed Owner/Accountant identities; actual direct chat/direction is checked before parsing; unverified LID and body-only recipient claims fail closed |
| Time/changes | Future binding gate, phone replacement follows JID, scheduled change leaves old number effective, unrelated edit preserves scheduled timeline; no automatic historical authorization |
| Group routing | Default review; even explicit group cash policy cannot create a Cash Transaction under the fixed direct-chat-only rule |
| Client | Service request creates Draft without assignment; multiple representatives reuse one Draft; client filter and assistant query |
| Employee/payout | Owner's multiline one-number/two-number rules; payout is not employee identity; employee-domain message is not cash |
| Imports | Preview writes no business records; same/expanded exports, stable-ID CSV reorder, changed-source review, exact original download, cancel/retry/stale preview |
| Corrections | Changed source cannot Accept as another transaction; approved correction updates existing ID with revision, known edited re-export skips |
| Duplicates | Message replay/restart one row; strict master/escort/date key; incomplete phones reviewed; missing nonconflicting release fields link to existing program; distinct cash requires reference/reason |
| Money/completion | Exact integer cents, malformed/sub-cent values held/rejected; completion missing required end fields denied |
| MCP | Three read-tool allowlist, eight mutating/unsupported tools blocked; paired-profile mismatch denied; direct peer identity; activation first poll does not skip eligible message; checkpoint gap stops advancement; observed edit review |
| Live tables/assistant | SSE emitted, DB-derived record answers, client-specific query; source data persists through restart |
| Reports | 21 JSON/CSV/print HTML types; new configuration reports role-restricted; full matching rows and amount totals |

TypeScript checks shared TS/TSX interfaces; JS is built/transformed but not fully strict-type-checked. Build output/dependencies/test databases are excluded from the source ZIP. Original 001 migration is unchanged from v1.

## Not verified here

Real VPS/SSH, existing PostgreSQL TCP role/network, Docker image execution, systemd/Nginx/TLS/Cloudflare configuration; real QR pairing/provider cache/contact identities; live Hermes/Fazle Core/gateway or D1/FPE/WBOM migration; two-session real-browser SSE, desktop/mobile/keyboard/print layout; production backup/restore rehearsal. These need the acceptance steps in VPS-SETUP.md.

## Functional limits

- No image OCR, signature recognition or release-slip/voucher classifier. Media originals need human extraction/verification; omitted-media TXT contains no image pixels.
- TXT lacks upstream message IDs. Same-minute sender reorder/edits and ID-less CSV full-identity corrections can be ambiguous. Review and stable source IDs are required; universal no-missing/no-duplicate assurance is not justified.
- MCP can only read the bridge's accessible cache/history. This adapter currently reads profile/messages/context but not the contact book, so live Owner/Accountant contact-book names and JID/LID mappings remain unverified. Observed edits within the poll window become review; arbitrary old edits outside it or deleted upstream history are not guaranteed. Gaps stop cursor advancement. No outbound send/reply/delete tools.
- New permission is not retroactive. Explicit historical-file confirmation is owner attestation, not independent transport proof. A trusted producer token cannot prove the producer is uncompromised.
- Employee duty/attendance messages queue review; no automatic payroll/attendance/settlement engine. Draft is not confirmed assignment.
- Assistant is a limited structured read-only query assistant; it is not an external general-purpose model.
- PDF export uses browser Print / Save as PDF, not a server-generated PDF engine. One process for SSE; scale-out requires shared events.
- Financial instructions are records, not independently verified receipts or salary liabilities.

Current Sites deployment, public visibility and owner VPS were not changed by this source package task.
