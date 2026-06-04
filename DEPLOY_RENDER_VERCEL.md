# 🚀 Deploy on Render (backend + DB) + Vercel (admin UI)

The Next.js UI goes on **Vercel**, the Express API + PostgreSQL on **Render**. They're on different domains, so the refresh cookie is already set to `SameSite=None; Secure` (handled in code).

```
Browser ──> Vercel (Next.js UI) ──/api/v1──> Render (Express API) ──> Render PostgreSQL
```

> Free tiers work to start. Note: Render's free web service **sleeps after ~15 min idle** (first request then takes ~30–60s), and free Postgres expires after 90 days — upgrade to a paid instance ($7/mo each) for always-on / permanent.

---

## Prerequisites
- A **GitHub account** with this project pushed to a repo (see Step 0).
- A **Render** account (render.com) and a **Vercel** account (vercel.com) — sign in with GitHub.
- **SMTP** creds for real email (Gmail App Password), optional to start.

---

## Step 0 — Push the code to GitHub
The repo isn't on GitHub yet. From `D:\Dhrumisha\Inventory`:
```bash
git init
git add .
git commit -m "PVC Admin — initial"
git branch -M main
# create an empty repo on github.com first, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
(`.gitignore` already excludes `node_modules` and all `.env` secrets.)

---

## Step 1 — Render: database + backend (via Blueprint)
1. Render → **New + → Blueprint** → connect your GitHub repo. It reads **`render.yaml`** and creates:
   - **pvc-db** (PostgreSQL) and **pvc-backend** (web service), with DB vars + JWT secrets auto-wired.
2. Click **Apply**. Wait for the first deploy (migrations run automatically on boot).
3. Note your backend URL, e.g. **`https://pvc-backend-xxxx.onrender.com`**.
4. In **pvc-backend → Environment**, set the values marked "sync:false":
   - `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM_ADDRESS` → your Gmail + App Password
   - (leave `FRONTEND_URL`, `CORS_ORIGINS`, `APP_URL` for Step 3)
5. Health check: open `https://pvc-backend-xxxx.onrender.com/health` → should return `{"status":"ok",...}`.

## Step 2 — Vercel: the admin UI
1. Vercel → **Add New → Project** → import the same GitHub repo.
2. **Root Directory:** set to **`pvc-admin`** (important).
3. Framework: Next.js (auto-detected). Build/output: defaults.
4. **Environment Variables** → add:
   - `NEXT_PUBLIC_API_URL = https://pvc-backend-xxxx.onrender.com/api/v1`
5. **Deploy.** Note your UI URL, e.g. **`https://pvc-admin-xxxx.vercel.app`**.

## Step 3 — Connect the two (CORS + cookie origin)
Back in **Render → pvc-backend → Environment**, set these to your Vercel URL and save (it redeploys):
```
FRONTEND_URL = https://pvc-admin-xxxx.vercel.app
CORS_ORIGINS = https://pvc-admin-xxxx.vercel.app
APP_URL      = https://pvc-admin-xxxx.vercel.app
```
> If you use Vercel preview URLs too, add them comma-separated to `CORS_ORIGINS`.

## Step 4 — Create the first admin login
In **Render → pvc-backend → Shell**:
```bash
npm run seed     # creates demo accounts incl. admin@pvcdist.com / Pvc@Admin2026
```
**Or** import your existing data instead of seeding:
```bash
# locally: pg_dump -U postgres -h 127.0.0.1 PVCInventory > pvc_dump.sql
# Render → pvc-db → "Connect" gives an external psql command; then:
psql "<external connection string>" < pvc_dump.sql
```

## Step 5 — Log in 🎉
Open your Vercel URL → log in. Done.

---

## Troubleshooting
| Symptom | Fix |
|---|---|
| Login works but logs you out after ~15 min | `CORS_ORIGINS`/`FRONTEND_URL` must exactly match the Vercel URL (https, no trailing slash). Cookie is already `SameSite=None;Secure`. |
| CORS error in browser console | Add the exact Vercel origin to `CORS_ORIGINS` on Render, redeploy. |
| UI loads but API calls fail | `NEXT_PUBLIC_API_URL` on Vercel must be the Render URL **+ `/api/v1`**; redeploy Vercel after changing it. |
| First request very slow | Free Render service was asleep — upgrade to paid for always-on. |
| Emails not sending | Set `SMTP_USER`/`SMTP_PASS` (Gmail App Password) on Render. |

## What I need from you to do this for you
I can prepare everything (done), but connecting Render/Vercel uses **your** GitHub/Render/Vercel logins (OAuth), which I can't click through. Either:
- **You** do Steps 0–5 (copy-paste; I'll help with any error), **or**
- Give me a **GitHub repo URL + push access**, a **Render API key**, and a **Vercel token** and I'll drive the CLIs.
