# DEPLOYMENT.md — TakeUForward

> **How to use this file:** This is the single source of truth for deploying,
> redeploying, and debugging this project in production. Sections marked **[VERIFY]**
> should be confirmed against the live codebase before you rely on them — this
> document was compiled from project history (CHANGELOG, AGENTS.md, MASTER_PLAN, and
> real incidents), not from a fresh code read, so treat those markers as "check this
> is still true" rather than "this is guaranteed accurate."
>
> Keep this file updated whenever a new deployment incident happens — add it to
> Section 7 immediately, while the fix is fresh, not after the next incident.

---

## 1. Architecture Overview

```
                         ┌─────────────────────────────┐
                         │   Vercel (Frontend + Proxy)  │
                         │   /client — React+Vite       │
                         │   takeuforward-ssn.vercel.app│
                         │                              │
                         │   /api/* → reverse proxy     │
                         │   to Render backend          │
                         └──────┬──────────┬────────────┘
                    static SPA  │          │  proxied /api/* requests
                    assets      │          │  (same-origin cookie)
                                │          │
                         ┌──────▼──────────▼────────────┐
                         │   Render (Backend)            │
                         │   /server — Node/Express      │
                         │   Passport.js OAuth            │
                         │   express-session +            │
                         │   connect-mongo store          │
                         └──┬──────────┬──────────┬──────┘
                            │          │          │
              ┌─────────────▼──┐  ┌────▼────┐  ┌──▼────────────┐
              │ MongoDB Atlas   │  │ AWS S3  │  │ Gemini API    │
              │ users, posts,   │  │(or      │  │ (resource     │
              │ resources,      │  │Supabase │  │ summarization,│
              │ chats, clubs,   │  │fallback)│  │ chatbot)      │
              │ notifications,  │  └─────────┘  └───────────────┘
              │ referralRequests│
              └─────────────────┘
                            │
                  ┌─────────▼──────────┐
                  │ SMTP (Nodemailer)   │
                  │ transactional email │
                  └──────────────────────┘

Key: All /api/* requests from the browser go to Vercel first, which proxies
them to Render. This makes the session cookie FIRST-PARTY (same origin as
the frontend), fixing third-party cookie blocking on Safari/mobile/Chrome.

UptimeRobot pings GET /api/health every 5–10 min to prevent Render free-tier
cold starts (per MASTER_PLAN §7.9). This should ping the RENDER URL directly
(not through the Vercel proxy) to keep Render warm.
```

**Repo → Service mapping:**
| Folder | Deploys to | Notes |
|---|---|---|
| `/client` | Vercel | Vite build output served as static SPA |
| `/server` | Render | Node/Express, `npm start` runs `node index.js` |
| root | — | Only used for local `npm run dev` (concurrently) — not used in production deploy path |

---

## 2. Prerequisites

| Service | Purpose | Tier | Known gotcha |
|---|---|---|---|
| MongoDB Atlas | Primary database | Free (M0) | Requires IP whitelist config; free tier has storage caps — see §8 |
| Render | Backend hosting | Free | Cold-starts after ~15 min idle; needs UptimeRobot keep-alive |
| Vercel | Frontend hosting | Free (Hobby) | Generates unique preview URLs per deploy — see §7 CORS incident |
| Google Cloud Console | OAuth 2.0 credentials | Free | Redirect URIs must be added manually per environment |
| AWS S3 (or Supabase Storage fallback) | Resource file storage | Free tier (12 months, card required) | Bucket CORS policy must separately allow the frontend origin |
| Gemini API | AI summarization | Free tier w/ quota | Confirm graceful fallback still holds if quota is hit — see §8 |
| SMTP provider (Gmail SMTP / Resend / SendGrid) | Transactional email | Free/low volume | Gmail SMTP is dev-grade only; consider a real provider before scaling |
| UptimeRobot (or cron-job.org) | Keep-alive pings | Free | Works against Render's cost-saving intent by design — expected trade-off |

---

## 3. Environment Variables — Full Reference

**[VERIFIED]** Cross-checked this table against `server/.env.example` and every
`process.env.X` usage in the codebase — this list reflects what's been referenced
across the project so far.

### Backend (Render)

