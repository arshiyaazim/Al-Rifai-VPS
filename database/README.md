# PostgreSQL database files

The project provides executable schema migrations, not a copied production database binary. `npm run db:migrate` or server startup creates the empty `alrifai` schema in your existing PostgreSQL database. No business rows are seeded. Bootstrap creates only the owner login when configured.

| Tables | Purpose |
| --- | --- |
| records, employees | Canonical programs/transactions/vessels/projects and explicit employee identities |
| sources, source_files, messages, record_evidence | Source connections, exact uploaded bytes, original envelopes and record links |
| managed_entities, managed_entity_versions, routing_versions | Authority configuration and effective-dated identities/bindings |
| import_runs, import_items, import_item_changes, message_changes | Import previews/results, stable source matching and changed-source retention |
| reviews, audit_log, consumer_checkpoints | Decisions, changes, durable consumer progress |
| users, sessions, login_attempts | Private authentication and login controls |
| schema_migrations | SHA-checked migration bookkeeping |

20 tables, 2 read views: `programs`, `accounts_transactions`. Views project the canonical records; they are not a second independently maintained ledger. No separate PostgreSQL service or parallel database is included. v1→v2 migration preserves existing records. Keep 001/002 immutable after application; future schema changes need a new migration. Backup/restore instructions are in docs/VPS-SETUP.md.
