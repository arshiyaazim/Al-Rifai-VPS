# Source configuration, identity ও incremental import

## এক app, এক writer

Frontend form, file import, WhatsApp MCP এবং optional Hermes একই PostgreSQL `alrifai` schema ও `server/records.mjs` writer ব্যবহার করে। `source=historical` পুরোনো URL compatibility parameter; এখানে এটি বর্তমান PostgreSQL rows পড়ে। কোনো পুরোনো JSON snapshot বা FPE/WBOM/D1 data গোপনে seed হয় না। আগের business data নিতে নিজের original files বা separately mapped migration লাগবে।

## Authority configuration

ক্রম: **WhatsApp account → Accountant/Client → verified Contact → Source connection → Binding**।

- Account-এ প্রকৃত Admin phone, role, aliases ও effective dates দিন। Accountant-এর related Admin account নির্বাচন করুন। Primary phone দিলে linked contact তৈরি হয়; আরও নম্বর Contacts থেকে যোগ করুন।
- Alias হলো TXT export-এর exact sender label। একই alias ভিন্ন phone-এ থাকলে parser অনুমান করবে না। Contact name/phone Employee ID নয়।
- Binding-এ source, account, domain, party/contact বা group, conversation type ও permission নির্ধারণ করুন। Direct chat-এর **Follow contact phone** mode নম্বর বদলালে JID-ও বদলায়; ভিন্ন transport identity হলে Exact JID দিন। Group-এর JID হুবহু প্রয়োজন।
- Groups default `review_only`। `cash_admin_group` policy এবং সমজাতীয় binding-এ bound Admin-এর actual sender phone আবশ্যক। `program_draft` client authority থেকে Draft; `program_operations` শুধু অনুমোদিত operational sender। group name/membership দিয়ে authority পাওয়া যায় না।
- `employee_review` duty/employee তথ্যকে review-তে পাঠায়; contact থেকে স্বয়ংক্রিয় employee তৈরি করে না। Unassigned chat কেবল explicit watch scope-এ থাকলে identity review-র জন্য রাখা হয়; outside scope intake rejected।
- একই phone-এ কয়েকটি role থাকলে domain permission ও message intent মিলতে হবে; ambiguity হলে review।
- Contact/account/group/party/binding change DB-তে version হয়। Future change নির্ধারণ করলে ততদিন পুরোনো effective version চলে। Deactivate active routing বন্ধ করে, পুরোনো record/evidence মোছে না। ঐতিহাসিক transaction-এ তৎকালীন routing snapshot থাকে।
- নতুন permission শুরু হয় approval-এর আগে নয়। ভবিষ্যৎ timestamp দিয়ে আগেভাগে permission নেওয়া যায় না। নতুন config দিয়ে পুরোনো messages পুনরায় import করলেই cash অনুমোদন হয় না।

## TXT import

এক conversation-এর পরের export **একই File source**-এ দিন। Supported export হলো `DD/MM/YYYY, HH:MM - Sender: message` (২৪ ঘণ্টা) ও multiline body। অন্য locale/AM-PM/iOS format আগে adapter দিয়ে যাচাই করুন; unreadable/zero-message file failure দেখায়।

1. Binding ও exact export identity যাচাই করুন; owner confirmation ছাড়া TXT থেকে Accounts তৈরি হয় না। Filename/contact name যথেষ্ট নয়।
2. পুরোনো phone হলে explicit historical **Conversation identity version** নির্বাচন করুন। নতুন binding-এর approval-পূর্ব export হলে Super Admin নির্দিষ্ট file/binding-এর জন্য historical confirmation দিতে পারেন। এই exception অন্য file/transport-কে retro-authorize করে না।
3. Preview-তে total source items, existing, new, changed, record candidates, likely duplicate ও review counts দেখুন। Preview source bytes/items রাখে, business rows লেখে না।
4. Confirm দিলে কেবল উপযুক্ত নতুন rows writer-এ যায়। অপর্যাপ্ত identity/media/conflicting বা changed items review-তে থাকে। Config বদলালে stale preview 409 দেয়; Refresh preview করে আবার যাচাই করুন।
5. Original file, import time/result ও review links সংরক্ষিত থাকে। Completed import আবার confirm করলে দ্বিগুণ পোস্ট হয় না। Cancel ব্যবসায়িক row তৈরি করে না।

