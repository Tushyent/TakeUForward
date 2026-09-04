# TakeUForward — Backend API Server (`/server`)

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Jest Tests](https://img.shields.io/badge/Jest-112%20passing-success?style=flat-square&logo=jest&logoColor=white)](#testing)
[![Architect](https://img.shields.io/badge/Architect-Tushyent-E3A44E?style=flat-square)](https://tushyent-portfolio.vercel.app/)

> The TakeUForward backend is a robust RESTful API built on **Node.js** and **Express.js**, backed by **MongoDB Atlas** via Mongoose, implementing session-based authentication, server-side data anonymity redaction, and direct S3 presigned file uploads.

---

## 🏛️ Middleware Architecture & Request Pipeline

Every incoming HTTP request executes through a strictly sequenced **Chain of Responsibility** middleware pipeline before reaching controller business logic:

```
Incoming HTTP Request
       │
       ▼
1. Security Headers (`helmet`)
       │
       ▼
2. CORS & Origin Validation (`cors`)
       │
       ▼
3. Rate Limiting (`rateLimiter.js` via express-rate-limit)
       │
       ▼
4. Body Parsers (`express.json({ limit: '100kb' })`, `express.urlencoded`)
       │
       ▼
5. Session Deserialization (`express-session` backed by `connect-mongo`)
       │
       ▼
6. Passport Authentication (`passport.initialize()`, `passport.session()`)
       │
       ▼
7. Query & ReDoS Sanitization (`sanitizeQuery.js`)
       │
       ▼
8. Route Security Gates:
   ├── `requireAuth.js`          (Rejects unauthenticated requests with 401)
   ├── `requireApprovedUser.js`  (Rejects suspended or pending accounts with 403)
   └── `requireSystemAdmin.js`   (Restricts administrative routes to platform admins)
       │
       ▼
9. Route Controller Execution (try/catch wrapped)
       │
       ▼
10. Centralized Error Handler (`errorMiddleware.js`)
```

---

## 🔒 Core Engineering Systems

### 1. Server-Side Anonymity Engine (`utils/anonymity.js`)
* **Security Requirement**: Client-side filtering is fundamentally insecure since the raw JSON response in DevTools would still expose the author.
* **Implementation**: When `isAnonymous: true` on any post or comment, the controller strips `authorId`, `author`, and user metadata on the server before serialization.
* **Verification**: Proven and guarded by Jest unit tests (`tests/anonymity.test.js`).

### 2. AWS S3 Presigned URL Streaming (`config/s3.js`)
* Files (PDF notes, student drive uploads, screenshots) are not streamed through the Node.js server to prevent memory bottlenecks.
* The backend generates signed PUT URLs (`GetSignedUrlCommand`), and the client uploads directly to AWS S3.

### 3. ReDoS Protection & Defensive Query Sanitization (`middleware/sanitizeQuery.js`)
* User search inputs are sanitized to escape characters that could trigger exponential catastrophic backtracking in MongoDB `$regex` evaluations.

---

## 📁 Directory Structure

```
server/
├── config/
│   ├── db.js                   # Mongoose connection & connection retry logic
│   ├── env.js                  # Environment variable validation & defaults
│   ├── gemini.js               # Google Gemini API client initialization
│   ├── mailer.js               # SendGrid SMTP mailer wrapper
│   ├── passport.js             # Google OAuth 2.0 strategy & user serialization
│   └── s3.js                   # AWS S3 SDK v3 client & presigned URL generators
├── middleware/
│   ├── csrfProtection.js       # Origin/Referer verification & custom header checks
│   ├── errorMiddleware.js      # Centralized error handler (hides stack traces in prod)
│   ├── rateLimiter.js          # Token-bucket rate limiting presets
│   ├── requireApprovedUser.js  # Gates suspended or pending alumni accounts
│   ├── requireAuth.js          # Authenticated session verifier
│   ├── requireSystemAdmin.js   # Platform administrator role verifier
│   └── sanitizeQuery.js        # ReDoS query sanitization middleware
├── models/                     # 18 Mongoose Schemas (User, Post, Community, Review, etc.)
├── routes/                     # 22 REST route modules (auth, posts, reviews, admin, etc.)
├── services/                   # Business services (SendGrid, ActivityLogger, Gemini)
├── tests/                      # 13 Jest test suites (112 passing unit tests)
├── utils/                      # Anonymity sanitizers, logger, URL validators
├── index.js                    # Server bootstrap, middleware assembly, and lifecycle
└── package.json
```

---

## 🧪 Testing

The backend maintains an extensive unit and integration test suite written in **Jest**:

```bash
# Run all test suites
npm test

# Run a specific test suite
npm test tests/anonymity.test.js
```

### Test Coverage Highlights:
* `anonymity.test.js` & `anonymity_extended.test.js`: Proves `authorId` never leaks in anonymous posts or comments.
* `alumniGate.test.js`: Validates that unverified alumni are blocked from restricted routes.
* `authorization.test.js` & `userIdentity.test.js`: Enforces RBAC permissions across roles.
* `rateLimiter.test.js`: Ensures rate limiting properly halts excessive traffic with 429 status.
* `driveSecurity.test.js`: Asserts that users can only access their own private drive files.

---

## 🛠️ Environment Configuration

Create a `.env` file in `/server` based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/takeuforward_dev
SESSION_SECRET=your_secure_random_session_secret
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIENT_URL=http://localhost:5173
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
S3_BUCKET_NAME=takeuforward-storage
GEMINI_API_KEY=your_gemini_key
SENDGRID_API_KEY=your_sendgrid_key
```

---

<div align="center">
  <sub>Architected with ❤️ by <a href="https://tushyent-portfolio.vercel.app/">Tushyent</a></sub>
</div>
