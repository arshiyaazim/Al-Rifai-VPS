# AL-RIFA’I — Data Import, WhatsApp Source Management & Dynamic Business Routing

**Document Type:** Owner Business Requirements  
**Scope:** Frontend, Backend, Database, WhatsApp Integration, Cash Accounts এবং Vessel Program Register

## ১. মূল উদ্দেশ্য

AL-RIFA’I অ্যাপের ব্যবসায়িক তথ্য তিনটি প্রধান উৎস থেকে গ্রহণ ও প্রক্রিয়াকরণ করা হবে:

1. **Frontend Data Submission:** অ্যাডমিন বা অনুমোদিত ব্যবহারকারী সরাসরি ওয়েব অ্যাপের মাধ্যমে তথ্য প্রদান করবেন।
2. **TXT/CSV File Import:** WhatsApp Chat Export বা অন্যান্য অনুমোদিত TXT/CSV ফাইল ফ্রন্টএন্ড থেকে আপলোড করে তথ্য ইমপোর্ট করা যাবে।
3. **WhatsApp Conversation:** অনুমোদিত WhatsApp নম্বর বা গ্রুপের কথোপকথন থেকে স্বয়ংক্রিয়ভাবে সংশ্লিষ্ট ব্যবসায়িক তথ্য শনাক্ত ও প্রক্রিয়াকরণ করা হবে।

এই তিনটি উৎস থেকে প্রাপ্ত তথ্য একই অনুমোদিত ব্যবসায়িক নিয়ম অনুসরণ করবে এবং AL-RIFA’I-এর কেন্দ্রীয় PostgreSQL ডেটাবেসে সংরক্ষিত হবে।

একই তথ্য একাধিক উৎস থেকে এলেও যেন অপ্রয়োজনীয় ডুপ্লিকেট রেকর্ড তৈরি না হয়, সেটি নিশ্চিত করতে হবে।

## ২. Frontend TXT/CSV Import Management

অ্যাপের ফ্রন্টএন্ডে একটি **Data Import** অপশন থাকবে।

সেখানে Admin বা অনুমোদিত ব্যবহারকারী TXT ও CSV ফাইল আপলোড করতে পারবেন।

### ২.১ Incremental Import ও Duplicate Prevention

ধরা যাক, আজ একটি WhatsApp TXT ফাইল ইমপোর্ট করা হলো, যেখানে গত ছয় মাসের কথোপকথন রয়েছে।

পরদিন একই Chat Export আবার আপলোড করা হলো, যেখানে আগের ছয় মাসের তথ্যের পাশাপাশি নতুন এক দিনের কথোপকথন যুক্ত হয়েছে।

সেক্ষেত্রে সিস্টেম:

- আগে ইমপোর্ট করা তথ্য শনাক্ত করবে।
- পূর্বে সংরক্ষিত একই তথ্য পুনরায় গ্রহণ করবে না।
- শুধু নতুন তথ্য ও নতুন মেসেজগুলো শনাক্ত করে গ্রহণ করবে।
- একই ফাইল বারবার ইমপোর্ট করলেও ডুপ্লিকেট ব্যবসায়িক রেকর্ড তৈরি করবে না।
- পূর্বে থাকা তথ্য পরিবর্তিত বা সংশোধিত হলে সেটিকে নতুন স্বতন্ত্র লেনদেন হিসেবে না ধরে যথাযথভাবে শনাক্ত ও পর্যালোচনা করবে।
- প্রতিটি ইমপোর্টের উৎস, সময় ও ফলাফল সংরক্ষণ করবে।

**মূলনীতি:** Import হবে incremental এবং idempotent। অর্থাৎ পুরোনো তথ্য পুনরায় যোগ না করে শুধু প্রকৃত নতুন তথ্য গ্রহণ করতে হবে।

শুধু মেসেজের টেক্সট বা মোবাইল নম্বর মিলে যাওয়ার কারণে দুটি স্বতন্ত্র লেনদেনকে এক করে ফেলা যাবে না।

### ২.২ Import Preview

ইমপোর্ট সম্পন্ন করার আগে ফ্রন্টএন্ডে দেখানো উচিত:

- মোট কতটি রেকর্ড পাওয়া গেছে।
- কতটি আগে থেকেই রয়েছে।
- কতটি নতুন।
- কতটি পরিবর্তিত বা অস্পষ্ট, যার Review প্রয়োজন।

তারপর অনুমোদিত নতুন তথ্য ইমপোর্ট করা হবে।

মূল TXT/CSV ফাইলের source reference ও import history সংরক্ষিত থাকবে, যাতে ভবিষ্যতে তথ্য যাচাই করা যায়।

## ৩. Dynamic Accountant Management