TXT-তে upstream message ID নেই। date/time/sender/occurrence anchor এবং body hash দিয়ে পুনরায় export মেলানো হয়। একই anchor-এর changed text correction review হয়; আগের source অক্ষুণ্ণ থাকে। একই মিনিটে একই sender-এর message reorder/insert/alias change হলে অস্পষ্টতা থাকতে পারে। Review ছাড়া নিঃশব্দে merge/delete করবেন না। Live message এবং TXT-এর IDs ভিন্ন; cross-source business key ও likely-duplicate checks দ্বিতীয় প্রতিরক্ষা।

## Structured CSV / JSON / XLSX

`templates/`-এর **canonical camelCase headers** ব্যবহার করুন। CSV default kind নির্বাচন করা যায়; অন্যথায় `kind` কলাম আবশ্যক। Dates `YYYY-MM-DD`, shifts `D`/`N`, phones text, amount BDT decimal ≤২ ঘর। `releaseConfirmed=true` কেবল মানব-যাচাই করা release-এর জন্য। JSON array অথবা `{ "records": [] }` গ্রহণযোগ্য। Unknown columns থেকে business meaning অনুমান করা হয় না।

প্রতিটি row-এ স্থায়ী **sourceRecordId** রাখুন; সংশোধনেও ID একই থাকবে। তখন edited amount/name existing record-এর correction হয়। ID না থাকলে exact row fingerprint+occurrence ব্যবহৃত হয়; একই identity/date-এ changed amount ambiguous review হয়। সব identity field বদলে গেলে ID ছাড়া পুরোনো row নির্ভরযোগ্যভাবে চেনা যায় না।

Owner-submitted structured business CSV হলো explicit manual data submission; Preview/Confirm লাগে। কিন্তু `senderPhone`, `receiverPhone`, `conversationType`, `chatId` বা `sender` থাকা conversation-derived CSV-তে verified binding, identity confirmation, actual timestamp ও direction gate আবশ্যক। শুধু amount/content বা CSV format দিয়ে WhatsApp Accounts identity bypass করা যায় না।

Changed source review-তে **Update existing record** নির্বাচন করে current revision ও কারণ দিন। Linked correction নতুন transaction হিসেবে Accept করা blocked। আলাদা সত্যিকারের payment একই amount হলেও distinct reference ও সুনির্দিষ্ট কারণ দিয়ে review করতে হয়; শুধু text/phone মিলিয়ে নিঃশব্দে মুছে দেওয়া হয় না।

সীমা: file 10 MB; HTTP JSON request 15 MB। Restart-এ preparing/pending job failed হয়; original রেখে Retry করা যায়। একই file আবার দিলে known completed run ফিরে আসে।

## Release slips, media ও টাকা

Image/PDF bytes রাখা হয়, **OCR/classifier নেই**। `<Media omitted>` TXT-তে ছবির তথ্য থাকে না। Voucher-এ vessel/escort/date থাকলেই release নয়। Completed/Released-এর জন্য end date, end shift, release point এবং explicit human confirmation প্রয়োজন। Signatures/ছবির শ্রেণিবিন্যাস মানুষ যাচাই করবেন।

দুই mobile থাকলে explicit ID/নামের আগের mobile Employee ID; নামের পরের দ্বিতীয় mobile শুধুই payout। একমাত্র post-name mobile Employee ID হতে পারে, আলাদা payout unavailable। Employee ID আলাদা column; contact/payout identity হিসেবে auto ব্যবহার নয়। নির্দেশিত amount বা transaction নিজে receipt/payment settlement-এর প্রমাণ নয়।

## WhatsApp MCP consumer

`integrations/mcp-consumer.mjs` আলাদা existing `@sjawhar/whatsapp-mcp@2.4.1` tool schema অনুযায়ী stdio read client। Upstream bridge/package binary এই ZIP-এ নেই; live pairing করা হয়নি। Compatible existing bridge reuse করুন; অন্য package-এর schema হলে adapter verify করতে হবে।