| Variable | Required | Example format | Breaks if missing/wrong |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | Server fails to boot — "Could not connect to any servers in your MongoDB Atlas cluster" |
| `MONGODB_DB_NAME` | Yes | `takeuforward` | App collections may be created in the default `test` database if omitted/misconfigured in production |
| `SESSION_SECRET` | Yes | long random string | Sessions can be forged/decoded if weak; missing may crash session middleware |
| `GOOGLE_CLIENT_ID` | Yes | from Google Cloud Console | OAuth login fails entirely |
| `GOOGLE_CLIENT_SECRET` | Yes | from Google Cloud Console | OAuth callback fails |
| `CLIENT_URL` | Yes | `https://takeuforward-ssn.vercel.app` (**no trailing slash** — see §7) | CORS rejects all frontend requests |
| `NODE_ENV` | Yes | `production` | Controls cookie `secure`/`sameSite` flags, error stack-trace leakage, CORS localhost fallback |
| `LOG_LEVEL` | No | `info` | Determines structured Pino logging output verbosity (`debug`, `info`, `warn`, `error`) |
| `ALLOW_TEST_SESSION` | No, dev/test only | `false` / unset in production | If set to `true` outside production it enables the Playwright-only session seeding route; never set this in Render production |
| `AWS_ACCESS_KEY_ID` | Yes (or Supabase equivalent) | AWS IAM key | Resource upload presigned URL generation fails |
| `AWS_SECRET_ACCESS_KEY` | Yes (or Supabase equivalent) | AWS IAM secret | Same as above |
| `AWS_BUCKET_NAME` | Yes | bucket name | Uploads fail / 404 on file access |
| `AWS_REGION` | Yes | e.g. `ap-south-1` | Presigned URL generation fails or points to wrong region |
| `GEMINI_API_KEY` | Yes | from Google AI Studio | Resource summarization silently falls back (should degrade gracefully — see §8) |
| `SENDGRID_API_KEY` | Yes | from SendGrid dashboard (Settings → API Keys) | All transactional email (welcome, notifications, digest) uses SendGrid. No email sent if missing. |
| `SENDGRID_FROM_EMAIL` | Yes | `notifications@yourdomain.com` | A verified single sender or verified domain in SendGrid. Must match what was verified in SendGrid dashboard. |
| `CRON_SECRET` | Yes (for Weekly Digest) | long random string | Weekly Digest endpoint `/api/jobs/weekly-digest` will reject external triggers |
| `VAPID_PUBLIC_KEY` | Yes (for Web Push) | Web Push public key | Generated via `npx web-push generate-vapid-keys` |
| `VAPID_PRIVATE_KEY`| Yes (for Web Push) | Web Push private key | Generated via `npx web-push generate-vapid-keys` |
| `VAPID_SUBJECT` | Yes (for Web Push) | `mailto:admin@domain.com` | Required by the web-push protocol |
| `PORT` | Usually auto-set by Render | `5000`/auto | Render auto-injects this — do not hardcode a port in code |

### Frontend (Vercel)

| Variable | Required | Example | Notes |
|----------|----------|---------|-------|
| `VITE_API_URL` | **No** (production) | Not set on Vercel — API calls use `/api` (relative, same-origin via reverse proxy) | Only set in local dev `.env` as `http://localhost:5000/api` |
| `VITE_VAPID_PUBLIC_KEY`| Yes (for Web Push)| Same as Backend `VAPID_PUBLIC_KEY` | Used by the frontend to subscribe to Web Push |

**IMPORTANT (changed from previous):** `VITE_API_URL` (previously documented as
`VITE_API_BASE_URL`) is **no longer needed on Vercel** in production. The `vercel.json`
rewrite rule proxies `/api/*` to the Render backend, making all API calls same-origin.
The `axiosClient.js` defaults to `/api` when `VITE_API_URL` is not set. If you had
`VITE_API_BASE_URL` or `VITE_API_URL` set on Vercel previously, **remove it** to
activate the proxy path.

**Security note:** anything prefixed `VITE_` is bundled into the client and publicly
visible in the browser. Never put a secret (API key, SMTP password, S3 secret) behind
a `VITE_` prefix.

---

## 4. First-Time Deployment — Step by Step

1. **MongoDB Atlas**
   - Create a free (M0) cluster.
   - Database Access → create a DB user with a real password (not the `<password>`
     placeholder Atlas shows in the connection string).
   - Network Access → Add IP Address → `0.0.0.0/0` (Render free tier has no static
     IP, so this is the standard approach — the DB user credentials remain the real
     access gate).
   - Copy the full connection string into `MONGODB_URI`.
   - Set `MONGODB_DB_NAME=takeuforward` in Render. Atlas will still show internal
     `admin` and `local` databases; the app data should live under the `takeuforward`
     database, not the default `test` database.

2. **Google Cloud Console (OAuth)**
   - Create OAuth 2.0 credentials (Web application type).
   - Add Authorized redirect URIs for **both**:
     - `http://localhost:5000/api/auth/google/callback` (local dev)
     - `https://<your-vercel-app>.vercel.app/api/auth/google/callback` (production — goes through Vercel proxy)
   - **IMPORTANT:** The production callback URI must use the **Vercel** URL (not the
     Render URL), because the OAuth callback must go through the reverse proxy so the
     session cookie is set as first-party on the Vercel domain.
   - Copy Client ID/Secret into Render env vars.

