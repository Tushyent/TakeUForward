# TakeUForward

## What it is
TakeUForward is an exclusive, full-stack campus platform designed for SSN college students and alumni. It offers mentorship coordination, academic resource sharing, anonymous placement reviews, peer-to-peer lost-and-found registry, a campus marketplace, and secure messaging tools.

---

## Tech Stack
- **Frontend**: React 18 SPA, Vite, TailwindCSS (for utility structures), React Router.
- **Backend**: Node.js, Express, Passport.js (Google OAuth 2.0).
- **Database**: MongoDB Atlas via Mongoose.
- **File Storage**: AWS S3 (handling private and public media via secure presigned URLs).
- **Messaging/Notifications**: Web Push (VAPID) and SendGrid API.
- **AI**: Gemini API for academic resource parsing.

---

## Repository Structure
```
├── client/                 # React SPA (Vite + lazy routes)
│   ├── src/
│   │   ├── api/            # API clients & Axios config
│   │   ├── components/     # Reusable components & ErrorBoundary
│   │   ├── context/        # Context states (Auth, UI)
│   │   ├── pages/          # Lazy-loaded page components
│   │   └── App.jsx         # App routing and layout configuration
├── server/                 # Express backend (ES Modules)
│   ├── config/             # DB, mailer, S3 client, environment config
│   ├── middleware/         # Auth, CSRF, CORS, Rate Limiters
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Controller logic & routes
│   └── tests/              # Jest test suites
├── docs/                   # System design, Master Plan, and Deployment logs
└── E2E/                    # Playwright end-to-end integration tests
```

---

## Prerequisites
- **Node.js**: version `20.x` or higher
- **MongoDB**: version `6.x` or higher running locally (or MongoDB Atlas connection)
- **AWS Account**: S3 bucket configured for uploads (optional in local development)
- **Google Developer Console**: OAuth client credentials configured

---

## Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Tushyent/TakeUForward.git
cd TakeUForward
```

### 2. Configure Environment Variables
Copy `.env.example` in the `server` directory and populate your local variables:
```bash
cp server/.env.example server/.env
```

Ensure the following minimal settings are configured locally:
- `SESSION_SECRET`: A secure random key.
- `MONGODB_URI`: E.g. `mongodb://localhost:27017/takeuforward_dev`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Your Google credentials.

### 3. Install Dependencies
Run npm install in both workspaces:
```bash
# Root packages
npm install

# Client packages
cd client && npm install

# Server packages
cd ../server && npm install
```

### 4. Database Setup & Seeding
To populate local communities and default administration structures:
```bash
cd ../server
npm run seed:communities
npm run seed:admin
```

---

## Running the Application

### Running Concurrently (Root)
From the root workspace directory, run:
```bash
npm run dev
```
This spawns the frontend Vite server at `http://localhost:5173` and backend API at `http://localhost:5000`.

### Running Server Only
```bash
cd server
npm run dev
```

### Running Client Only
```bash
cd client
npm run dev
```

---

## Testing & Code Quality

### Running Backend Tests
Backend unit and integration tests are powered by Jest:
```bash
cd server
npm test
```

### Running Linters
We enforce zero errors across all workspaces prior to pushes:
```bash
# Server (ESLint)
cd server
npm run lint

# Client (Oxlint / ESLint)
cd client
npm run lint
```

### Building for Production
To bundle assets for production deployment:
```bash
cd client
npm run build
```

---

## Security Features
1. **Strict Input Validation**: Size limits on request payloads (100kb JSON body limits) and field-level length limits on posts, comments, messaging, and ticket descriptions.
2. **ReDoS / Backtracking Safety**: User input queries passed to MongoDB `$regex` filters are parsed and sanitized of pattern matching operators.
3. **Sensitive Field Sanitization**: Internal fields (e.g. `googleId`, push subscription credentials) are whitelisted out of outgoing client session updates.
4. **Alumni Suspension & Gate**: Accounts flagged as suspended (`isApproved === false`) or pending alumni validation (`isVerifiedAlumni === false`) are secure-gated middleware-side from interacting with general API paths.
5. **SSRF Protections**: Gemini parse URLs are validated to prevent connections to loopback/private subnets and cloud metadata IPs.

---

## Troubleshooting
- **OAuth login callback fails to save cookie**: Ensure Chrome/Firefox is not blocking third-party cookies locally. In production, ensure backend `trust proxy` configuration matches your hosting layout.
- **SendGrid email failures**: Ensure `SENDGRID_API_KEY` is active and verify domain identity verification in SendGrid console.

---

## Contributing
1. Ensure `npm run lint` passes in both package folders.
2. Ensure `npm test` runs with 100% success.
3. Commit messages must match Conventional Commit structures (`feat(auth): ...` or `fix(s3): ...`).
