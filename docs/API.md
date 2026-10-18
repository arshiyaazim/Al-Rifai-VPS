# HTTP API — 2.0

Session-authenticated private API, except login/health and source bearer routes. Cookie writes require exact APP_ORIGIN and JSON Content-Type. Roles: super_admin = authority configuration + all business operations; admin = business CRUD/import/review + configuration read; viewer = read/export/assistant. Management write/source creation require Super Admin.

| Method / path | Purpose |
| --- | --- |
| POST /api/auth/login, /api/auth/logout | Private session login/revoke |
| GET /api/auth/me, /api/events | User/role; SSE ready and records_changed |
| GET /api/register | Filtered program table; q, clientId, motherVessel, lighterVessel, escortName, destination, status, shift, from, to, quality, sort, page, export=1 |
| GET /api/clients | Configured client choices, including inactive historical labels |
| GET /api/operations | Cash/employees/reviews/summaries; view, source, q, from, to, method, employee, page, export=1 |
| GET /api/records/{kind} | Full typed records; deleted=1 recoverable rows |
| GET /api/records/{kind}/{id}, /api/record/{id} | Details and linked source evidence |
| POST /api/records/{kind} | Create explicit business row |
| PATCH, DELETE /api/records/{kind}/{id} | Complete form update / soft-delete with current revision |
| POST /api/records/{kind}/{id}/restore | Restore with current revision |
| GET /api/program-tools | Assignment/release views and data-quality flags |
| GET /api/management | Entities, sources and employee choices (Admin/Super Admin) |
| POST /api/management/{type} | Add authority entity (Super Admin) |
| PATCH /api/management/{type}/{id} | Edit/replace with revision and effective dates (Super Admin) |
| DELETE /api/management/{type}/{id} | Immediate routing deactivation; retains evidence/history |
| GET /api/management-history?id={id} | Entity versions, binding versions, audit |
| GET, POST /api/employees | Employee directory / explicit identity creation |
| PATCH /api/employees/{id} | Name/status/role/explicit ID update with revision |
| GET, POST /api/sources | Connections / create; private token shown only at creation |
| PATCH /api/sources/{id} | Enable/pause/read scope (Super Admin) |
| GET, POST /api/imports | History / upload, starts asynchronous preparation |
| GET /api/imports/{id}?page=1 | Preview items, counters, context, status, 25 items/page |
| POST /api/imports/{id}/commit | confirm=true; eligible rows only, changed items review |
| POST /api/imports/{id}/preview or /retry | Refresh preview/retry using sealed context; no business writes |
| POST /api/imports/{id}/cancel | Cancel prepared import |
| GET /api/files/{id} | Private exact original bytes |
| GET /api/messages | Stored raw messages; q/page |
| GET /api/reviews | Domain-labelled queue, existing payload/revision; status filter |
| POST /api/reviews/{id}/resolve | action=accept/link/dismiss/apply_update, reason, kind, record/recordId |
| POST /api/assistant | Structured read-only answer: question, filters, cashFilters, context |
| GET /api/reports | type, format=json/csv/html/print, filters; all matching rows |
| GET /api/audit, /api/import-audit | Change log / source reconciliation summary |
| GET /healthz | Process liveness only |

`kind`: program, transaction, vessel, project. Management `type`: account, accountant, client, contact, group, binding. PATCH is a complete form submission, not JSON Merge Patch. Invalid fields 400; missing login 401; authority 403; stale revision/preview/duplicate 409. Do not bypass conflicts with silent retry/overwrite.

## Fields

Common management: name, status=active|inactive, role, notes, effectiveFrom/effectiveUntil (ISO or Dhaka local form), revision. Accounts add phone/aliases. Accountant adds accountId; initial phone atomically creates its contact. Client may have primary phone. Contact: partyId, phone, aliases. Group: chatId, domain, partyId, policy, allowedSenderIds (UI maps selected phones to stable actor IDs). Binding: sourceId, accountId, domain, conversationType, partyId, contactId/groupId/employeeId, chatIdMode=phone|explicit, chatId and permission. GET returns effectiveChatId and dependencies as current configuration choices; actual time routing uses immutable versions.

Permissions: review_only, accounts_direct, cash_admin_group, program_draft, program_operations, employee_review. Domain: accounts, programs, employee, identity. Do not treat arbitrary matching values as valid cross-domain authority; server validates relationship and scope.

Program: clientId/clientName, motherVessel, lighterVessel, masterName, masterMobile, escortName, escortMobile, destination, startDate, shift, endDate, endShift, releasePoint, status, releaseConfirmed, notes. Lighter required; Draft supports unassigned escort. ISO valid calendar dates; D/N shifts. Completion needs end date/shift/release point plus confirmation.

Transaction: name, employeePhone, payoutPhone, date, time, method, amount (BDT decimal ≤2 places) OR integer amountCents, paymentReference, purpose. Positive amount ≤1,000,000 BDT, name/date required. Missing Employee ID flagged; payout never creates identity. Methods bkash/nagad/cash/rocket/bank/unknown. Internally routingContext records verified source identities; browser cannot grant its own transport identity.

Vessel/project: name, status, location, notes; vessel role mother/lighter. Employee: display_name, identity_mobile, status, role, notes, revision.

Upload: sourceId, name, mime, content (base64), optional recordKind, bindingId/bindingVersionId, identityAttested, historicalAttested. Historical attestation requires Super Admin plus exact identity confirmation. Context is sealed with actor and file hash. Status: preparing → preview → pending → complete; failed/cancelled remain inspectable. Preview totals describe source items/candidates, not guaranteed posted record count; final writer may hold duplicates.

Reports (21): programs, vessels, projects, transactions, daily, employees, reviews, duplicates, sources, messages, audit, deleted, whatsapp-accounts, accountants, clients, contacts, groups, bindings, routing-history, imports, employees-directory. Last nine are Admin/Super Admin only. Print is browser Save as PDF, not a server binary PDF renderer.

## Source bearer API

Authorization: Bearer SOURCE_TOKEN; source must be enabled. Tokens authenticate a trusted producer, not arbitrary browser input.

- POST /api/integrations/{sourceId}/messages: 1–100 original envelopes. Server verifies routing before parsing. Replayed body skips, observed changed body queues review.
- GET /api/integrations/{sourceId}/routing: allowed chats, activation starts, configuration digest.
- GET/PUT /api/integrations/{sourceId}/checkpoint: durable per-chat consumer state.
- GET /api/integrations/{sourceId}/query?kind=program|transaction: optional owner-enabled readAccess, default denied.

See DATA-SOURCES.md for original envelope and identity contract. Invalid producer metadata cannot be independently authenticated by content extraction.


## Cash payment identity gate

All automatic WhatsApp cash writes pass the server-side fixed Owner → Accountant gate in `server/routing.mjs`; frontend fields or a phone number inside message text cannot override it. The active approved Owner/Accountant identity binding is the routing source; environment-variable presence alone must not disable Cash Payment. Actual direct chat JID, sender/recipient, cash intent and employee mobile are required. Unresolved LID/JID, mismatched recipient, group chat, Accountant-originated message, missing employee mobile or duplicate results in no automatic Cash Transaction. Source-message and business-key idempotency remain mandatory. See [CASH-PAYMENT-IDENTITY.md](CASH-PAYMENT-IDENTITY.md).