3. **Render (Backend)**
   - New Web Service → connect this repo → root directory `/server`.
   - Build command: `npm install`. Start command: `npm start` (Confirmed `package.json` has a real `start` script running `node index.js`, Render will not run nodemon in production).
   - Add every env var from Section 3 (Backend table).
   - **Critical:** Do not set `ALLOW_TEST_SESSION` in production. Google OAuth uses
     the relative callback path `/api/auth/google/callback`; the externally
     registered callback URL still must be the Vercel-proxied URL from step 2.
   - Deploy, then check logs for successful boot (no MemoryStore warning, no Atlas
     connection error — see §7 if either appears).

4. **Vercel (Frontend)**
   - New Project → connect this repo → root directory `/client`.
   - **Confirmed** Build command and output directory match Vite defaults
     (`npm run build`, output `dist`) — confirm in Vercel project settings, don't
     assume Vercel auto-detected correctly.
   - **Replace the placeholder** in `vercel.json`: change
     `REPLACE_WITH_YOUR_RENDER_BACKEND_URL.onrender.com` to your actual Render
     backend hostname (e.g. `takeuforward-api.onrender.com`).
   - **Do NOT set `VITE_API_URL`** on Vercel — the reverse proxy handles API routing.
   - Only set `VITE_VAPID_PUBLIC_KEY` if Web Push is configured.
   - Confirm `vercel.json` exists in `/client` with both the API proxy rewrite and
     the SPA catch-all rewrite — without the API rewrite, auth will fail; without
     the SPA rewrite, direct navigation 404s.
   - Deploy, then copy the production URL back into Render's `CLIENT_URL`.

5. **CORS loop-back step**
   - After both are deployed, update `CLIENT_URL` on Render to the real Vercel
     production URL (no trailing slash), and redeploy Render.

6. **AWS S3 (or Supabase Storage fallback)**
   - Create bucket, generate IAM credentials scoped to that bucket.
   - Set bucket CORS policy to allow the Vercel production origin (and preview
     pattern if uploads need to work from preview deploys).

7. **SMTP**
   - Set up Gmail SMTP (dev-grade) or a transactional provider, add credentials to
     Render.

8. **UptimeRobot**
   - Add an HTTP monitor pinging `https://<render-backend>.onrender.com/api/health`
     every 5–10 minutes.

9. **Seed production data**
   - Run `npm run seed:communities` and `npm run seed:clubs` **against the
     production `MONGODB_URI`**, not local Mongo — seeding locally does not seed
     Atlas. This was a real incident (see §7).
   - Run `npm run seed:admin` against production as well. This creates/repairs the
     fixed system admin identity for `takeuforwardssn@gmail.com` with handle
     `@admin`; first real Google login will bind the real Google profile id.

10. **Weekly Digest Scheduling**
    - Set up a job on cron-job.org or GitHub Actions to send a `POST` request to `https://<render-backend>.onrender.com/api/jobs/weekly-digest` every Monday at 9:00 AM.
    - Include header: `x-cron-secret: <your-cron-secret>`. This wakes up Render and guarantees execution.

---

## 5. Redeployment / Update Flow

**Automatic on push to `main`:**
- Render redeploys the backend automatically (ensure auto-deploy branch is
  set to `main`).
- Vercel redeploys the frontend automatically on every push, and generates a unique
  **Preview URL** for every non-production branch/PR.

**Manual steps required after certain changes (NOT automatic):**
| Change | Manual action required |
|---|---|
| New/changed seed data | Re-run the relevant `npm run seed:*` script against production `MONGODB_URI` |
| Schema migration script added (e.g. `migrate-profiles.js`) | Run it manually once against production Atlas: `MONGODB_URI="<prod-uri>" node server/scripts/migrate-profiles.js` |
| New env var added to code | Add it in Render/Vercel dashboard — code changes alone do not create the var in production |
| System admin needs repair/reseed | Run `npm run seed:admin` against production; do not create arbitrary platform admins |
| Google OAuth redirect URI changes | Update Google Cloud Console manually — not part of any deploy |

### 5.1 Changing the Frontend URL / Custom Domain

If you change the Vercel URL or add a custom domain (e.g. `www.takeuforward.com`), you **must** manually update the following external services. The code alone cannot fix this:

1. **Google Cloud Console (OAuth 2.0):**
   - Go to APIs & Services > Credentials > OAuth 2.0 Client ID.
   - **Authorized JavaScript origins**: Add the new frontend URL.
   - **Authorized redirect URIs**: (If backend URL also changed, update it here).
2. **AWS S3 / Supabase (CORS):**
   - Go to your S3 Bucket > Permissions > CORS configuration.
   - Add the new frontend URL to the `AllowedOrigins` array so the browser isn't blocked during direct file uploads.
