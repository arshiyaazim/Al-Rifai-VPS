# VPS installation ও upgrade

এই ZIP source delivery; বাস্তব VPS login/deploy/QR এই কাজের অংশ হিসেবে চালানো হয়নি। বিদ্যমান Sites URL/domain/reverse proxy অক্ষুণ্ণ।

## ১. বিদ্যমান foundation যাচাই

Owner-এর VPS convention: root account; `/opt/vps` মূল ভিত্তি, `/opt/vps/infra/compose.yaml` central PostgreSQL service, private credentials `/etc/vps/infra`, data `/var/lib/vps/postgres`, map `/opt/vps/docs/VPS_MAP.md`। এগুলো প্রত্যাশিত owner layout—বর্তমান server-এ আছে/চলছে এমন verification নয়। আগে বাস্তব paths, network, versions, ports ও backup যাচাই করুন।

এই app রাখার প্রস্তাবিত path `/opt/vps/apps/al-rifai`। `compose.yaml` **কেবল app**; নতুন PostgreSQL service/container বানায় না। বিদ্যমান database-এ `alrifai` schema ব্যবহার করে। Dedicated app role দিন, অন্য app-এর schema লিখতে দেবেন না। Database CONNECT/CREATE এবং নিজের schema/table/sequence অধিকার প্রয়োজন; public PostgreSQL port খুলতে হয় না।

এটি canonical `fpe_*`/`wbom_*`, পুরোনো D1/SQLite বা Fazle Core automatic migration নয়। পুরোনো data নিলে আলাদা mapped import ও totals reconciliation করুন। Core process চালানো register ব্যবহারের শর্ত নয়।

## ২. Private configuration

ZIP-এর project contents নির্ধারিত app directory-তে রাখুন। Project root থেকে:

```bash
cp .env.example .env
chmod 600 .env
```

Private editor দিয়ে values দিন:

| Variable | মান |
| --- | --- |
| DATABASE_URL | existing PostgreSQL-এর exact host/database/app role/password; special password URL-encode |
| VPS_NETWORK | existing database container-এর actual Docker network |
| APP_ORIGIN | exact HTTPS origin, যেমন https://al-rifai.iamazim.com |
| APP_ADMIN_EMAIL | bootstrap owner login email |
| APP_ADMIN_PASSWORD | নিজের ১২–২০০ অক্ষরের password; কোনো default নেই |
| COOKIE_SECURE | HTTPS-এ true |
| APP_PORT | ফাঁকা loopback host port, default 3000 |

`localhost` app container-এর নিজস্ব host; তা PostgreSQL container/host নয়। কোনো secret public chat/repo-তে paste করবেন না।

## ৩. Docker অথবা native Node

বিদ্যমান network/database reachable হলে:

```bash
docker compose config --quiet
docker compose build
docker compose up -d
curl -f http://127.0.0.1:3000/healthz
```

Container unprivileged `node` user-এ চলে। Root host convention মানে app-এর DB superuser দরকার নয়। Docker runtime এখানে চালিয়ে যাচাই হয়নি।

Native alternative: Node ≥22.13, Python ≥3.10, PostgreSQL client tools। `.env`-এ `APP_HOST=127.0.0.1` এবং `PYTHON_BIN=/opt/vps/apps/al-rifai/.venv/bin/python` দিন।

```bash
npm ci
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
npm run build
npm run db:migrate
npm start
```

`.env` ও `integrations/mcp.env` Git/package থেকে excluded। systemd examples-এ owner-এর root + `/opt/vps/apps/al-rifai` convention আছে; exact Node binary, WorkingDirectory ও env paths verify করে ব্যবহার করুন। Package service install/restart করে না।

## ৪. Schema/upgrade ও first login

Startup SHA-checked migrations `001` ও `002` চালায়; repeat safe। Fresh DB-তে ২০ table/২ view, শূন্য business row; প্রথম user Super Admin। v1 schema থাকলে `002` existing records/password বজায় রেখে earliest owner Admin-কে Super Admin করে। Production আগে backup ও rehearsal করুন। Applied migration edit নয়; পরের change নতুন migration-এ।

প্রথম login-এর পর bootstrap APP_ADMIN_PASSWORD environment থেকে সরানো যায়; password hash DB-তে থাকে। Env বদলালে existing password reset হয় না।

প্রথম intake/import-এর আগে WhatsApp account → party/contact → source → binding configure করুন। UI-তে authority বদলানোর অধিকার Super Admin-এর; Admin business CRUD/import/review করতে পারে, Viewer শুধু read/export/assistant। অতিরিক্ত user প্রয়োজন হলে private `.env.new-user`-এ NEW_USER_EMAIL, NEW_USER_PASSWORD, NEW_USER_ROLE=viewer|admin|super_admin লিখুন:

```bash
chmod 600 .env.new-user
node --env-file=.env --env-file=.env.new-user scripts/create-user.mjs
```

কাজ শেষে temporary credentials file সরান। Self-registration নেই।

## ৫. HTTPS ও live updates

`deployment/nginx.conf.example` existing routes/certificate paths-এর সঙ্গে মিলিয়ে ব্যবহার করুন; অন্য route overwrite নয়। Cloudflare proxy হলে valid origin TLS এবং Full (strict) প্রয়োজন। Same-origin frontend/API; no-login API 401, forged Sites identity headers ignored।

`/api/events` buffering off, timeout ≥১৮০ seconds; heartbeat ২০ seconds। SSE reconnect ও ৬০-second fallback refresh আছে। এক app instance চালান; scale-out-এর জন্য shared event transport লাগবে। `healthz` শুধু process liveness, bridge/DB end-to-end readiness নয়।

## ৬. Backup/restore

Records, users, config versions, source bytes, messages, imports ও reviews PostgreSQL-এ। App recreate করলে DB থাকে। Native PostgreSQL client দিয়ে private backup:

```bash
node --env-file=.env scripts/backup.mjs /PRIVATE/PATH/alrifai-backup.dump
```

বিদ্যমান central PostgreSQL backup policy-তেও schema অন্তর্ভুক্ত করতে পারেন। Restore কেবল আলাদা **খালি target database**-এ private `.env.restore` ব্যবহার করে:

```bash
node --env-file=.env.restore scripts/restore.mjs /PRIVATE/PATH/alrifai-backup.dump
```

Real restore rehearsal এখানে করা হয়নি। Bridge session/cache project-এর বাইরে private রাখুন।

## ৭. Live acceptance

1. No-login/forged headers denied; correct login; Viewer mutation denied; ordinary Admin routing edit denied।
2. Form Cancel কোনো row নয়; Save/Edit/restore persist; দুই signed-in browser-এ SSE update।
3. Configure authorized direct Accountants; wrong sender/receiver/group default review; explicit group sender policy পরীক্ষা।
4. Client order → Draft, multiple representative replay → one program; confirm/assignment/release আলাদা।
5. TXT export A তারপর A+new; preview totals, only new posts। Edited old amount → review → same record correction। CSV stable IDs দিয়ে একই পরীক্ষা।
6. Consumer privately pair করে --once; actual new message → storage → correct table → reports/assistant। Restart/replay এক row; gap হলে checkpoint advance নয়।
7. UI phone replacement ও future date switch, old ledger unchanged; নতুন binding old messages auto-authorize নয়।
8. Desktop/mobile keyboard, dialogs, print/PDF, backup ও real PostgreSQL privileges পরীক্ষা।

Local tests PASS-কে এই live checklist-এর বদলে ব্যবহার করবেন না।
