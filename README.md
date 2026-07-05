# TakeUForward

A full-stack, secure campus mentorship and utility platform designed for students and alumni. Built with the MERN stack (MongoDB, Express, React, Node.js), Vite, and Tailwind CSS (Vanilla UI Tokens).

## 🚀 Features

The platform is designed in phases and includes comprehensive features for campus communication, professional networking, and academic growth.

### Phase 1: MVP & Core Systems
- **Secure Auth**: Google OAuth restricted to the campus domain, with an exclusive invite-only whitelist for verified Alumni.
- **Anonymity Engine**: Robust server-side identity stripping guarantees true anonymity for sensitive questions and confessions.
- **Academic Resources**: S3-backed storage for sharing notes and PYQs, featuring automatic **Gemini AI Summarization** of uploaded PDFs.
- **Sub-Community Feeds**: Dynamic sorting by Department, Year, and customized topic tags.
- **Club Pages & Announcements**: Admin-managed announcement spaces for official clubs and societies.
- **Moderation Queue**: A centralized dashboard for platform admins to review and resolve reported posts.
- **1:1 Real-Time Chat**: Secure polling-based messaging system for verified identities.

### Phase 2: Professional Networking
- **Verified Alumni Directory**: Browse and connect with alumni by department and current company.
- **Referral & Mock Interview Boards**: Directly request mock interviews or job referrals from verified professionals.
- **Teammate Finder**: Securely find teammates for hackathons, projects, and competitions without leaking identities prematurely.
- **Course & Professor Reviews**: Share and upvote anonymous feedback on courses.
- **Personalized Weekly Digest**: Automated weekly emails aggregating top trending posts and resources using Nodemailer and Cron.
- **Web Push Notifications**: Service Worker and VAPID-powered browser push notifications for mentions and replies.

### Phase 3: Campus Utility Expansion
- **Lost & Found Board**: Track missing items securely with direct messaging claims.
- **Secondhand Marketplace**: Buy, sell, or exchange books and electronics with peer-to-peer messaging.

## 🛠 Tech Stack
- **Frontend**: React.js (Vite), React Router v6, Axios, Vanilla CSS Custom Properties (Design System).
- **Backend**: Node.js, Express.js (ES Modules).
- **Database**: MongoDB Atlas, Mongoose (`connect-mongo` for persistent sessions).
- **Auth**: Passport.js (Google OAuth 2.0).
- **Cloud/3rd Party**: AWS S3 / Supabase Storage (Presigned URLs), Google Gemini AI, Nodemailer, Web-Push.
- **Deployment**: Vercel (Frontend SPA), Render (Backend API).

## 💻 Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   ```
   *(This will run `npm install` concurrently in both the `/client` and `/server` directories via the root package.json).*

2. **Environment Variables**
   - Copy `/server/.env.example` to `/server/.env` and fill in the required variables (MongoDB URI, Google OAuth credentials, AWS keys, Gemini API).
   - Copy `/client/.env.example` to `/client/.env` and configure `VITE_API_BASE_URL` and `VITE_VAPID_PUBLIC_KEY`.

3. **Database Seeding**
   Ensure you seed the initial sub-communities before starting:
   ```bash
   cd server
   npm run seed:communities
   npm run seed:clubs
   ```

4. **Run the App Locally**
   ```bash
   npm run dev
   ```
   *(This starts both the React frontend and the Express backend concurrently).*

## 🧪 Testing and Linting
- **Linting**: `npm run lint` inside `/client` or `/server`.
- **Backend Tests**: `npm run test` inside `/server`.
- **E2E Tests**: `npx playwright test` at root for E2E tests.

## 📚 Documentation
For more details on the architecture, data models, and deployment configurations, refer to the `/docs` directory:
- [Master Plan](./docs/MASTER_PLAN.md): Full feature specifications and database schema.
- [Deployment Guide](./docs/DEPLOYMENT.md): Detailed runbook for deploying to Render, Vercel, and Atlas.
- [Changelog](./docs/CHANGELOG.md): Version history and audit patches.
- [Feature Tracker](./docs/FEATURE_TRACKER.md): Live status of implemented features.
