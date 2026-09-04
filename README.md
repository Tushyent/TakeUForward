# TakeUForward SSN (TUF SSN) — One-Stop Campus Mate & Mentorship Platform

[![Live Platform](https://img.shields.io/badge/Production%20Live-takeuforward.blastorz.fun-E3A44E?style=flat-square&logo=google-chrome&logoColor=white)](https://takeuforward.blastorz.fun/)
[![Architect](https://img.shields.io/badge/Architect-Tushyent-7FB0A3?style=flat-square&logo=github&logoColor=white)](https://tushyent-portfolio.vercel.app/)
[![Portfolio](https://img.shields.io/badge/Portfolio-tushyent--portfolio.vercel.app-965B16?style=flat-square&logo=vercel&logoColor=white)](https://tushyent-portfolio.vercel.app/)
[![Tests](https://img.shields.io/badge/Tests-112%20passing%20(Jest)-success?style=flat-square&logo=jest&logoColor=white)](#testing--code-quality)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](#license)

> An exclusive, full-stack campus mentorship, academic utility, and peer networking platform built specifically for students, faculty, and verified alumni of **SSN College of Engineering**.

---

## 👨‍💻 Created & Architected By

**Tushyent (Tushyent N P)**  
Full-Stack Software Engineer & System Architect  
* 🌐 **Portfolio**: [tushyent-portfolio.vercel.app](https://tushyent-portfolio.vercel.app/)
* 🐙 **GitHub**: [@Tushyent](https://github.com/Tushyent)
* 🚀 **Production Application**: [takeuforward.blastorz.fun](https://takeuforward.blastorz.fun/)
* 📐 **Technical Specs & System Design**: [takeuforward.blastorz.fun/tech](https://takeuforward.blastorz.fun/tech)

---

## ⚡ Executive Summary & Value Proposition

University campuses often suffer from fragmented communication: academic notes are scattered across WhatsApp drives, placement experiences get buried in Google Docs, alumni referrals lack structured coordination, and students hesitate to ask sensitive questions without guaranteed privacy.

**TakeUForward** unifies all campus activities into a single high-performance Progressive Web App (PWA):
1. **Server-Side Anonymity Engine**: Allows students to post queries, complaints, and placement confessions with cryptographic server-side identity stripping at the controller layer.
2. **Verified Alumni Mentorship Network**: Connects students with verified corporate alumni for 1:1 mock interviews and direct job referrals.
3. **AI-Powered Academic Repository**: Centralizes past-year papers (PYQs) and syllabi with Google Gemini AI integration to synthesize study guides directly from PDFs.
4. **Campus Utility Hub**: Peer-to-peer textbook marketplace, lost-and-found registry, course elective reviews, and student clubs directory.

---

## 🏛️ System Architecture

TakeUForward adopts a decoupled three-tier cloud topology optimized for performance, defense-in-depth security, and zero server bandwidth saturation during file uploads.

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT BROWSER                                     |
|    React 18 SPA (Vite) | Vanilla CSS Design Tokens | PWA Service Worker (Cache)       |
+---------------------------------------------------------------------------------------+
           |                                             |
           | HTTPS REST / JSON                           | Direct Binary Upload (PUT)
           v                                             v
+------------------------------------+        +-----------------------------------------+
|        EDGE / INGRESS ROUTING      |        |                 AWS S3                  |
|    Vercel Edge Network / TLS Proxy |        |  Presigned Upload URLs | Private Files  |
+------------------------------------+        +-----------------------------------------+
           |
           v
+---------------------------------------------------------------------------------------+
|                              APPLICATION LAYER (EXPRESS)                              |
|  [Helmet / CORS] -> [RateLimiter] -> [Session (Mongo)] -> [Sanitizer] -> [Auth Gate]   |
|                                                                                       |
|  Controllers: Posts | Auth (OAuth 2.0) | Chat | S3 Signing | Gemini AI Parser | Admin  |
+---------------------------------------------------------------------------------------+
           |                                             |
           | Mongoose ODM                                | SMTP / VAPID Push
           v                                             v
+------------------------------------+        +-----------------------------------------+
|          DATABASE LAYER            |        |          EXTERNAL NOTIFICATIONS         |
|   MongoDB Atlas (M10 Replica Set)  |        |    SendGrid V3 API | Web Push Service   |
|   Compound & Full-Text Indexes     |        +-----------------------------------------+
+------------------------------------+
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Rationale |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, React Router 6, Axios | Ultra-fast HMR, 510ms production Rollup bundling, and tree-shaken code splitting. |
| **Styling** | Vanilla CSS Design Tokens | Zero JavaScript runtime overhead, instant theme switching (`data-theme`), bespoke editorial palette. |
| **Backend** | Node.js 20+, Express.js | High-throughput asynchronous event-loop I/O, robust middleware ecosystem. |
| **Database** | MongoDB Atlas, Mongoose ODM | Flexible document schema for polymorphic campus entities, compound & text indexing. |
| **Authentication** | Passport.js Google OAuth 2.0, `connect-mongo` | HttpOnly session cookies mitigating XSS; instant server-side revocation of suspended users. |
| **Cloud Storage** | AWS S3 (Presigned URLs) | Zero Node.js RAM/CPU exhaustion; clients stream files directly to storage buckets. |
| **AI Integration** | Google Gemini 1.5 Flash API | Automatic summarization of academic PDF notes and question papers. |
| **Notifications** | Web Push API (VAPID), SendGrid V3 | Dual-channel event delivery for replies, mentions, and interview confirmations. |
| **DevOps / CI** | GitHub Actions, Oxlint, ESLint, Jest, Playwright | Pre-commit zero-error linting, automated unit testing, end-to-end user journey tests. |

---

## 🔒 Security & Defensive Engineering

* **Server-Side Anonymity Engine**: Posts flagged `isAnonymous: true` have author references stripped at the database controller level before JSON serialization. Client-side DevTools inspection never reveals author identity.
* **XSS Mitigation**: Authentication relies on `HttpOnly`, `SameSite=Lax/None`, and `Secure` cookies stored in MongoDB Atlas, preventing token exfiltration via malicious scripts.
* **ReDoS Prevention**: Search inputs passed to MongoDB `$regex` are sanitized through `sanitizeQuery.js` to prevent catastrophic backtracking attacks.
* **Token-Bucket Rate Limiting**: Distinct IP and route thresholds protect sensitive endpoints (login, password reset, support tickets) against brute force.
* **SSRF Protection**: Gemini URL parsers validate destination protocols and reject loopback/private subnets and cloud metadata endpoints.
* **Granular Role-Based Access (RBAC)**: Enforced via `requireAuth`, `requireApprovedUser`, and `requireSystemAdmin` middleware guards.

---

## 📁 Repository Structure

```
├── client/                     # Frontend Application (React 18 + Vite)
│   ├── public/                 # Static assets, sitemap.xml, llms.txt, PWA manifest
│   ├── src/
│   │   ├── api/                # Centralized Axios client & CSRF interceptors
│   │   ├── components/         # Reusable UI components (Modals, Cards, Badges, Tabs)
│   │   ├── constants/          # Navigation, departments, categories
│   │   ├── context/            # Global state (AuthContext, ThemeContext)
│   │   ├── hooks/              # Custom hooks (useSEO, useDebounce, useMentionSearch)
│   │   ├── pages/              # Lazy-loaded route views (including /tech)
│   │   ├── index.css           # Design tokens, variables, responsive typography
│   │   └── App.jsx             # Route definitions & Suspense boundaries
│   └── vite.config.js          # Vite build config & PWA injectManifest plugin
├── server/                     # Backend API (Node.js + Express)
│   ├── config/                 # DB connection, Passport OAuth, S3 SDK, Mailer
│   ├── middleware/             # Rate limiters, CSRF, auth guards, query sanitization
│   ├── models/                 # Mongoose data schemas (Post, User, Review, Chat)
│   ├── routes/                 # Express controllers and endpoint routes
│   ├── services/               # Gemini AI, activity logging, notifications
│   ├── tests/                  # Jest test suites (112 passing unit tests)
│   └── utils/                  # Anonymity serializers, logger, pagination
├── docs/                       # Master product specification, design logs, changelog
├── e2e/                        # Playwright end-to-end integration tests
└── .gitignore                  # Strict credential, scratch script, and build exclusions
```

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js**: `v20.x` or higher
* **MongoDB**: Local MongoDB instance or free MongoDB Atlas URI
* **Google OAuth Credentials**: Client ID & Secret from Google Cloud Console
* **AWS S3 Bucket**: (Optional for local file testing, Supabase Storage compatible)

### 1. Clone the Repository
```bash
git clone https://github.com/Tushyent/TakeUForward.git
cd TakeUForward
```

### 2. Configure Environment Variables
Copy `.env.example` in `server`:
```bash
cp server/.env.example server/.env
```
Populate the minimal variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/takeuforward_dev
SESSION_SECRET=your_super_secret_session_key
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
```

### 3. Install Dependencies
```bash
# Install root dependencies
npm install

# Install client packages
cd client && npm install

# Install server packages
cd ../server && npm install
cd ..
```

### 4. Database Seeding (Optional)
```bash
cd server
npm run seed:communities
npm run seed:admin
cd ..
```

### 5. Run the Application
Run both frontend and backend concurrently from the repo root:
```bash
npm run dev
```
* **Frontend**: `http://localhost:5173`
* **Backend API**: `http://localhost:5000`

---

## 🧪 Testing & Code Quality

### Backend Unit & Integration Tests (Jest)
```bash
cd server
npm test
```
* **Status**: 13 test suites passed, 112 tests passed.
* Covers: Anonymity stripping, alumni gates, chat authorizations, drive security, and rate limiting.

### Static Code Analysis & Linters
We enforce zero lint warnings or errors before any deployment:
```bash
# Frontend (Oxlint / ESLint)
cd client
npm run lint

# Backend (ESLint)
cd server
npm run lint
```

### Production Build
```bash
cd client
npm run build
```

---

## 🎯 Technical Reference & Interview Guide

For a comprehensive technical deep-dive into the architectural decisions, design patterns, and answers to top senior software engineering interview questions on this project:

👉 **Visit the live reference page**: [takeuforward.blastorz.fun/tech](https://takeuforward.blastorz.fun/tech)

Topics covered:
* Why HttpOnly session cookies were chosen over JWT in LocalStorage.
* The mechanics of the server-side anonymity engine and regression testing.
* Why polling was chosen for Phase 1 and the Phase 2 Socket.io roadmap.
* How presigned AWS S3 upload URLs prevent Node.js event-loop exhaustion.
* Defensive programming against catastrophic regular expression backtracking (ReDoS).
* Scaling strategy to support 500,000 concurrent university students.

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <sub>Architected and built with ❤️ by <a href="https://tushyent-portfolio.vercel.app/">Tushyent</a> for SSN College of Engineering.</sub>
</div>
