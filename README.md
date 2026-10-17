# Al-Rifa’i — editable VPS project 2.0

দৈনন্দিন Vessel Program Register ও Employee Cash Accounts-এর জন্য একটি React/Vite + Node + PostgreSQL অ্যাপ। সংযুক্ত Owner Requirements অনুযায়ী Accountant, Client, WhatsApp account/contact/group ও routing ফ্রন্টএন্ড থেকেই বদলানো যায়। নতুন বৈধ message বা Send/Save-এর পর একই live tables ও data assistant আপডেট হয়।

**শুরু করুন:** [VPS setup](docs/VPS-SETUP.md) → [Source configuration](docs/DATA-SOURCES.md)। পরবর্তী এজেন্টের জন্য [AGENTS.md](AGENTS.md), [requirements mapping](docs/REQUIREMENTS.md), [API](docs/API.md) ও [validation](docs/VALIDATION.md) আছে।

## প্যাকেজে যা আছে

- আলাদা editable frontend, CSS/assets, backend, PostgreSQL schema ও ২টি versioned migration; lockfile, tests, deployment examples।
- **খালি business database**: ২০টি table (migration bookkeeping-সহ), ২টি view। কোনো আসল payment, owner chat export, production dump, password বা WhatsApp session seed করা নেই। মূল requirements document `docs/OWNER-REQUIREMENTS.md`-এ আছে।
- Super Admin / Admin / Viewer login; Add, View, Edit, recoverable Delete ও Restore; revision conflict ও duplicate review।
- Administration: WhatsApp Accounts, Accountants, Clients, একাধিক Contacts/Representatives, Groups, Source Bindings, Employees। কার্যকর সময়, scheduled replacement, deactivate ও change history।
- Data Import: TXT/CSV preview, existing/new/changed/review counts, explicit confirm, incremental পুনরায় import, original file download ও import history। JSON/XLSX-ও canonical structured data হিসেবে গ্রহণযোগ্য। ছবি/PDF manual review।
- অনুমোদিত WhatsApp MCP read consumer এবং optional Hermes envelope adapter। একই canonical writer-এ frontend, import ও live intake।
- Client service order → **Draft Program**; As Per Client filter; operational program updates, assignment/edit এবং required release fields। Draft মানে confirmed assignment নয়।
- Master table, search/filter, sorting, pagination, details, totals, duplicate/conflict review, current-data structured chatbot।
- ২১ ধরনের report: CSV/JSON/HTML এবং Print / browser Save as PDF। পূর্ণ matching rows export হয়।

## প্রথম ব্যবহারের ক্রম

1. বিদ্যমান VPS PostgreSQL ও network যাচাই করে private `.env` পূরণ করুন; build/start করুন। প্রথম login হবে bootstrap Super Admin।
2. Administration-এ নিজের প্রকৃত Admin WhatsApp account, Accountant/Client এবং যাচাইকৃত contacts তৈরি করুন। শুধু নামকে identity proof ধরবেন না।
3. Data Import & WhatsApp Sources → Connections-এ File / WhatsApp MCP / Hermes source তৈরি করুন। এরপর সেই source-এর নির্দিষ্ট binding ও scoped permission দিন।
4. TXT-এর জন্য exact sender aliases, conversation identity এবং প্রয়োজন হলে Super Admin-এর নির্দিষ্ট historical-file confirmation দিন। CSV-তে `templates/`-এর headers ও স্থায়ী `sourceRecordId` ব্যবহার করুন। Preview দেখে Confirm করুন।
5. Live WhatsApp-এর জন্য বিদ্যমান bridge privately pair/configure করুন। frontend account তৈরি করা QR pairing নয়। `--once` দিয়ে source → DB → table → assistant যাচাই করে consumer চালু রাখুন।
6. অনিশ্চিত/বদলে যাওয়া/সম্ভাব্য duplicate source review-তে মেটান। Correction-এ existing record update করুন; দ্বিতীয় transaction বানাবেন না।

## গুরুত্বপূর্ণ আচরণ