3. **Render Dashboard:**
   - Go to the Render Web Service > Environment.
   - Update `CLIENT_URL` to the new frontend URL (no trailing slash). Restart the Render server.

---

## 6. CI/CD — Current State and Recommended Next Step

**Current reality:** there is no CI pipeline gating
deploys. Pushing to `main` triggers Render and Vercel to build and deploy directly —
lint and test failures do **not** currently block a bad deploy from going live.
`npm run lint` and `npm test` are run manually per the AGENTS.md pre-push checklist,
but nothing enforces this before a merge.

**Recommended future CI/CD (not yet implemented — a suggestion for later):**
A minimal GitHub Actions workflow on pull requests to `main`:
```yaml
# .github/workflows/ci.yml (NOT YET CREATED — reference only)
on: pull_request
jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install --prefix server && npm install --prefix client
      - run: npm run lint --prefix server
      - run: npm run lint --prefix client
      - run: npm test --prefix server
```
This would catch lint/test failures before merge, without touching how Render/Vercel
deploy. Do not implement this without a dedicated task — this file only documents
the recommendation.

---

## 7. Known Issues & Root-Caused Bugs

### 7.1 MongoDB Atlas IP whitelist connection failure
- **Symptom:** `Error: Could not connect to any servers in your MongoDB Atlas
  cluster. One common reason is that you're trying to access the database from an
  IP that isn't whitelisted.`
- **Root cause:** Render's outbound IP wasn't added to Atlas Network Access.
- **Fix:** Atlas → Network Access → Add `0.0.0.0/0` (Render free tier has no static
  IP). Also confirm `MONGODB_URI` has real credentials, not the `<password>`
  placeholder.
- **Prevention:** Always check Atlas Network Access immediately after creating any
  new backend hosting service.

### 7.2 express-session MemoryStore warning in production
- **Symptom:** `Warning: connect.session() MemoryStore is not designed for a
  production environment, as it will leak memory, and will not scale past a single
  process.`
- **Root cause:** Default in-memory session store was never replaced for
  production — sessions are lost on every Render restart, and it's not
  production-safe.
- **Fix:** Installed `connect-mongo` and wired it as the session `store`, reusing
  the existing `MONGODB_URI`.
- **Prevention:** Confirmed this fix is actually deployed. Re-check
  Render logs after next deploy for this exact warning; if it reappears, the fix
  didn't persist.

### 7.3 CORS trailing-slash origin mismatch
- **Symptom:** Browser console: `Access-Control-Allow-Origin' header has a value
  'https://takeuforward-ssn.vercel.app/' that is not equal to the supplied origin.`
- **Root cause:** `CLIENT_URL` env var had a trailing slash; browsers do an exact
  string match on CORS origin, so `.../ ` ≠ `...` (no slash).
- **Fix:** Strip trailing slash defensively in code wherever `CLIENT_URL` is used
  (`clientUrl.replace(/\/$/, '')`), and corrected the value in Render dashboard.
- **Prevention:** Never paste a URL with a trailing slash into any URL-based env
  var; the defensive code strip should catch it either way now.

### 7.4 Vercel SPA routing 404 on direct navigation
- **Symptom:** Visiting `https://takeuforward-ssn.vercel.app/login` directly (not
  navigating from within the app) returns Vercel's `404: NOT_FOUND`.
- **Root cause:** React Router routes only exist client-side; Vercel looks for a
  physical file at that path by default and finds none.
- **Fix:** Added `vercel.json` in `/client` with a rewrite rule serving
  `index.html` for all unmatched paths.
- **Prevention:** After any deploy, hard-refresh 2-3 deep routes (not just `/`) to
  confirm this hasn't regressed — see the standing checklist in §13.

### 7.5 CORS rejecting Vercel preview deployment URLs
- **Symptom:** `Network Error` when accessing the app via a Vercel preview URL
  (e.g. `https://takeuforward-kv5z50qb4-tushyents-projects.vercel.app`).
- **Root cause:** CORS allowlist only contained the single production `CLIENT_URL`;
  Vercel generates a unique preview URL per branch/deploy that was never whitelisted.
- **Fix:** Changed CORS config to accept a pattern/list of allowed origins —
  production domain plus a suffix/regex match for this project's Vercel preview URL
  pattern (`*-tushyents-projects.vercel.app`), rather than a single hardcoded string.
- **Prevention:** Confirmed login/session actually works on preview URLs
  too, since we allowed dynamic Regex CORS matching and `sameSite: none` cookies.

### 7.6 ESM and CommonJS interop crash in production
- **Symptom:** `npm start` crashes with `ERR_MODULE_NOT_FOUND` or `SyntaxError: The requested module ... does not provide an export named 'default'`.
- **Root cause:** A new backend file used `require` or `module.exports`, but the backend relies on ES Modules (`"type": "module"` in `package.json`).
- **Fix:** Refactored the offending files to use `import` and `export default`.
- **Prevention:** Always run `$env:NODE_ENV="production"; npm start` locally before deploying when new backend files are added, and stick strictly to ESM syntax.

