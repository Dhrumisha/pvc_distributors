# 🚀 Deploying PVC Distributor Admin (VPS + Docker)

This runs the **whole system** (database + backend + admin UI + automatic HTTPS) on **one small Linux server** with a single command. Caddy puts everything on one domain, so logins/cookies "just work".

```
Internet ──HTTPS──> Caddy ──/api,/health,/uploads──> Backend ──> PostgreSQL
                          └────────(everything else)─> Admin UI
```

---

## What you need (provide these)
1. **A Linux server (VPS)** — Ubuntu 22.04+, **2 GB RAM** min (4 GB comfortable), 1–2 vCPU, ~25 GB disk.
   Good cheap options: DigitalOcean / Hetzner / AWS Lightsail / Linode (~$6–12/month). You get an **IP address** and SSH access.
2. **A hostname** — you don't have a domain, so use a **free one from DuckDNS** (steps below). HTTPS needs a real hostname.
3. **Real SMTP** (optional but needed for invite/reset emails) — a Gmail App Password, or SendGrid/Mailtrap.

> Tell me when you have the server IP + SSH access (or a DuckDNS name set up) and I can run these steps for you, or you can follow them as-is.

---

## Step 1 — Get a free hostname (DuckDNS)
1. Go to **https://www.duckdns.org**, sign in (Google/GitHub).
2. Create a subdomain, e.g. `pvcadmin` → you get **`pvcadmin.duckdns.org`**.
3. Put your **server's IP** in the "current ip" box → **update**.
   (Later you can buy a real domain and point it at the same IP instead.)

## Step 2 — Install Docker on the server
SSH in (`ssh root@YOUR_SERVER_IP`) and run:
```bash
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```

## Step 3 — Put the project on the server
Either `git clone` your repo, or copy the folder up from your PC:
```bash
# from your Windows PC (PowerShell), upload the project:
scp -r "D:\Dhrumisha\Inventory" root@YOUR_SERVER_IP:/opt/pvc
```
Then on the server: `cd /opt/pvc/Inventory`

## Step 4 — Create the two config files
From the templates already in the repo:

```bash
cp .env.deploy.example .env
cp pvc-backend/.env.production.example pvc-backend/.env.production
```

**Edit `.env`** (root) — database + your hostname:
```ini
DB_NAME=pvc_admin
DB_USER=pvc_user
DB_PASSWORD=<a strong password>
SITE_ADDRESS=pvcadmin.duckdns.org      # ← your DuckDNS name (gives automatic HTTPS)
```

**Edit `pvc-backend/.env.production`** — set these to your hostname + secrets + SMTP:
```ini
APP_URL=https://pvcadmin.duckdns.org
FRONTEND_URL=https://pvcadmin.duckdns.org
CORS_ORIGINS=https://pvcadmin.duckdns.org
JWT_SECRET=<paste a long random hex>
JWT_REFRESH_SECRET=<paste a DIFFERENT long random hex>
SESSION_SECRET=<paste another long random hex>
SMTP_USER=you@gmail.com
SMTP_PASS=<gmail 16-char app password>
MAIL_FROM_ADDRESS=you@gmail.com
```
Generate secrets with:
`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` (run 3×), or ask me and I'll hand you a set.

## Step 5 — Launch everything
```bash
docker compose up -d --build
```
This builds the images, starts Postgres → backend (runs DB migrations automatically) → UI → Caddy (fetches a free HTTPS certificate for your DuckDNS name). First run takes a few minutes.

Check it:
```bash
docker compose ps          # all "running"/"healthy"
docker compose logs -f backend   # should show "PostgreSQL connected" + "SMTP ready"
```

## Step 6 — Create the first admin login
**Option A — fresh demo data** (creates sample accounts incl. an admin):
```bash
docker compose exec backend npm run seed
# Login: admin@pvcdist.com  /  Pvc@Admin2026   (change the password after first login)
```

**Option B — bring your existing data** from your local `PVCInventory` DB:
```bash
# on your PC: dump local DB (psql tools)
pg_dump -U postgres -h 127.0.0.1 PVCInventory > pvc_dump.sql
scp pvc_dump.sql root@YOUR_SERVER_IP:/opt/pvc/
# on the server: load it into the container's DB
docker compose exec -T db psql -U pvc_user -d pvc_admin < /opt/pvc/pvc_dump.sql
```
(Use Option A **or** B, not both. With B, skip the seed.)

## Step 7 — Open it
Visit **https://pvcadmin.duckdns.org** → log in. 🎉

---

## Who can access it
- The app is **invite-only with login** — anyone can reach the login page, but only people you create accounts for (Admin → Users → Invite) can get in.
- Want it locked down further (only your office network)? I can add an **IP allow-list** or a password gate at the Caddy layer — just say so.

## Day-to-day operations
```bash
docker compose logs -f                 # watch logs
docker compose restart backend         # restart a service
docker compose pull && docker compose up -d --build   # update after code changes
docker compose down                    # stop everything (data is kept in volumes)
```

## Backups (important)
Your data lives in the `pgdata` Docker volume. Back it up regularly:
```bash
docker compose exec -T db pg_dump -U pvc_user pvc_admin > backup_$(date +%F).sql
```
Keep copies off-server. Uploaded files live in the `uploads` volume.

## Moving to a real domain later
1. Buy a domain (Namecheap/Cloudflare, ~₹100–900/yr).
2. Point an **A record** to your server IP.
3. Set `SITE_ADDRESS=yourdomain.com` in `.env` and the same in the three backend URLs.
4. `docker compose up -d` — Caddy auto-issues a new HTTPS cert.

---

## Files that make this work (already in the repo)
| File | Purpose |
|---|---|
| `docker-compose.yml` | Orchestrates db + backend + frontend + Caddy |
| `Caddyfile` | Reverse proxy + automatic HTTPS |
| `pvc-backend/Dockerfile` | Backend image (runs migrations then starts) |
| `pvc-admin/Dockerfile` | Next.js image (standalone build) |
| `.env.deploy.example` | Root config template (DB + hostname) |
| `pvc-backend/.env.production.example` | Backend config template (URLs, secrets, SMTP) |

## Production hardening already done
- Daily alerts cron wrapped so it can't crash the API; Docker `restart: unless-stopped` auto-recovers anyway.
- Redis disabled by default (optional; permission cache falls back to DB).
- Single-origin via Caddy → auth cookies work correctly under HTTPS.
- Next.js standalone output → small, fast UI image.
