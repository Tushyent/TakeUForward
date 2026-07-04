# TakeUForward

Full-stack campus mentorship platform featuring real-time notifications, @mentions, anonymous posting, academic resource sharing, and admin-managed club pages.

## Key Features Built So Far
- **Secure Auth**: Google OAuth restricted to the SSN domain, with a strict invite-only whitelist for Alumni.
- **Anonymity Engine**: Server-side Identity stripping guarantees true anonymity for sensitive questions.
- **Notifications & @Mentions**: In-app Notification Bell and automated Email alerts via Nodemailer for mentions and replies, with a dynamic dropdown autocomplete UI.
- **Academic Resources**: S3-backed storage with automatic Gemini AI summarization of uploaded notes/PYQs.
- **Club Pages**: Admin-managed announcement spaces for official clubs.
- **Moderation**: Auto-hiding of reported posts and a dedicated platform admin queue.

1. **Install dependencies**
   ```bash
   npm install
   ```
   This will install dependencies for both the frontend (`client`) and backend (`server`) if configured properly, but initially, make sure you install in both directories.

2. **Environment Variables**
   - Copy `/server/.env.example` to `/server/.env` and fill in the required variables (MongoDB URI, Google OAuth credentials).
   - Copy `/client/.env.example` to `/client/.env` and configure VITE_ variables if any.

3. **Run the App Locally**
   ```bash
   npm run dev
   ```
   This command starts both the React frontend and the Express backend concurrently.

4. **Testing and Linting**
   - `npm run lint` inside `/client` or `/server`.
   - `npm run test` inside `/server`.
   - `npx playwright test` at root for E2E tests.

For more details on the architecture and data model, see [Master Plan](./docs/MASTER_PLAN.md).
