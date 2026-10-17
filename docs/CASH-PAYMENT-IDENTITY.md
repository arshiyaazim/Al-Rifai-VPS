# Cash Payment Identity Record — private verification required

This template intentionally contains no real contact data. Fill the private copy on the VPS only after checking the active WhatsApp bridge and its contact book. Do not commit real phone numbers, names, JIDs, LIDs, message exports, or credentials to this public repository.

## Owner / Super Admin

- Display name in WhatsApp/contact book: UNVERIFIED
- Normalized mobile (`CASH_OWNER_PHONE`): UNVERIFIED
- Internal AL-RIFA'I account/entity ID: UNVERIFIED
- Actual direct chat JID: UNVERIFIED
- WhatsApp account/device JID: UNVERIFIED
- LID mapping (if any, exact source and verification evidence): UNVERIFIED
- Bridge/service name and paired account number: UNVERIFIED
- Evidence source, checked timestamp (UTC), verifier: UNVERIFIED

## Accountant

- Contact-book display name: UNVERIFIED
- Normalized mobile (`CASH_ACCOUNTANT_PHONE`): UNVERIFIED
- Internal AL-RIFA'I accountant/contact IDs: UNVERIFIED
- Actual direct chat JID: UNVERIFIED
- WhatsApp JID: UNVERIFIED
- LID mapping (if any, exact source and verification evidence): UNVERIFIED
- Bridge/service name and paired account number: UNVERIFIED
- Evidence source, checked timestamp (UTC), verifier: UNVERIFIED

## Verification gates

1. Read the existing VPS handoff and service map before inspecting live services.
2. Read current bridge account identity and contact-book data from a supported read-only source. A message-body phone number or display name alone is not proof.
3. Match actual `chat_jid`, sender/recipient JID and any LID mapping to the verified phone. If the adapter cannot retrieve contacts or prove a LID mapping, leave it UNVERIFIED and block automatic cash routing.
4. Set `CASH_OWNER_PHONE` and `CASH_ACCOUNTANT_PHONE` only in the private VPS `.env` after independent verification. The repository `.env.example` must stay blank.
5. Test positive Owner → Accountant direct chat and negative tests (Accountant reply, wrong recipient, wrong chat, group, unknown LID, missing employee mobile, no payment intent, replay and duplicate payment) before enabling live automatic cash posting.
6. Do not alter the owner-approved frontend URL, application flow or existing cash UI. Do not deploy, restart, migrate, send a message, or write/post real financial transactions as part of identity verification.

## Current known limitation

The source adapter currently requires `get_my_profile`, `list_messages`, and `get_message_context`. It does not currently retrieve the bridge's contact book. Therefore the contact-book display name and live Owner/Accountant phone/JID/LID mapping cannot be verified from this adapter alone. Keep the fields above UNVERIFIED until a read-only contact-book adapter and live bridge evidence are available.
