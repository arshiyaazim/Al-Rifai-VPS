# Owner document → implementation

Authoritative attachment is preserved verbatim as OWNER-REQUIREMENTS.md. This maps its sections to source and checks; no original business messages were supplied in that attachment.

| Requirement | Implementation | Local verification |
| --- | --- | --- |
| 1 / 8: three sources, one app/DB/writer | forms, imports, intake → records.mjs; alrifai schema | HTTP CRUD, file/live idempotence, persistence |
| 2.1: incremental/replay/changed data | imports.mjs + import_items/item_changes + message_changes; stable IDs/anchors | A then A+new, replay/reorder, correction updates same ID, no extra ledger row |
| 2.2: preview/history/original references | DataSources preview/confirm/cancel; source_files/import_runs | preview no business writes, counts, exact download, stale config/cancel |
| 3: dynamic Accountants/numbers/Admin relationship | Administration + managed entities/version timelines | multiple accountants, phone replacement, deactivation, scheduled activation, old ledger preserved |
| 3.2 / 6: effective authorization, no retroactive grant | routing versions, approval floor, explicit historical-file attestation | future/old message blocked; ordinary Admin attestation denied |
| 3.3: authorized Accounts group policy | group policy + binding + explicit actual Admin sender | default review, approved sender accepted, other sender denied |
| 4: clients/multiple representatives/groups | Clients/Contacts/Groups, As Per Client filter, intent gate | multiple reps link same Draft, client query/filter, role-scoped group |
| 4.2: client service order → Draft | source draft route and Draft business key | Draft visible without escort; does not confirm assignment |
| 5: central source/binding management | UI source/accounts/contacts/groups/bindings; soft deactivate | Add/Edit/Replace, revisions, effective versions; no code redeploy |
| 6: separate identity/business rules/traceability | parser routing gate, canonical writer, source evidence/audit | payout cannot create employee; ambiguous roles/aliases reviewed; CSV cannot bypass identity |
| 7: navigation and operational forms | Administration, Data Import, Accounts, register, program tools, reports | API/form workflows and build; real device/browser still pending |

Existing program tools and editable program forms support assignment, duty status and release fields. Employee/duty messages currently queue review; automatic attendance/payroll/settlement computations are not implemented. Actual bridge installation/pairing and VPS rollout remain operator setup, not claimed local functionality. OCR/signature recognition is not implemented. See VALIDATION.md for precise remaining tests and source limits.