### 7.7 Missing authMiddleware import crash
- **Symptom:** API route crashes when hit because `ensureAuthenticated` is not found or fails to resolve.
- **Root cause:** There is no global `ensureAuthenticated` middleware exported from `server/middleware/authMiddleware.js`. Routes check `req.isAuthenticated()` manually.
- **Fix:** Removed the invalid import and inlined `if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });`.
- **Prevention:** Match existing route files (like `postRoutes.js`) instead of assuming common Express patterns exist in the repo.

### 7.8 S3 Presigned URL PUT Size Limits
- **Incident:** The S3 integration currently uses a standard `PUT` operation (`PutObjectCommand`) for generating presigned URLs. This means there is no native AWS policy-based mechanism to reject a file upload that exceeds a certain size directly at the bucket edge before the upload starts.
- **Impact:** A malicious actor could theoretically upload a massive file to the S3 bucket using a valid presigned URL.
- **Mitigation:** We've implemented a defensive `HeadObject` check on the backend `POST /api/resources` endpoint (which creates the metadata *after* upload). If the uploaded object is >10MB, the backend deletes it from S3 and rejects the request.
- **Prevention (Future Fix):** Migrate to `createPresignedPost` and update the frontend `axios.put` to a `FormData` POST submission to enforce strict size boundaries natively at the S3 bucket level.

### 7.9 Welcome email silently skipped when SMTP unconfigured
- **Symptom:** New users register via Google OAuth but never receive a welcome email ("Welcome to TakeUForward — You're member #X!"). No error returned to the user — the email is simply not sent.
- **Root cause (original):** `sendEmail()` in `server/config/mailer.js` checked `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` — if any was missing/falsy, it logged a `warn` and returned without sending. Additionally, Render blocks outbound TCP connections to `smtp.gmail.com` entirely (`ENETUNREACH`/`ETIMEDOUT`), making SMTP unusable in the Render environment regardless of correct credentials.
- **Fix:** Switched from nodemailer/SMTP to Resend API (`server/config/mailer.js`). Removed `SMTP_HOST/USER/PASS` vars — now requires only `RESEND_API_KEY` in environment.
- **Prevention:** Server now calls `verifyTransporter()` at startup and logs either `Resend configured and verified — email sending is active.` or `Resend verification FAILED: <error>` depending on whether the API key is valid.

### 7.10 Resend sandbox domain — only sends to verified emails
- **Symptom:** `verifyTransporter()` passes at startup and `POST /api/admin/test-email` returns success for the admin's email, but notification emails (mentions, replies, comments) to other users never arrive.
- **Root cause:** Resend's default `onboarding@resend.dev` sandbox sender can only deliver to the email address that created the Resend account. Sending to any other address succeeds (no API error) but the email is silently dropped.
- **Fix (original):** Verify a domain in Resend dashboard (Settings → Domains → Add Domain), update DNS TXT records, then set `EMAIL_FROM="TakeUForward SSN" <notifications@yourdomain.com>` and `RESEND_API_KEY=re_...` in Render env vars.
- **Fix (2026-07-12):** Migrated from Resend to Twilio SendGrid. SendGrid uses HTTP API (no SMTP ports blocked on Render) and requires sender verification. See §7 entry 5.

### 7.11 SendGrid migration — Resend replaced
- **Symptom:** N/A — proactive migration after discovering Resend sandbox limitations. Resend's `onboarding@resend.dev` sender could only deliver to the account owner's email, making notification emails (mention/reply/digest) to other users silently fail.
- **Root cause:** Resend API worked correctly for `verifyTransporter()` (sends to `test@resend.dev`) but delivery to real users was silently dropped due to sandbox restrictions. Render also blocks outbound SMTP, so nodemailer/SMTP was not a fallback option.
- **Fix:** Replaced Resend with Twilio SendGrid (`@sendgrid/mail`). Created `server/services/SendGridService.js` with identical interface: send(), sendWithRetry(), verify(). Rewrote `server/config/mailer.js` to use SendGridService. Removed `resend` package, `EmailService.js`, and all Resend env vars. New env vars: `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`. Added 15s AbortController timeout, detailed error extraction for SendGrid-specific errors, and proper error classification (CONFIG_ERROR, SENDGRID_ERROR, VALIDATION_ERROR).
- **Requirement:** SendGrid requires a verified single sender or verified domain before sending. You must set up sender verification in SendGrid dashboard (Settings → Sender Authentication → Verify Single Sender) using a real email address, then set `SENDGRID_FROM_EMAIL` to that address.

