# TakeUForward

Full-stack campus mentorship platform.

## Setup Instructions

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