বর্তমানে Cash Payment সম্পর্কিত WhatsApp তথ্য একটি নির্দিষ্ট Admin এবং Accountant-এর কথোপকথন থেকে শনাক্ত করা হচ্ছে।

কিন্তু কোম্পানির Accountant পরিবর্তন হতে পারে। তাই Accountant-এর মোবাইল নম্বর বা পরিচয় অ্যাপের কোডে স্থায়ীভাবে নির্ধারণ করে রাখা যাবে না।

### ৩.১ Frontend Accountant Management

Admin Panel-এ **Manage Accountants / অ্যাকাউন্ট্যান্ট ব্যবস্থাপনা** নামে একটি অপশন থাকবে।

এখান থেকে Super Admin:

- Accountant যুক্ত করতে পারবেন।
- Accountant-এর নাম ও WhatsApp মোবাইল নম্বর নির্ধারণ করতে পারবেন।
- বর্তমান Accountant-এর তথ্য দেখতে পারবেন।
- নাম ও প্রয়োজনীয় তথ্য সংশোধন করতে পারবেন।
- Accountant পরিবর্তন করতে পারবেন।
- পুরোনো Accountant নিষ্ক্রিয় করতে পারবেন।
- প্রয়োজন অনুযায়ী একাধিক অনুমোদিত Accountant বা সংশ্লিষ্ট WhatsApp নম্বর ব্যবস্থাপনা করতে পারবেন।

প্রতিটি Accountant-এর জন্য প্রয়োজনীয় তথ্য:

- নাম
- WhatsApp মোবাইল নম্বর
- দায়িত্ব বা Role
- Active/Inactive Status
- দায়িত্ব শুরুর তারিখ
- দায়িত্ব শেষের তারিখ, প্রযোজ্য হলে
- সংশ্লিষ্ট Admin WhatsApp Account

### ৩.২ Cash Conversation Routing Rule

Cash Payment ও Accounts-সম্পর্কিত WhatsApp তথ্যের ক্ষেত্রে সিস্টেম শুধু অনুমোদিত Admin WhatsApp Account এবং অনুমোদিত Accountant-এর নির্ধারিত কথোপকথনকে Accounts Workflow-তে গ্রহণ করবে।

অন্য কোনো ব্যক্তিগত WhatsApp কথোপকথন স্বয়ংক্রিয়ভাবে Cash Payment হিসেবে গণ্য হবে না।

Accountant-এর নম্বর পরিবর্তন হলে:

1. Super Admin ফ্রন্টএন্ড থেকে নতুন Accountant নির্বাচন বা যুক্ত করবেন।
2. নতুন নম্বরের পরিচয় ও অনুমোদিত সম্পর্ক সংরক্ষিত হবে।
3. নির্ধারিত কার্যকর সময় থেকে নতুন Accountant-এর সঙ্গে অনুমোদিত Admin Account-এর কথোপকথন Accounts Workflow-তে যাবে।
4. পুরোনো Accountant-এর ঐতিহাসিক Cash Records অপরিবর্তিত থাকবে।
5. Accountant পরিবর্তনের জন্য Backend Code পরিবর্তন বা নতুন Deployment প্রয়োজন হবে না।

একজন Accountant পরিবর্তন হলেও কোম্পানির Cash Management কার্যক্রম বন্ধ হওয়ার কথা নয়।

### ৩.৩ Accounts WhatsApp Group Management

Accounts Module-এর অধীনে **Add WhatsApp Group** অপশন থাকবে।

এখান থেকে Super Admin অনুমোদিত Accounts Group যুক্ত, View, Edit বা Deactivate করতে পারবেন।

তবে Group যুক্ত করলেই সেই গ্রুপের সব মেসেজ Cash Transaction হয়ে যাবে না।

প্রতিটি মেসেজের প্রেরক, অনুমোদিত ভূমিকা, উদ্দেশ্য এবং প্রযোজ্য Cash Business Rules যাচাই করতে হবে।

Accounts Group-এর মাধ্যমে কোন ধরনের নির্দেশনা গ্রহণযোগ্য হবে, সেটি সংশ্লিষ্ট অনুমোদিত Group Policy অনুসারে নির্ধারিত হবে।

## ৪. Dynamic Escort Client Management

Vessel Program Register-এর জন্য একই ধরনের ব্যবস্থা থাকবে।

বর্তমানে Client-এর WhatsApp কথোপকথন থেকে Escort Program-এর তথ্য শনাক্ত করা হচ্ছে।

এই Client পরিচয়ও কোডে স্থায়ীভাবে নির্ধারিত থাকবে না।

### ৪.১ Frontend Client Management

