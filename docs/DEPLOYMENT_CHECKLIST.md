# Standing Pre/Post-Deploy Checklist

This is a permanent, reusable checklist to follow **before** and **after** every deployment to production.

## 1. Before Merging to `main`
- [ ] **Run Linting**: `npm run lint` must pass in both `/client` and `/server`.
- [ ] **Run Tests**: `npm test` must pass in `/server`.
- [ ] **Environment Variables**:
  - If a new environment variable was added to the code, add it to both **Render** and **Vercel** dashboards (Production, Preview, and Development environments).
- [ ] **Anonymity Audit**: Any new endpoints that serialize posts, comments, or users must be checked to ensure `authorId` is correctly stripped for anonymous posts.
- [ ] **Scripts**: If any new seed or migration script was added, note that it must be manually run against the production database after deployment.

## 2. After Every Deploy (Verification)
- [ ] **Check SPA Routing (Vercel)**:
  - Hard-refresh (Ctrl+F5) on 2-3 deep routes directly (e.g. `/login`, `/profile/yourusername`, `/clubs/some-id`).
  - *Expected:* The page loads normally without a `404: NOT_FOUND` error.
- [ ] **Check Auth Flow (Render + Vercel)**:
  - Complete a full login flow on the production URL (`https://takeuforward-ssn.vercel.app`).
  - *Expected:* Successful redirect back to the home page with an active session.
- [ ] **Check CORS (Browser Console)**:
  - Open the browser console (F12) and check for CORS errors on at least 3 different pages (e.g., Home, Alumni, Referrals).
  - *Expected:* No `Access-Control-Allow-Origin` errors.
- [ ] **Check Preview Deployments (Vercel)**:
  - Click the "Visit Preview" link on the Vercel dashboard for your latest commit.
  - Verify that login and API calls succeed (this confirms the regex CORS matching works).
- [ ] **Check Backend Boot (Render Logs)**:
  - Open the Render dashboard and check the logs for the latest deploy.
  - *Expected:* Clean boot. No `MemoryStore` warnings, no Atlas connection errors, no unhandled exceptions.
- [ ] **Check Health API**:
  - Visit `https://takeuforward-ssn.onrender.com/api/health` directly.
  - *Expected:* Returns `{"status":"UP","db":"connected"}`.
- [ ] **Execute Post-Deploy Scripts**:
  - If a migration script was introduced, execute it manually against the production `MONGODB_URI`.