Direct Accounts শুধু অনুমোদিত **Admin → Accountant**। Group default review; explicit Super Admin group policy ও প্রকৃত authorized sender ছাড়া cash পোস্ট নয়। নতুন অনুমোদন পুরোনো message-কে স্বয়ংক্রিয়ভাবে অনুমোদিত করে না। Employee ID এবং Payout Mobile আলাদা; payout/contact নম্বর থেকে employee তৈরি হয় না।

একই source message পুনরায় এলে নতুন row হয় না। একই valid master mobile + escort mobile + start date এক program। Changed source পুরোনো record নিঃশব্দে overwrite করে না। TXT-তে স্থায়ী WhatsApp message ID না থাকায় একই সময়ে একই sender-এর reordered/edited messages অথবা ID-বিহীন CSV-র সংশোধন পুরোপুরি নির্ণয় করা সম্ভব নয়; ambiguous items review-তে রাখুন। অদেখা source-এ “কখনো missing/duplicate হবে না” এমন দাবি নেই।

Cargo, booking, capacity, registration/slip-number field যোগ করা হয়নি। Client management নতুন requirements-এ স্পষ্টভাবে চাওয়া হয়েছে বলে যুক্ত হয়েছে। Payment instruction-কে bank receipt বা salary due-এর প্রমাণ হিসেবে ধরা হয় না।

## চালানো ও যাচাই

Node ≥22.13, Python ≥3.10 এবং বিদ্যমান PostgreSQL প্রয়োজন। `.env`-এ নিজের connection ও bootstrap password দিন; `PYTHON_BIN` প্রয়োজন হলে venv-এর absolute path দিন।

```bash
npm ci
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm run build
npm run db:migrate
npm start
```

```bash
npm test
npm run check
npm run build
```

Local automated verification: **২৪৭ checks PASS** (১৪০ baseline + ১০৭ dynamic routing/import), type-check clean, production build সফল। বাস্তব VPS/WhatsApp/QR, Docker runtime ও browser/device QA এই প্যাকেজ তৈরিতে চালানো হয়নি। বর্তমান deployed Sites পেজ পরিবর্তন বা public publish করা হয়নি।


## Permanent Owner → Accountant Cash Payment Gate (2026-10-17)

This is a mandatory business rule for every WhatsApp cash-payment intake, parser, import/backfill path, API and database writer. It remains in force until the Owner explicitly changes it.

1. Sender must equal the privately configured, verified `CASH_OWNER_PHONE`.
2. The actual direct recipient and actual direct chat JID must resolve to the verified `CASH_ACCOUNTANT_PHONE`. A phone number merely written in message text is not proof of the recipient. Group chats and unresolved LID/JID mappings are blocked for cash.
3. Text must contain cash/payment intent.
4. Employee mobile must be reliably extracted; otherwise create no Cash Transaction and retain a review item.
5. Validate available amount, date/time, payment details, source identity and timestamp.
6. Deduplicate both the source message (source + message ID + chat) and the payment instruction/business key. Changed source content requires review, not a second payment.

Any failed/unknown check means **no automatic Cash Transaction**. Accountant-originated replies, ordinary chat, unauthorized groups, and unrelated chats cannot become Owner payment instructions. A manual entry is a separate, authenticated human workflow and must not be represented as a WhatsApp-verified instruction.

**Identity/privacy:** see the verification checklist in [docs/CASH-PAYMENT-IDENTITY.md](docs/CASH-PAYMENT-IDENTITY.md). This repository is public. Never put real phone numbers, contact-book exports, live JIDs/LIDs, access tokens or secrets in README, committed `.env`, SQL fixtures or public issue text. Put verified phone numbers only in the private VPS `.env`. Keep a private operational identity record containing verified Owner display/contact name, phone, chat JID, WhatsApp JID/LID mapping, Accountant contact-book display name, phone, JID/LID, bridge/account number, evidence source and verification timestamp. Until verified, mark each field `UNVERIFIED`; do not guess.

**Fixed frontend URL and app flow:** preserve the current owner-approved frontend URL, application flow, cash-account screens and business behavior. Do not change the URL, publish/deploy, migrate production data or restart live services without the applicable explicit deployment approval.