## 7. Known Issues & Operational Runbook

1. **Vite Dev Server Port Jumping (CORS):** If `npm run dev` in `/client` detects port 5173 is in use, it will silently jump to 5174, 5175, etc. The backend CORS policy has been updated with a regex (`^http:\/\/(localhost|127\.0\.0\.1):517\d$`) to permit this natively, eliminating the "CORS error on login" issue for local development.

2. **Database Outage & Health Check Tradeoff:** The `/health` endpoint strictly verifies MongoDB connectivity.
   - *Previously:* It returned `200 OK` even if MongoDB was disconnected, leading to silent outages where UptimeRobot thought the site was healthy.
   - *Now:* It returns `503 Service Unavailable` if MongoDB disconnects.
   - *Tradeoff:* Render's health checks do *not* currently auto-restart the Node process on runtime failure, but they *will* fail a new deployment if the DB is down during the deploy step. Uptime monitors will now correctly alert you to DB blips.

3. **Vercel Reverse Proxy & Session Loss:** Apple's ITP (Intelligent Tracking Prevention) and Chrome's third-party cookie phase-out aggressively block the `connect.sid` cookie if the frontend (Vercel) and backend (Render) do not share a domain. This was fixed by using a `vercel.json` rewrite (`/api/* -> Render`), making the cookie first-party. Do *not* revert the frontend to fetch directly from Render.

### 7.9 Render /health 404 Monitoring Failures
- **Symptom:** UptimeRobot or Render health checks hitting `https://takeuforward-ssn.onrender.com/health` return a 404 Not Found error.
- **Root cause:** The health route was previously mounted strictly under `/api/health`, so external pingers strictly checking the root `/health` failed.
- **Fix:** Duplicated the route mount in `server/index.js`: `app.use('/health', healthRoutes)`.
- **Prevention:** Ensure health endpoints are exposed unauthenticated at standard root paths expected by PaaS providers.

### 7.10 Vite Dev Server Port-Jumping CORS Rejection
- **Symptom:** `Network Error` in the browser when starting `npm run dev` if port 5173 is already in use by a zombie process.
- **Root cause:** Vite automatically binds to the next available port (e.g., `5174`), but `server/index.js` CORS was strictly hardcoded to allow `http://localhost:5173`.
- **Fix:** Changed the localhost CORS allow-list to use a dynamic regex `^http:\/\/(localhost|127\.0\.0\.1):517\d$` to safely allow Vite dev server port jumping.
- **Prevention:** Use bounded regexes for localhost port allowances during development instead of hardcoding a single strict port.

### 7.11 OAuth Cross-Origin Sign-In Loop (VITE_API_URL set to Render)
- **Symptom:** User clicks "Sign in with Google", OAuth succeeds, but the browser loops back to `/login`. No error toast shown.
- **Root cause:** `VITE_API_URL` was set to the Render URL (`https://takeuforward-ssn.onrender.com/api`) on Vercel, bypassing the proxy. All API calls (including `/auth/me` after login) went directly to `onrender.com` (cross-origin). The session cookie was set with `SameSite=Lax` during the OAuth callback, which blocks cross-origin XHR/fetch requests. `/auth/me` always returned 401 despite a valid session on the Render domain, sending the user back to `/login`.
- **Fix (code):** (1) `client/src/api/axiosClient.js` now ignores `VITE_API_URL` if it contains `.onrender.com` in production, falling back to `/api` (proxy path). (2) `client/src/pages/Login.jsx` applies the same guard to the OAuth redirect URL. (3) `server/config/passport.js` uses a relative `callbackURL` (`/api/auth/google/callback`) so Passport resolves the redirect URI from the request origin via the Vercel proxy headers. (4) `server/index.js` uses a bounded proxy hop count for the Vercel/Render proxy chain.
- **Deployment action required:** (a) Add `https://takeuforward-ssn.vercel.app/api/auth/google/callback` to Google Cloud Console authorized redirect URIs. (b) Remove `VITE_API_URL` from Vercel environment variables (it should be absent in production). (c) Remove any stale `GOOGLE_CALLBACK_URL` Render env var; the backend uses the relative callback path in code.
- **Prevention:** Never set `VITE_API_URL` to a Render URL on Vercel. The proxy path `/api` is the only correct production value. See §4 step 2 for the correct OAuth callback URL configuration.

### 7.12 Express Rate Limit Crash with `trust proxy: true`
- **Symptom:** Backend logs `ERR_ERL_PERMISSIVE_TRUST_PROXY`; requests can kill the local/dev server before Playwright or health checks complete.
- **Root cause:** `express-rate-limit` rejects `app.set('trust proxy', true)` because it allows clients to spoof `X-Forwarded-For` and bypass IP-based limits.
- **Fix:** Changed `server/index.js` to use a bounded proxy hop count (`app.set('trust proxy', 2)`) for the known Vercel/Render proxy chain instead of trusting all proxy headers.
- **Prevention:** Do not use `trust proxy: true` with IP-based rate limiting. If the deployment proxy chain changes, update the bounded hop count deliberately and re-run auth/session plus rate-limit checks.