1. WhatsApp MCP source তৈরি করে ID/token private env-এ রাখুন। Authority entities/bindings UI-এ আগে configure করুন। Token একবার দেখানো হয়।
2. নিজের authorized account privately pair করুন। `MCP_WORKDIR` project-এর বাইরে private bridge directory। একই account-এর দ্বিতীয় competing bridge process চালাবেন না; consumer child spawn করে।
3. `integrations/mcp.env.example` কপি করুন। `MCP_COMMAND_JSON` executable+arguments JSON array, shell string নয়। `MCP_ACCOUNT_PHONE` আসল paired profile phone; mismatch হলে intake থামে। UI WhatsApp account যোগ করা phone pairing নয়।
4. প্রথমে একবার চালিয়ে end-to-end পরীক্ষা করুন:

```bash
chmod 600 integrations/mcp.env
node --env-file=integrations/mcp.env integrations/mcp-consumer.mjs --once
node --env-file=integrations/mcp.env integrations/mcp-consumer.mjs
```

চালু অবস্থায় bindings/chat scope প্রতি cycle API থেকে আসে; Accountant/Client/contact replacement-এর জন্য app redeploy লাগে না। `REGISTER_ALLOWED_CHAT_JIDS` ঐচ্ছিক অতিরিক্ত watch scope; permission নয়। `live`-এর প্রথম bound chat poll binding activation থেকে messages আনে, যাতে consumer দেরিতে শুরু হলেও প্রথম বৈধ message বাদ না যায়। `backfill` readable cache পড়ে, কিন্তু effective identity rule এড়িয়ে যায় না। Existing checkpoint mode বদলালে মুছে যায় না।

শুধু `get_my_profile`, `list_messages`, `get_message_context` tool অনুমোদিত; mutating/send/reply/delete/download/sync/transcribe tool upstream-এ পাঠানো হয় না। `WA_READ_ONLY=1` সহ hard allowlist আসল নিয়ন্ত্রণ।

Outgoing Admin message profile+peer JID থেকে চিহ্নিত হয়। Incoming direct message peer numeric JID; group-এর actual sender phone না থাকলে authority অনুমান নয়। Default poll ২ সেকেন্ড + bridge/network/parsing latency। Per-chat cursor/seen-ID/body hashes persistent; replay/restart idempotent। Observed message edit correction review হয়। Missing checkpoint/history gap/timestamp-boundary ambiguity হলে cursor advance বন্ধ হয়। Poll window-এর বাইরে পুরোনো edit বা bridge-এ না-থাকা history/media সম্পূর্ণ পাওয়া নিশ্চিত নয়; file reconciliation করুন। Remote delete register মুছে দেয় না।

## Hermes / trusted original-envelope producer

Hermes source + binding তৈরি করুন; adapter `integrations/hermes-client.mjs` ব্যবহার করা যায়। Model/daemon এখানে install/live connect করা হয়নি। Token শুধু producer-এ রাখুন।

`POST /api/integrations/{sourceId}/messages`, bearer token, body:

```json
{"messages":[{"externalId":"upstream-message-id","chatId":"exact-authorized-JID","conversationType":"direct","senderPhone":"OWNER_VERIFIED_PHONE","receiverPhone":"OWNER_VERIFIED_RECIPIENT","timestamp":"2026-10-16T09:30:00+06:00","text":"original unmodified message","metadata":{"fromMe":true,"hasMedia":false}}]}
```

Placeholder values বদলাতে হবে। প্রতি call ১–১০০ envelopes। Identity content থেকে AI দিয়ে বানানো যাবে না। Server source/chat/role/direction enforce করে, কিন্তু compromised trusted producer-এর transport metadata independently authenticate করতে পারে না। Read/query access owner-controlled, default off। Chatbot কখনো WhatsApp পাঠায় বা ledger পরিবর্তন করে না।


## Fixed cash identity rule

WhatsApp sources do not gain Cash permission from a display name, group membership, or a number appearing in body text. Automatic Cash requires the verified Owner sender, the actual direct Accountant recipient/chat JID, payment intent, reliable employee mobile, validated available fields and idempotency. Unknown JID/LID or missing private environment identity is review-only. This MCP adapter currently reads profile/messages/context and does not yet read the contact book; do not claim Owner/Accountant contact-book names or LID mappings are verified. See [CASH-PAYMENT-IDENTITY.md](CASH-PAYMENT-IDENTITY.md).
