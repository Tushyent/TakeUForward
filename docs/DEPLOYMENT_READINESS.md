# Deployment Readiness Audit

## A. Environment Variables
- [Needs Fix] 1. Usage vs `.env.example`: `AWS_BUCKET_NAME` is used in `server/config/s3.js`, but `.env.example` defines `AWS_S3_BUCKET_NAME`.
- [OK] 2. Gitignore: `.env` is properly ignored and was never committed to history.
- [OK] 3. Hardcoded values: All logic code uses `process.env` or `import.meta.env` with safe localhost fallbacks.

## B. CORS
- [OK] 4. Express CORS: Already correctly configured to use `process.env.CLIENT_URL`.

## C. Session / Cookies
- [Needs Fix] 5. Cookie Settings: `sameSite` is not defined and defaults to `lax`. It needs to conditionally be `none` in production to allow cross-site cookies between Vercel and Render.
- [Needs Fix] 6. Session Store: Currently using default in-memory store. Needs a persistent store like `connect-mongo` to survive Render instances going to sleep/restarting.

## D. Google OAuth
- [OK] 7. Callback URL: `passport.js` correctly reads from `process.env.GOOGLE_CALLBACK_URL`.
- [Needs Manual Dashboard Step] 8. Redirect URIs: Needs both localhost and production Render URL added to Google Cloud Console.

## E. Frontend API Base URL
- [OK] 9. Axios client: Correctly reads from `import.meta.env.VITE_API_URL`.
- [OK] 10. Hardcoded origins: No hardcoded `fetch` or local origins found elsewhere in client.

## F. Build & start commands
- [OK] 11. Server Start Script: `/server/package.json` correctly defines `"start": "node index.js"`.
- [OK] 12. Client Build: `npm run build` succeeds and outputs to `dist/`, which Vercel expects natively.
- [OK] 13. Root Scripts: No conflict, root handles local workflow without interfering with isolated deploys.

## G. AWS S3 / Gemini / Nodemailer
- [Needs Manual Dashboard Step] 14. S3 CORS: The AWS S3 bucket needs its CORS policy updated manually to allow the future Vercel frontend origin.
- [OK] 15. Frontend Secrets: No secrets are accidentally prefixed with `VITE_`. Only `VITE_API_URL` is exposed to the client bundle.

## H. Error handling & logging
- [Needs Fix] 16. Error Middleware: Stack traces are never leaked (which is safe), but they are omitted in local dev too. Needs to be made conditional based on `NODE_ENV`.
- [OK] 17. Verbose Logging: No sensitive tokens or DB URIs are logged.

## I. Health check
- [OK] 18. Health API: `GET /api/health` accurately checks `mongoose.connection.readyState`.