### 7.13 App Collections Created Under Atlas `test`
- **Symptom:** Atlas shows app collections such as `users`, `posts`, `resources`,
  `chats`, and `bookmarks` under the `test` database.
- **Root cause:** MongoDB connection strings without an explicit database name
  default to `test` unless the app passes `dbName`.
- **Fix:** The backend now passes `MONGODB_DB_NAME` to both Mongoose and
  `connect-mongo`. Use `takeuforward` in production and `takeuforward_dev` locally.
- **Prevention:** Always set `MONGODB_DB_NAME=takeuforward` on Render before first
  production boot. Seeing Atlas' internal `admin` and `local` databases is normal;
  app-owned collections should be inside `takeuforward`.

---

## 8. Edge Cases & Gotchas Checklist

- **Render cold starts + OAuth timing:** after 15+ min idle, the first request
  triggers a 30-50s cold start. If a user initiates Google OAuth during this window,
  the callback may time out or feel broken rather than just slow. UptimeRobot
  mitigates but doesn't eliminate this.
- **Cookie domain across Vercel prod/preview split:** a session cookie set while
  interacting with the production domain will not automatically be sent on requests
  from a preview domain (different origin). However, preview deployments are now fully
  supported for authentication via `sameSite: none` cookies.
- **Atlas free tier storage cap:** M0 clusters have a hard storage limit (512MB).
  Resource uploads store metadata in Mongo (files themselves go to S3), so this is
  a slower risk than S3 filling up, but monitor it as usage grows.
- **Gemini API quota exhaustion:** confirm resource summarization still degrades
  gracefully (falls back without crashing the upload) if the Gemini quota is hit —
  confirm this fallback still holds after any Gemini-related code changes.
- **SMTP credential revocation:** confirm the app doesn't crash if SMTP
  auth fails — per the notification service design, this should log a warning and
  continue, not throw an unhandled error that takes down a request.
- **Rate limiting under real traffic:** limits were chosen for expected low-volume
  campus usage (see specific numbers in `docs/CHANGELOG.md`); if usage grows,
  revisit whether limits are too aggressive (blocking real users) or too loose.
- **Username/email uniqueness collisions:** the `username` field is auto-generated
  from email local-part — confirm the generation logic actually handles a
  theoretical collision (two different email prefixes producing the same username),
  even if unlikely with SSN's email format.
- **Anonymity leak surfaces are cumulative, not one-time:** every new feature that
  serializes a post/comment/user reference is a new potential anonymity-leak surface
  (moderation queue and notifications already caught real leaks here). Any future
  feature touching posts/comments should be checked against this specifically, not
  assumed safe by default.

---

## 9. Rollback Procedure

**Render:**
1. Dashboard → your service → **Deploys** tab.
2. Find the last known-good deploy → click **Redeploy** on that specific commit
   (or use **Manual Deploy** → select the commit SHA).
3. Confirm logs show clean boot before considering the rollback complete.