Vessel Register বা Escort Program Module-এ **Manage Clients / As Per Client** অপশন থাকবে।

Super Admin এখান থেকে:

- নতুন Client যুক্ত করবেন।
- Client-এর নাম ও WhatsApp নম্বর নির্ধারণ করবেন।
- একই Client-এর অধীনে একাধিক অনুমোদিত ব্যক্তি বা মোবাইল নম্বর যুক্ত করতে পারবেন।
- Client-এর তথ্য View, Edit ও Update করতে পারবেন।
- পুরোনো Client বা নির্দিষ্ট Contact নিষ্ক্রিয় করতে পারবেন।
- Client-সংশ্লিষ্ট WhatsApp Group যুক্ত করতে পারবেন।

একজন Client-এর একজন বা একাধিক প্রতিনিধি থাকতে পারেন। তাঁদের প্রত্যেকের অনুমোদিত পরিচয় ও যোগাযোগ নম্বর আলাদাভাবে সংরক্ষণ করতে হবে।

### ৪.২ Client Conversation থেকে Draft Program

Super Admin কর্তৃক অনুমোদিত Client Contact-এর সঙ্গে নির্ধারিত Admin WhatsApp Account-এর কথোপকথন থেকে Escort Service Order শনাক্ত হলে সিস্টেম:

1. Client পরিচয় যাচাই করবে।
2. মেসেজের প্রকৃত উদ্দেশ্য শনাক্ত করবে।
3. Mother Vessel, Lighter Vessel, Master, Program Date এবং অন্যান্য প্রাসঙ্গিক তথ্য সংগ্রহ করবে।
4. প্রযোজ্য তথ্যের ভিত্তিতে PostgreSQL Database-এ একটি **Draft Program Row** তৈরি করবে।
5. Draft Program ফ্রন্টএন্ডের Vessel Register-এ দেখাবে।
6. পরবর্তী Confirmation, Assignment, Duty এবং Release বিদ্যমান Owner-approved Business Rules অনুসারে পরিচালনা করবে।

একটি Draft তৈরি হওয়া মানেই সেটি Confirmed Program বা Escort Assignment নয়।

### ৪.৩ Client WhatsApp Group Management

Vessel Register-এ **Add Client WhatsApp Group** অপশন থাকবে।

এখানে Super Admin অনুমোদিত Client Group যুক্ত করতে পারবেন।

Group-এর সঙ্গে সংশ্লিষ্ট Client, অনুমোদিত প্রতিনিধি এবং ব্যবসায়িক Domain নির্ধারণ করা যাবে।

Group-এর নাম বা সদস্যপদ একাই কোনো ব্যক্তিকে Client Authority প্রদান করবে না। মেসেজের প্রকৃত প্রেরক ও অনুমোদিত Role যাচাই করতে হবে।

## ৫. Central WhatsApp Source & Routing Management

Frontend-এ একটি কেন্দ্রীয় **WhatsApp Source Management** ব্যবস্থা থাকবে।

এখান থেকে Super Admin বিভিন্ন WhatsApp Account, Contact এবং Group-এর সঙ্গে নির্দিষ্ট ব্যবসায়িক কাজের সম্পর্ক নির্ধারণ করবেন।

উদাহরণ:

| Source Type | Assigned Business Domain |
|---|---|
| Admin ↔ Accountant | Accounts / Cash |
| Admin ↔ Escort Client | Vessel Register / Escort Program |
| Approved Accounts Group | Accounts Review / Authorized Cash Workflow |
| Approved Client Group | Escort Order / Program Review |
| Employee Contact | Employee / Duty / Attendance |
| Unassigned Contact | Identity / Intent Review |

### Frontend Operations

প্রতিটি অনুমোদিত Source Binding-এর জন্য থাকবে:

- Add
- View
- Edit
- Change / Replace
- Deactivate / Remove
- Current Status
- Effective Date ও Change History

এখানে Remove বা Delete বলতে সাধারণভাবে Active Routing থেকে সরানো বোঝাবে। পূর্বের Message Evidence, Ledger Record বা Audit History মুছে ফেলা বোঝাবে না।

## ৬. Source Binding ও Historical Data Policy

Admin, Accountant, Client এবং WhatsApp Group-এর সম্পর্ক Database Configuration-এর মাধ্যমে পরিচালিত হবে।

নতুন Accountant, Client বা Group যুক্ত করতে Source Code পরিবর্তনের প্রয়োজন হবে না।

তবে নিম্নলিখিত নিয়মগুলো বজায় থাকবে:

- নতুন অনুমোদন পুরোনো মেসেজকে স্বয়ংক্রিয়ভাবে ঐতিহাসিকভাবে অনুমোদিত করে দেবে না।
- Contact পরিবর্তন হলেও পূর্বের তথ্য ও Audit History সংরক্ষিত থাকবে।
- একই মোবাইল নম্বরের সঙ্গে একাধিক অনুমোদিত ভূমিকা থাকলে Message Intent ও Scoped Permission অনুসারে Routing হবে।
- WhatsApp Source, TXT/CSV Import এবং Frontend Entry-এর মধ্যে একই Business Record-এর পরিচয় ও Source Traceability বজায় থাকবে।
- একই তথ্য পুনরায় পাওয়া গেলে Duplicate Posting বা Duplicate Program Creation প্রতিরোধ করতে হবে।
- কোনো ব্যক্তির WhatsApp Contact Number স্বয়ংক্রিয়ভাবে Employee ID বা Payout Number হয়ে যাবে না।
- Accounts ও Escort Program-এর Data Extraction পৃথক Business Rules অনুসরণ করবে।

## ৭. প্রস্তাবিত Frontend Navigation

**Administration**

- WhatsApp Accounts
- Manage Accountants
- Manage Escort Clients
- Manage WhatsApp Groups
- Source Bindings & Permissions

**Data Management**

- Import TXT
- Import CSV
- Import Preview
- Import History
- Duplicate / Conflict Review

**Business Operations**

- Employee Management
- Cash Accounts
- Vessel Program Register
- Assignment & Duty
- Release & Settlement
- Reports

এই Navigation বিদ্যমান Frontend-এর সঙ্গে সামঞ্জস্য রেখে বাস্তবায়ন করতে হবে। অপ্রয়োজনীয়ভাবে নতুন আলাদা অ্যাপ বা Database তৈরি করা যাবে না।

## ৮. চূড়ান্ত ব্যবসায়িক নীতি

AL-RIFA’I অ্যাপের মূল উদ্দেশ্য হলো ব্যবসার প্রয়োজন অনুযায়ী WhatsApp Contact, Accountant, Client এবং Group পরিবর্তন করার ক্ষমতা সরাসরি Super Admin-এর হাতে রাখা।

কোনো Accountant পরিবর্তন, নতুন Client যুক্ত করা, WhatsApp Group পরিবর্তন অথবা TXT/CSV ফাইল পুনরায় Import করার জন্য বারবার Source Code পরিবর্তন বা নতুন Deployment প্রয়োজন হবে না।

**তিনটি মূল Data Entry Source:**

1. Frontend Submission
2. TXT/CSV Import
3. Authorized WhatsApp Conversations

এই তিনটি উৎস একই Business Rules, Identity Verification, Duplicate Prevention, Source Traceability এবং Canonical Database Writer অনুসরণ করবে।

**Owner's Core Requirement:**

“আমি ফ্রন্টএন্ড থেকেই Accountant, Client, WhatsApp নম্বর ও Group যুক্ত বা পরিবর্তন করতে চাই। পুরোনো TXT/CSV ফাইল আবার ইমপোর্ট করলে শুধু নতুন তথ্য যুক্ত হবে। Accountant বা Client পরিবর্তন হলেও অ্যাপের কোড পরিবর্তন করতে হবে না। আর প্রতিটি তথ্য সঠিক ব্যবসায়িক বিভাগে যাবে—Accounts-এর তথ্য Accounts-এ, Escort Client-এর তথ্য Vessel Register-এ।”

## Mandatory Owner → Accountant WhatsApp Cash Gate (added 2026-10-17)

This rule is persistent until the Owner explicitly revises it and applies consistently to live intake, parsing, reconciliation, historical backfill, API and all business-record writers:

- `sender` must match the active approved Owner identity binding.
- The actual recipient and actual direct chat JID must resolve to the active approved Accountant identity binding, or an explicitly approved routing rule must independently verify the actual destination. A number in message body alone never verifies recipient. If actual sender/recipient/JID cannot be established by the active approved binding, block. Do not add a separate environment-variable-presence enablement gate.
- Message text must contain cash/payment intent.
- Employee mobile must be reliably extracted.
- Validate amount, available payment details, source identity and timestamp.
- Check source-message idempotency and payment-instruction duplicate/business key.

Any missing, conflicting or uncertain condition means no automatic Cash Transaction; retain a review item. Accountant's own message, ordinary conversation, unauthorized group message, or another chat cannot create an Owner payment instruction. Group names or displayed names are not authority. A payment instruction is not proof that funds were received or paid.

Actual phone numbers, names from contact books and live JID/LID mappings must be verified from the private deployed bridge/contact data and stored only in the private VPS operational record and private `.env`; do not invent or publish them in this public repository. The existing owner-approved frontend URL and application flow are fixed and must not change without explicit Owner approval.