**Vercel:**
1. Dashboard → your project → **Deployments** tab.
2. Find the last known-good deployment → click the `...` menu → **Promote to
   Production** (this is Vercel's instant rollback — no rebuild needed).

**Database:** MongoDB Atlas does not auto-rollback schema/data changes. If a bad
migration script ran against production, there is no automatic undo — restore from
an Atlas backup (if enabled on your tier) or manually reverse the change.

---

## 10. Monitoring & Health Checks

- `GET /api/health` — returns
  `{ status, db: connected/disconnected }`. This checks a live DB
  ping, not just that the server process is up.
- UptimeRobot should be pointed at the **production Render URL's** `/api/health`,
  checked every 5-10 minutes, with alerting enabled (email at minimum) so a real
  outage is noticed, not just prevented from cold-starting.
- **Render logs** — check periodically (not just after a reported bug) for
  recurring warnings; a warning appearing once is worth investigating before it
  becomes a pattern.
- **No error-tracking/APM tool is currently integrated** (e.g. Sentry). This means
  frontend runtime errors experienced by real users are invisible unless reported
  manually. Worth considering once usage grows beyond the founding team's own
  testing.

---

## 11. Security Checklist for Production

**(Confirmed against current code)**

- [ ] `SESSION_SECRET` is a genuinely long random value, not a placeholder or
  reused dev value.
- [ ] Session cookies use `secure: true` and `sameSite: 'none'` in production.
  This remains required while OAuth/session requests may involve the Vercel/Render
  proxy boundary; do not change it without re-testing production OAuth on Safari/iOS.
- [ ] CORS origin is restricted to specific allowed origins (production + preview
  pattern) — never a wildcard `*` alongside `credentials: true`.
- [ ] No `.env` file, real credential, or API key has ever been committed to git
  history (check history, not just current `.gitignore`).
- [ ] **No hardcoded secrets in utility scripts:** Ensure that files like `server/check-db.cjs`,
  `seed.js`, and migration scripts read from `process.env` and do not contain hardcoded `mongodb+srv://`
  or similar credentials.
- [ ] S3 bucket policy does not allow public write access — only presigned-URL
  scoped uploads.
- [ ] Rate limiting (`express-rate-limit`) is actually applied to post/comment/
  message/report creation routes, and actually triggers under test.
- [ ] Centralized error middleware does not leak stack traces when
  `NODE_ENV=production`.
- [ ] Anonymous post/comment `authorId` stripping is verified across every response
  surface — posts, comments, moderation queue, notifications, notification emails
  (per MASTER_PLAN §13.1 — this has already had two real leaks found and fixed;
  treat any new feature touching posts/users as a fresh risk).
- [ ] Alumni whitelist / invite-token system cannot be bypassed by a crafted request
  (server re-verifies domain/whitelist status regardless of client-supplied data,
  per §9.1-9.2).

---

## 12. Quick Reference — Common Error Messages → Fix

| Error message fragment | Likely cause | Fix |
|---|---|---|
| `Could not connect to any servers in your MongoDB Atlas cluster` | IP not whitelisted, or bad credentials in `MONGODB_URI` | Atlas → Network Access → whitelist; check credentials aren't placeholders |
| `MemoryStore is not designed for a production environment` | Session store not using `connect-mongo` | Confirm `connect-mongo` is installed and wired as `store` in session config |
| `Access-Control-Allow-Origin' header has a value ... that is not equal to the supplied origin` | Trailing slash or unlisted origin in CORS config | Strip trailing slashes from `CLIENT_URL`; add the specific origin (or preview pattern) to the CORS allowlist |
| `404: NOT_FOUND` on a direct route visit (e.g. `/login`, `/profile/:username`) | Missing SPA rewrite config on Vercel | Add/confirm `vercel.json` rewrite rule serving `index.html` for all paths |
| `Network Error` (Axios) on a Vercel preview URL specifically | Preview origin not in CORS allowlist | Confirm CORS pattern covers `*-<project>.vercel.app`, not just the production domain |
| `redirect_uri_mismatch` (Google OAuth) | Redirect URI not registered in Google Cloud Console for this environment | Add the exact callback URL (including protocol and path) to Authorized redirect URIs |
| "No communities/posts/resources found" but data should exist | Production Atlas was never seeded (seeding local Mongo doesn't seed Atlas) | Re-run the relevant `npm run seed:*` script with `MONGODB_URI` pointed at production |
| `401 Unauthorized` looping / redirect loop to `/login` | Axios 401 interceptor conflicting with an initial-load auth guard | Confirm both don't fire redirects simultaneously; one should own the redirect logic |

---

## 13. Standing Pre/Post-Deploy Checklist

Run this every time, not just when something breaks:

**Before merging to `main`:**
- [ ] `npm run lint` passes in both `/client` and `/server`
- [ ] `npm test` passes in `/server` (or documented exceptions noted)
- [ ] No new env var was added without also documenting it in Section 3 above and
  adding it to Render/Vercel dashboards
- [ ] **Secret leak audit:** Searched codebase for `mongodb+srv://`, `AIza`, or AWS keys
  to guarantee no credentials were leaked in standalone scripts or tests.
- [ ] Any new post/comment/user-serializing endpoint re-checked against the
  anonymity model (§11)

**After every deploy:**
- [ ] Hard-refresh 2-3 deep routes directly (not just navigate from home) — confirms
  §7.4 hasn't regressed
- [ ] Full login flow works on the production URL
- [ ] Browser console shows no CORS errors on at least 3 different pages
- [ ] Render logs show clean boot — no MemoryStore warning, no Atlas connection
  error
- [ ] `GET /api/health` returns healthy status
- [ ] If any seed/migration script was added this cycle, confirm it was run against
  production Atlas, not just locally

## 8. End-to-End Testing (Playwright)

The Playwright E2E suite requires the backend to mint valid session cookies via a dedicated backdoor route (POST /api/auth/test-session) to bypass Google OAuth which cannot be automated in CI.

To ensure production safety, this route is strictly dual-gated. It requires BOTH:
1. process.env.NODE_ENV !== 'production'
2. process.env.ALLOW_TEST_SESSION === 'true'

Neither condition alone is sufficient. When running tests, you must explicitly pass ALLOW_TEST_SESSION=true to the backend process.

