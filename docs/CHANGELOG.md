# Changelog

All notable changes to this project are logged here, newest first.
Every commit that adds/changes a feature should have a matching entry here.
Have orderwise log either based on filewise, or changes did in the codebase.
Format: Keep a Changelog style — Added / Changed / Fixed / Removed.

## [Unreleased]

### Security
- **[Deployment] Standardized email addresses across the platform:** Replaced all hardcoded `noreply@takeuforward.com` and `noreply@takeuforward-ssn.com` fallbacks in `mailer.js` with `takeuforwardssn@gmail.com`. Updated `.env.example` and `DEPLOYMENT.md` to reflect the canonical support/admin email. Added `REPLY_TO_EMAIL` env var to the deployment reference.

### Added
- **[Admin] Full platform CRUD management UI:** Expanded the System Admin Dashboard (`/admin`) with four management tabs — Overview, Clubs, Communities, and Posts. Admins can now create, edit, and delete clubs and communities directly from the UI, and search + delete any post on the platform. All operations are gated by the `requireSystemAdmin` middleware.
- **[Seed] 42 SSN clubs:** Replaced the previous 3-club seed with complete data for all 42 official SSN clubs (ACM, IEEE chapters, Coding Club, GDG, Lakshya, cultural clubs, etc.).
- **[Seed] 36 batch communities:** Added communities for all 9 departments × 4 graduating batches (2026–2029) using the short-name format (e.g. `CSE'28`, `MTECH-CSE'28`) plus `General` and `Placements`.
- **[UI] Shared Modal component:** Added `client/src/components/ui/Modal.jsx` for reuse across admin and future features.

### Changed
- **[Refactor] Eliminated duplicate S3 client in personal drive routes:** `privateFileRoutes.js` was instantiating its own `S3Client` and `DeleteObjectCommand` instead of reusing the already-exported `deleteObjectByKey` from `config/s3.js`. This prevented S3 config changes (region, credentials) from being picked up by the delete path. Route now imports and uses the shared utility.
- **[Refactor] Centralized report auto-hide threshold:** Extracted the hardcoded `3` in four report endpoints (posts, interview experiences, elective suggestions, career roadmaps) into a shared `REPORT_THRESHOLD` constant in `server/utils/constants.js`. Changing the threshold now requires editing one file instead of four.

### Fixed
- **[P1] Notification email deep links:** Mention, reply/comment, chat-message, and club-announcement mention notifications now store a `targetPath`, send email/web-push links to the exact post/comment/chat thread, and render richer email copy with escaped user content instead of linking every notification to `/home`.
- **[P1] Club announcement category filtering:** `POST /api/clubs/:id/posts` now accepts and validates `category`, persists it on announcement posts, and makes newly created club announcements visible through `/api/announcements?category=...`.
- **[P1] Validation errors returning 500:** Added explicit request validation to Interview Experiences, Elective Suggestions, and Marketplace creation routes so invalid direct API payloads return clean `400` messages instead of raw Mongoose validation 500s.
- **[P1] Public auth page redirects:** Updated the global Axios `401` redirect guard so unauthenticated users can still view `/pending-approval` and `/alumni-invite/:token` instead of being forced back to `/login` by the `/auth/me` check.
- **[P1] Test-session profile fidelity:** Dev-only `POST /api/auth/test-session` now assigns missing `username` and `handle` values so E2E/profile render checks exercise the same public-profile routing shape as OAuth-created users.
- **[P2] Support queue console noise:** Removed handled Axios errors from the admin support queue console path; failures now surface through the existing toast feedback without dumping stack traces in the browser.
- **[P2] Client lint warnings:** Moved the `useAuth` hook into a hook-only context module and stabilized the Support Queue fetch callback to clear React Fast Refresh / hooks dependency warnings.
- **[P2] Debug output cleanup:** Replaced `console.log` / `console.error` usage in `server/check-db.cjs` with explicit stdout/stderr writes.
- **[P0] Bookmarks mixed post/resource crash:** Fixed `/api/bookmarks` returning 500 when a user had both post and resource bookmarks. The polymorphic bookmark populate was trying to populate post-only fields (`authorId`, `clubId`) on `Resource` documents under Mongoose strict populate. Added scoped `strictPopulate: false` to those nested post-only populate paths. Verified mixed post/resource bookmarks now return 200 and anonymous post authors remain stripped.
- **[P0] Dev/server crash from permissive trust proxy rate-limit validation:** Changed Express `trust proxy` from `true` to a bounded hop count (`2`) so `express-rate-limit` no longer kills the server with `ERR_ERL_PERMISSIVE_TRUST_PROXY` on requests while still trusting the Vercel/Render proxy chain.
- **[P0] OAuth login loop in production:** Fixed cross-origin session cookie mismatch. **Root cause:** `VITE_API_URL` was set to the Render URL on Vercel, causing all API calls to go directly to `onrender.com` (cross-origin) instead of through the Vercel proxy (same-origin). The session cookie (set with `SameSite=Lax` during OAuth callback) was never sent on cross-origin XHR requests, causing `/auth/me` to return 401 and routing back to `/login`. **Changes:** (1) `server/index.js` — restored `sameSite: 'none'` in production. (2) `axiosClient.js` and `Login.jsx` — ignore `VITE_API_URL` if it points to `onrender.com` in production, use `/api` instead. (3) `passport.js` — relative `callbackURL` so Passport resolves from request origin. (4) `index.js` — `trust proxy` set to a bounded Vercel/Render hop count. (5) `postRoutes.js` — fixed `role !== 'platform_admin'` to `!isPlatformAdmin` (dead adminship check). (6) `authRoutes.js` — removed redundant dynamic `logger` import. (7) `DEPLOYMENT.md` — corrected env table. **Deployment action required:** (a) Add `https://takeuforward-ssn.vercel.app/api/auth/google/callback` to Google Cloud Console. (b) Remove `VITE_API_URL` from Vercel env vars. (c) Remove any stale `GOOGLE_CALLBACK_URL` from Render; the backend uses a relative callback path.

### Changed
- **[Deployment] Route-level code splitting:** Lazy-load routed React pages so the production entry bundle stays below Vite's chunk-size warning threshold and beta users download less JavaScript on first load.
- **[Identity] Email-derived mention handles:** User `username`/`handle` values are now derived from the email local-part for mentions and profiles (`tushyent2410053@ssn.edu.in` -> `@tushyent2410053`, club emails like `codingclub@ssn.edu.in` -> `@codingclub`). The fixed system admin account uses `@admin`.
- **[Database] Explicit MongoDB database name:** Backend connections and Mongo session storage now use `MONGODB_DB_NAME` with production default `takeuforward` and dev default `takeuforward_dev`, avoiding accidental app collections under Atlas' default `test` database.

### Added
- **[Feature] System Admin Dashboard:** Added `/admin` for the fixed system admin account (`takeuforwardssn@gmail.com`) to review counts, jump to moderation/support queues, search users/resources, delete inappropriate resources, and delete abusive users with associated app data cleanup. Admin routes are restricted server-side to the exact system admin email.
- **[Feature] Support / Feedback System:** Added a new support ticketing system (Option B anonymity model) for users to report bugs or request features. The `authorId` is always visible to platform admins. Reuses the existing S3 presigned URL pattern for optional screenshot uploads. Implements rate limiting on ticket creation. Added `/support` page for users and `/admin/support` queue for admins.
- **[Observability] Structured Logging with Pino:** Replaced all `console.*` calls with `pino`. Added `pino-http` to log incoming requests. Set dynamic log level via `LOG_LEVEL` env var.
- **[Observability] Graceful Shutdown:** Implemented `SIGTERM`/`SIGINT` handlers in `server/index.js` to cleanly close HTTP connections and Mongoose before exiting.
- **[Feature] Alumni Registration Request Flow:** Unverified alumni without an invite link can now request access via a new form on the `/login` page. Admins have a new "Alumni Requests" tab in the Moderation Queue (`/moderation`) to approve or reject these requests. Approval automatically generates an invite token and dispatches an email via NodeMailer.
- **[Security] `.gitignore` strictness:** Fortified root and client `.gitignore` files to aggressively block all `.env*` files (except `.env.example`) and all Playwright testing artifacts (`test-results`, `playwright-report`, `blob-report`) to prevent accidental secret and artifact leaks.

### Fixed
- **[Deployment] Consolidated Health Check:** `GET /health` and `GET /api/health` now share identical logic, returning a `503 Service Unavailable` if MongoDB is disconnected (instead of incorrectly returning `200 OK`).
- **[Security] Test-Session route strictly gated:** The `POST /api/auth/test-session` route is now structurally wrapped in `if (process.env.NODE_ENV !== 'production')` at the route registration level. It does not exist on the router in production, preventing any runtime bypass. Verified by `prodSafety.test.js`.
- **[Deployment] PaaS Healthcheck 404s:** Duplicated the health endpoint mount to `app.use('/health', healthRoutes)` in `server/index.js` to ensure external PaaS uptime monitors (Render, UptimeRobot) receive 200 OKs instead of 404s.
- **[Deployment] Vite Dev Server Port Jumping:** Relaxed the `server/index.js` CORS `localhost` policy to dynamic regex (`^http:\/\/(localhost|127\.0\.0\.1):517\d$`) to allow the Vite dev server to jump ports (e.g. `5174`) without breaking API connectivity.
- **[Testing] Extended Anonymity Engine tests:** Proved `Review` responses and the Moderation Queue admin view actively strip `authorId` for anonymous content. Confirmed that `Bookmark`, `LostFoundItem`, and `MarketplaceItem` do not have intrinsic `isAnonymous` fields by design.
- **[Testing] Full Authorization coverage:** Covered all 8 mutating areas (Posts/Comments delete, ReferralRequest/MockInterview/TeamRequest close, Club Analytics access, Marketplace mark-sold, Lost & Found/Moderation resolve). Tested 401 (unauthenticated), 403 (unauthorized/not owner), and 200 (success) branches for each.
- **[Testing] Rate limiter validation:** Proved `upvoteLimiter` (30/min) and `reportLimiter` (5/10min) actively block requests with `429 Too Many Requests` when thresholds are crossed, using fresh in-memory rate limiters per test.
- **[Testing] Jest coverage reporting:** Configured `--coverage` in `jest.config.js` to collect metrics across all routes, middleware, services, and utils (excluding scripts/test files). Current coverage stands at 21.5% globally (focused strictly on core critical paths, not chasing 100%).
- **[Testing] Playwright Critical-Path E2E:** Built `critical-path.spec.js` mapping to MASTER_PLAN.md §17 (login → anonymous post → comment → resource search). Used a secure, test-only `POST /api/auth/test-session` backend endpoint (active *only* when `PLAYWRIGHT_TEST=true`) to bypass Google OAuth headless automation blocks.

### Fixed
- **[P0] `year: 3` crash in test-session route:** Changed hardcoded `year: 3` to `year: 2025` in `authRoutes.js:192` to prevent student profile creation from crashing with invalid year value.
- **[P1] Missing MongoDB indexes:** Added `index: true` to `Notification.userId`, `Resource.courseCode`+`uploaderId`, and `LostFoundItem.status`+`type`+`authorId` fields to prevent full-collection scans on filtered queries.
- **[P1] Array-index React keys:** Replaced 11 instances of array-index keys across 7 files (CareerRoadmaps, ChatThread, InterviewExperiences, PublicProfile, Resources, TeamFinder) with stable identifiers (`msg._id`, `step.order`, `round._id`, string-composite keys).
- **[P1] `hoverable` non-boolean attribute:** Destructured `hoverable` out of `Card.jsx` props spread and removed `hoverable` prop from Home.jsx Card usage to eliminate React DOM attribute warning.
- **[P2] Raw `<button>` in Login.jsx:** Replaced hand-rolled `<button>` with the shared `<Button>` component for design-system consistency.
- **[P2] Missing 404 page:** Added `NotFound.jsx` page component and wired it into App.jsx routing (replacing silent redirect to `/home`).
- **[P2] About.jsx behind ProtectedRoute:** Moved `/about` route outside `ProtectedRoute` so the static info page is accessible without login.
- **[P2] Missing `<h1>` headings:** Added proper `<h1>` to Home.jsx greeting and ChatThread.jsx heading for document structure compliance.
- **[P3] Unlabeled inputs:** Added `aria-label` attributes to 9 inputs in ProfileSettings.jsx and 8 inputs/selects in CompleteProfile.jsx for screen-reader accessibility.

### Added
- **[P1] MongoDB indexes for query performance:** Added `Post.communityId` index (queries at postRoutes, announcementRoutes, communityRoutes), `User.dept` and `User.currentCompany` indexes (alumni directory queries). 
- **[P1] Rate limiters for upvote and report endpoints:** Added `upvoteLimiter` (30req/min) and `reportLimiter` (5req/10min) to rateLimiter.js. Applied to all upvote (postRoutes, interviewExperienceRoutes, electiveRoutes, careerRoadmapRoutes) and report endpoints (postRoutes, reviewRoutes, electiveRoutes, careerRoadmapRoutes, marketplaceRoutes).
- **[P1] Pagination for referral, mock-interview, bookmark list endpoints:** Added `getPaginationParams` + `skip`/`limit` to `referralRoutes.js GET /`, `mockInterviewRoutes.js GET /`, and `bookmarkRoutes.js GET /`.

### Changed
- **[P1] Error format standardized to `{ error: { message } }`:** Standardized all 25 server route files and middleware to use the extensible error format. Simplified `axiosClient.js` normalization (removed mixed-format fallback, removed unused `toast` import).
- **[P1] Weekly digest N+1 elimination:** Refactored `digestService.js` to compute shared content pools (top posts, new resources, upcoming events) ONCE per run and filter in-memory per user instead of running 3 queries per user in a loop.
- **[P1] Marketplace consistency:** Replaced `window.location.href` with React Router `<Link>` for chat navigation (matching the 8-page dominant pattern).

### Fixed
- **[P1] 8 unused imports removed across client code:** Removed unused `useAuth`, `useNavigate`, `axiosClient`, `AlertTriangle`, `NavigationRoute` imports from Chats.jsx, Login.jsx, PersonalDrive.jsx, Home.jsx, ChatThread.jsx, PublicProfile.jsx, sw.js. Renamed unused `error` parameter in ErrorBoundary.jsx.
- **[Testing] Jest Configuration for ESM:** Added `jest.config.js` with `transform: {}` to fix ESM module parsing, enabling Jest to run the existing test suites. Updated `npm test` script with `--no-cache`. Tests were non-functional since their creation due to missing ESM configuration — the `--experimental-vm-modules` Node flag alone was insufficient without the `transform: {}` config. All 6 existing tests now pass.
- **[P0] Crash on missing CRON_SECRET:** Fixed `server/routes/jobRoutes.js:13` where `next(err)` referenced an undefined `err` variable when `CRON_SECRET` env var was unset. Now returns a clear 500 error message instead of crashing with `ReferenceError`.
- **[P0] Marketplace.jsx crash on report:** Fixed orphaned `try/await` block at `client/src/pages/Marketplace.jsx:97-103` by reconstructing the missing `handleReport`, `handleMarkSold`, and `handleMessageUser` function wrappers. The report/chat/sold buttons on the Marketplace page previously threw runtime errors when clicked.
- **[P0] Server-side unverified-alumni gate:** Added `server/middleware/requireApprovedUser.js` — a server-side middleware that blocks users with `role: 'alumni'` and `isVerifiedAlumni: false` from accessing any non-auth API route. Previously, the only protection was the frontend `PendingApproval` page, meaning unverified alumni could access all API features via direct calls. Mounted in `server/index.js` after auth routes. Added 5 tests covering all three cases (unverified blocked, verified allowed, student allowed, club_admin allowed).

### Added
- **[Phase 4] Global Error Boundary:** Added a top-level `ErrorBoundary` component to catch unexpected React rendering errors. Instead of a white screen of death, users now see a friendly fallback UI with a button to reload the page, containing the specific error trace for developers.
- **[Phase 4] PWA Offline Support:** Upgraded the Service Worker with Workbox caching strategies. API requests now use a Network-First strategy, Google Fonts use Cache-First, and navigating to un-cached pages while offline shows a custom offline fallback HTML page instead of the browser's dinosaur screen.

### Changed
- **[Deployment] Vercel Reverse Proxy (Third-Party Cookie Fix):** Migrated the API request path from cross-origin (browser → Render directly) to same-origin via a Vercel rewrite proxy (`/api/*` → Render backend). This makes the session cookie first-party, permanently fixing third-party cookie blocking on Safari, iOS, and future Chrome versions. Changed `axiosClient.js` default baseURL from absolute Render URL to relative `/api`. Changed session cookie `sameSite` from `'none'` to `'lax'` in production. Updated `DEPLOYMENT.md` with new architecture diagram, updated Google OAuth callback URL instructions (must use Vercel URL, not Render URL), and removed `VITE_API_URL` from required Vercel env vars. **Deployment action required:** see `DEPLOYMENT.md` §4 for updated steps.
- **[Phase 4] Global Auth Optimization:** Completely removed redundant `/auth/me` network calls from all 14+ feature pages. The application now exclusively relies on the global `AuthContext` to distribute user identity state, eliminating infinite reload loops on session expiry and drastically reducing initial page load times.
- **[Phase 4] Mobile Responsiveness Polish:** Applied comprehensive mobile CSS rules. Buttons now enforce a 44x44px minimum touch target for accessibility, text overflow is prevented on small screens via `word-break`, and grid layouts strictly collapse to 1-column below 600px.
- **[Phase 4] Standardized API Error Feedback:** Refactored `axiosClient` to normalize all 4xx/5xx error responses into a consistent string format, removing the aggressive global error interceptor that caused double-toasts. Frontend components now reliably display specific backend validation messages instead of generic fallbacks.

### Fixed
- **[Phase 4] Stuck Profile Completion Page:** Fixed a critical navigation bug where users were trapped on the complete-profile page even after a successful form submission because the global auth state was not being explicitly refreshed before redirecting.
- **[Phase 4] Mobile UI Clipping:** Fixed the notification dropdown width calculating incorrectly on small screens and clipping off the viewport edge. Also fixed the `ChatThread` message input box being pushed off-screen by the mobile keyboard by migrating from `80vh` to `100dvh`.
- **[Phase 3] Unified Date Formatting:** Refactored timestamp rendering in Personal Drive, Marketplace, and Lost & Found to use a consistent, human-readable locale format instead of the browser default.

### Fixed
- **[Phase 1] Feed Post Creation Crash:** Resolved a critical React runtime error inside the `useMentionSearch` hook. Removing an undefined call to `setActiveQuery` restored the ability to type into the post creation textarea without triggering a white screen of death.
- **[Phase 4] Navigation UI Glitch:** Fixed an issue where the mobile drawer and desktop sidebar were wasting vertical space. The Notifications bell and Logout button are now grouped side-by-side cleanly at the bottom.

### Added
- **[Phase 4] Progressive Web App (PWA):** Created `manifest.json`, added theme colors, and registered a base fetch service worker (`sw.js`). The app is now fully installable on mobile and desktop as a PWA.
- **[Phase 4] Global Sidebar Redesign:** Replaced the legacy horizontal `Navbar` with a responsive, persistent `Sidebar` wrapped in a new `AppLayout` component. It automatically collapses into a drawer on mobile screens. Removed manual navbar imports from all 25+ pages.
- **[Phase 4] Dashboard Redesign:** Transformed `Home.jsx` into a comprehensive dashboard featuring structured grids for Academics, Careers, and Campus Life, mapped to global design tokens.

### Fixed
- **[Phase 4 Security] Secret Leak Prevention:** Audited the entire codebase to guarantee no `mongodb+srv://` or AWS keys were hardcoded in scripts (`check-db.cjs`, migrations). Strengthened `AGENTS.md` and `DEPLOYMENT.md` to strictly enforce reading from `process.env`.
- **Full Codebase Audit (Part 4):**
  - **Error Handling:** Standardized `CastError` (invalid ObjectId) handling globally via `errorMiddleware.js` to return `400 Bad Request` instead of 500s. Fixed a missing error instance bug in `clubRoutes.js`.
  - **Race Conditions:** Refactored upvote endpoints (`postRoutes`, `interviewExperienceRoutes`, `electiveRoutes`, `careerRoadmapRoutes`) and bookmark toggles (`bookmarkRoutes`) to use atomic MongoDB operators (`$addToSet`, `$pull`, `findOneAndDelete`) instead of read-modify-write loops, preventing duplicates on concurrent double-submissions.
  - **Validation & Security:** Added `.trim()` validation to text inputs across core creation routes (`postRoutes`, `chatRoutes`, `lostFoundRoutes`) to prevent empty whitespace-only submissions. Restricted S3 presigned URL generation in `resourceRoutes.js` to an explicit allowlist of safe file types (PDF, JPEG, PNG, DOC/DOCX).
  - **Frontend Resiliency:** Standardized error extraction in `axiosClient.js` interceptor so that 500 Object responses from the server are flattened into safe strings, preventing a fatal React crash ("Objects are not valid as a React child").
  - **Global Rate Limiter:** Mounted a baseline `apiLimiter` globally in `server/index.js` to prevent generic abuse across non-mutating routes.
  - **Logging:** Cleaned up stray `console.log` statements in production services (`digestService`, `geminiService`, `notificationService`, `mailer`).
- **Pre-Deployment Bug Fixes (Part 4 Audit):** Fixed a backend crash where `MarketplaceItem.js` and `marketplaceRoutes.js` were using CommonJS syntax instead of ES Modules, breaking the production `npm start`. Removed an invalid import to a non-existent `authMiddleware` file and replaced it with inline `req.isAuthenticated()` checks, preventing API route failures.

## [Unreleased] - 2026-07-05

### Fixed
- **[Phase 2/3 Audit Fix] Security & Stability:** Applied regex escaping globally across all feature routes (`referralRoutes`, `mockInterviewRoutes`, `lostFoundRoutes`, `interviewExperienceRoutes`, `electiveRoutes`, `alumniRoutes`, `reviewRoutes`, `resourceRoutes`, `teamRequestRoutes`) to prevent database crashes from unescaped user query strings containing wildcards or brackets.

### Docs
- **Phase 2 & 3 Roadmap Refinement**: Updated `docs/MASTER_PLAN.md`. Removed the Roommate Finder feature entirely from Phase 3. Added future Razorpay integration note to Secondhand Marketplace. Added full specs, data models, and API surface for three new Phase 2 features: Interview Experience Repository (#34), Teammate Finder (#35), and Club Analytics (#36). Renumbered the Appendix sequentially.

### Added
- **[Phase 3] Secondhand Marketplace:** Implemented Feature #28. Created `MarketplaceItem` model and `/api/marketplace` routes. Built a frontend board for students to buy, sell, or exchange items (books, cycles, electronics). Sellers can list prices (or mark as free), while buyers can use the existing 1:1 chat feature to coordinate the transaction offline. Integrated with the centralized reporting system.
- **[Phase 3] Global UI/UX Redesign Rollout (Batch 1 & 2):** Implemented Feature #3a & 3b. Rolled out a centralized design system using vanilla CSS variables in `index.css`. Replaced all bespoke/ad-hoc layout elements (cards, buttons, inputs, selects, textareas, empty states) across all 18+ feed/list/form pages in the application with shared React components (`client/src/components/ui/`), applied standard `.page-col-wide` / `.page-col-feed` wrappers, and introduced unified loading/error empty states for all API fetches.
- **[Phase 3] Animation Strategy:** Implemented a controlled `.page-transition` fade-in animation applied globally to the root element of all page components. Ensured polling actions (e.g. `ChatThread`, `Chats`) and feed re-renders do not re-trigger the CSS animation, avoiding jarring UX.
- **[Phase 3] Lost & Found Board:** Implemented Feature #27. Created `LostFoundItem` model and `/api/lost-found` routes. Built a frontend board to browse, filter, and post lost/found items. Integrated the existing 1:1 chat pattern to allow users to message the poster directly without building new contact-exchange mechanisms. Added manual resolution functionality for item authors. Applied `postCreationLimiter` (10 requests / 10 minutes) to prevent spam. No anonymity by design, as the feature inherently requires identity resolution to exchange items.
- **[Phase 2] Mock Interview & Resume Review Pairing:** Implemented Feature #17. Created a dedicated board (`/mock-interviews`) where juniors can request 1:1 prep for specific companies, and verified alumni working at those companies can match with them. Integrates seamlessly with the existing real-time chat system for pairing.
- **[Phase 2] Personal Tracker (Bookmarks)**: Implemented Feature #22. Added a unified `/bookmarks` page for users to track their saved posts and resources. Includes polymorphic `Bookmark` model and toggle buttons on post and resource cards. Strict anonymity enforcement ensures anonymous post authors remain hidden in the bookmarks feed.
- **[Phase 2] Trending (Hot) Sort**: Implemented Feature #19. Added a `?sort=hot` query parameter to `/api/posts` using a MongoDB aggregation pipeline that gracefully decays engagement (`(upvotes + comments) / max(1, hours_since_creation)`) to rank trending posts.
- **[Phase 2] Course & Professor Reviews**: Implemented the full reviews system at `/reviews`. Added filtering by course, professor, and semester. Included a dynamic aggregate summary (average rating and total reviews) that computes over the filtered results.
- **Web Push Notifications:** Implemented Feature #21. Added `web-push` to handle server-side push messaging. Registered a Service Worker (`sw.js`) to display notifications. Added a toggle in `ProfileSettings` for users to opt-in to browser notifications. Push events hook seamlessly into the existing `notificationService`, firing on mentions and replies. Invalid/expired subscriptions (404/410) are automatically cleaned up from the database.
- **Weekly Digest Email:** Created `digestService.js` and a secured `POST /api/jobs/weekly-digest` endpoint. Generates a personalized weekly email containing top posts, new resources, and upcoming events from a user's relevant communities using the existing "hot score" ranking logic. Added `weeklyDigestOptIn` and `lastDigestSentAt` to the `User` model, with a toggle switch on the `ProfileSettings` frontend.
- **Career Roadmap Templates:** Created `CareerRoadmap` model and routes. Verified Alumni can publish step-by-step career roadmaps (e.g., SDE, PM, Core). Integrated an interactive, dynamic form for step creation in the frontend. Roadmaps are filterable by career path, reportable, upvotable, and integrated into the Moderation Queue.
- **NPTEL / Elective Suggestion Aggregator:** Created `ElectiveSuggestion` model and routes. Added an `/electives` board allowing users to share, filter, and upvote recommendations for NPTEL and college electives. Integrated into the global moderation queue.
- **Teammate Finder:** Scaffolded new `TeamRequest` model, built API routes (create, list, apply, close), and created a frontend board to browse and post team requests for hackathons, projects, and competitions. Integrated `applyTeamLimiter` to prevent application spam.
- **Club Analytics:** Added a read-only MongoDB aggregation route `GET /api/clubs/:id/analytics` restricted to club admins, returning total posts, upvotes, comments, and the top performing post. Exposed this via a new 'Analytics' tab on `ClubPage.jsx` for authorized users.
- **Interview Experience Repository:** Added new `InterviewExperience` model and routes with detailed rounds. Integrated into moderation queue and frontend. Built an explicit anonymity test to verify `authorId` is strictly dropped when `isAnonymous: true`.
- **[Phase 2] Reviews Moderation**: Integrated the `Review` model into the platform's central moderation queue. Users can report abusive reviews, and platform admins can resolve them alongside reported posts.
- **[Phase 2] Full Profile Pages**: Added `/profile/:username` for public profiles with configurable visibility settings. Logged-in users can update their profile information and privacy settings at `/settings/profile`.
- **[Phase 2] Data Model Extensions**: Added `username`, `graduationYear`, `currentCompany`, `previousCompany`, `higherEducation`, `about`, `skills`, `interests`, and `socialLinks` to the `User` model.
- **[Phase 2] Standardized Departments**: Transformed `dept` field into an exact strict enum and constrained `year` to integers `2000-2029`.
- **[Phase 2] Verified Alumni Identity**: Added `isVerifiedAlumni` flag tracking and introduced a globally shared `<VerifiedAlumniBadge />` that displays a green checkmark next to alumni names across the platform.
- **[Phase 2] Alumni Directory**: Created `/alumni` page and `GET /api/alumni` endpoint for students to browse and filter verified alumni by company and department.
- **[Phase 2] Referral Request Board**: Created `/referrals` page where students can post target companies, and verified alumni can instantly match and connect with them.
- **Referral Workflows**: Integrated `matchedAlumniId` and `status` tracking (`open`, `matched`, `closed`), empowering students to manually close their own requests after receiving help.
- **Global Auth Handling**: Added Axios interceptor to catch `401 Unauthorized` errors and automatically redirect to `/login` if the session expires.
- **Global User Feedback**: Installed `react-hot-toast` and replaced all generic `alert()` and silent feedback mechanisms with standardized toasts.
- **Loading States**: Implemented `isSubmitting`/`isUploading` disabled states for all destructive actions to prevent double-submissions.
- **Chat Notifications**: Integrated 1:1 message notifications in-app, enabling the recipient to instantly see message notifications in their notifications dropdown and navigate directly to the chat thread when clicked.
- **Deployment Readiness**: Upgraded `express-session` to use persistent MongoDB storage (`connect-mongo`), added production-grade cookie settings (`sameSite`), fixed environment variable names (`AWS_BUCKET_NAME`), and restored local `dev` concurrently script.
- **Shared UI Components**: Created vanilla CSS-based shared React components (`Button`, `Card`, `Badge`, `Spinner`, `Input`) in `client/src/components/ui/` to unify styling across the application.
- **[Deployment Hardening] SPA Routing on Vercel**: Added `vercel.json` to correctly rewrite Vercel edge routes to `index.html` to eliminate 404 errors on direct navigation.
- **[Deployment Hardening] Cross-Origin Cookies**: Explicitly configured Express `app.set('trust proxy', 1)` to allow `sameSite: none` secure cookies to be set correctly when the backend is hosted behind Render's load balancer.
- **[Deployment Hardening] Dynamic CORS**: Updated backend CORS configuration to dynamically match an array of local origins, the exact production origin, and a regular expression (`^https:\/\/takeuforward.*\.vercel\.app$`) to automatically whitelist all Vercel preview deployment URLs.
- **[Deployment Hardening] Defensiveness**: Systematically stripped trailing slashes in `server/routes/authRoutes.js`, `server/config/mailer.js`, and `client/src/api/axiosClient.js` wherever env var URLs are read.
- **[Docs] Deployment Checklist**: Created a permanent, reusable `docs/DEPLOYMENT_CHECKLIST.md` for pre- and post-deploy checks.

### Fixed
- **[Pre-Deployment Audit Fix] Error Handling**: Refactored all backend routes globally to use the centralized error middleware (`next(err)`) instead of explicitly sending `res.status(500)` in `catch` blocks, enforcing AGENTS.md code style compliance.
- **[Pre-Deployment Audit Fix] Rate Limiting**: Added `postCreationLimiter` to the `POST /api/resources` and `POST /api/resources/upload-url` endpoints to protect against S3/Supabase upload abuse.
- **[Phase 1/2 Audit Fix] Data Integrity**: Added required MongoDB indexes to `ReferralRequest` (`status`, `targetCompany`, `requesterId`, `matchedAlumniId`) and `Review` (`courseCode`, `professorName`, `semester`, `authorId`) models to ensure query performance scales.
- **[Phase 1/2 Audit Fix] Rate Limiting**: Applied `postCreationLimiter` to `POST /api/referrals` and `POST /api/referrals/:id/match` to close a spam vector.
- **[Phase 1/2 Audit Fix] UI Consistency**: Fixed non-existent CSS variables (`--card-bg`, `--input-bg`) in `Reviews.jsx` to match the global shared UI tokens.

### Changed
- **Status**: Officially finalized Phase 1 MVP completion and performed Vercel/Render deployment UI/UX polish audit.
- **Visual Consistency**: Refactored `Home`, `CommunityPosts`, `ModerationQueue`, `Resources`, `ClubPage`, `ClubsList`, `Announcements`, `Chats`, `ChatThread`, `Login`, and `CompleteProfile` to use the new shared UI components instead of ad-hoc inline styles.
- **UX**: Replaced all raw text `<div>Loading...</div>` placeholders with standard centered `<Spinner />` components for better UX during Render cold-starts.

### Fixed
- **CORS Deployment Blocker**: Added trailing-slash sanitization to the `CLIENT_URL` environment variable parser in `server/index.js` to ensure the CORS `Access-Control-Allow-Origin` header strictly matches the frontend origin without trailing slashes.
- **Route Guarding**: Created `<ProtectedRoute>` to accurately distinguish between network errors (e.g. CORS failures) and genuine 401 unauthenticated states, preventing unauthenticated users from seeing broken UI on `/home`.
- **UI/UX Consistency**: Standardized button styling, card padding, inputs, and typography globally.
- **Docs**: Created `docs/UI_UX_DEPLOYMENT_AUDIT.md` mapping out all deployment and visual consistency bugs and fixed them in Phase 2.

## [Phase 1 MVP - Previous]

### Added
- **Phase 1 MVP Audit & Fixes**: Completed a full end-to-end audit of all 14 MVP features, resolving 6 issues (including an anonymity leak, broken auth checks, and missing UI loading states).
- **1:1 Direct Messaging**: Polling-based secure messaging between two users (identified mode only). Rate limited.
- **Search & Filter**: Global post and resource search using text queries, department, year, course, and type filters.
- **Announcements Feed**: A dedicated global feed for all club and administrative announcements, filterable by category (event, placement, hackathon, workshop).
- **Phase 1 MVP Complete**: All 14 features of Phase 1 have now been implemented.
- Added `Navbar` component to house the brand, Notifications Bell, and Logout button globally
- Added `NotificationsDropdown` component for real-time in-app notification checking and marking as read
- Added `MentionTextarea` and `useMentionSearch` hook for frontend `@mention` autocomplete
- Passed actual post/comment content down through `notificationService` to include in the email body
- Added `Notification` model and endpoints for tracking mentions and replies
- Added `@mention` parsing logic in posts and comments, storing unique `handle` references
- Configured Nodemailer and integrated transactional emails for mentions and replies
- Implemented `express-rate-limit` to prevent spam on post/comment creation
- Added `isPlatformAdmin` role and `server/scripts/assignPlatformAdmin.js` script
- Added `GET /api/moderation/queue` and `POST /api/moderation/:postId/resolve` routes for moderation
- Created frontend `/moderation` page for platform admins to review reported posts
- Added `Club` model and routes (`GET /api/clubs`, `GET /api/clubs/:id`) for admin-managed club pages
- Extended `Post` model with `clubId` and `type: "announcement"` for club posts
- Added `POST /api/clubs/:id/posts` allowing designated club admins to post announcements to the General community
- Created frontend `/clubs` (list of all clubs) and `/clubs/:id` (club details with announcements and admin post form)
- Added `npm run seed:clubs` script to create sample clubs
- Added `npm run assign:admin` utility script to manually grant a user `club_admin` privileges for a specific club
- Updated `GET /api/posts` and `CommunityPosts` to correctly format and identify club announcements
- Upgraded Gemini AI Summarization to extract and read actual PDF file text instead of just relying on metadata
- Added `pdf-parse` to backend to fetch S3 file bytes and parse text content for the Gemini prompt
- Integrated `@google/generative-ai` for automatic resource summarization
- Updated `POST /api/resources` to asynchronously call Gemini with metadata to generate an `aiSummary` with graceful fallback
- Added frontend rendering for the `aiSummary` field on the `/resources` page
- Implemented `Resource` model for academic materials (notes, PYQs)
- Added `POST /api/resources/upload-url` to generate AWS S3 presigned URLs for direct uploads
- Added `POST /api/resources` and `GET /api/resources` for resource metadata tracking and filtering
- Added `/resources` frontend page to handle direct-to-S3 uploads and resource listing
- Implemented embedded Post comments with independent anonymity stripping
- Added `POST /api/posts/:id/comment` for adding new comments
- Added `POST /api/posts/:id/upvote` to toggle upvotes on a post
- Added `POST /api/posts/:id/report` for reporting posts, with automatic `isHidden` trigger at 3+ reports
- Updated frontend `/community/:id` page with comment lists, comment creation, upvote toggling, and reporting UI
- Added `assignDefaultCommunity` helper to match `dept` and `year` to batch communities
- Added `PATCH /api/auth/profile` route for updating department and year post-signup
- Added `/complete-profile` frontend page to collect required `dept` and `year` info
- Updated `GET /api/auth/me` to include a `profileComplete` boolean flag
- Updated frontend routing to redirect to `/complete-profile` if `profileComplete` is false
- Created `Community` model (dept, batch, general, topic)
- Added GET `/api/communities` and GET `/api/communities/:id` routes
- Added `/server/scripts/seedCommunities.js` and `npm run seed:communities` script
- Modified `User` model to include `defaultCommunityId` and auto-set it on signup if dept/year matched
- Updated frontend Home page to display a live list of Communities
- Implemented Alumni Whitelist and invite token system
- Added `ApprovedAlumniEmail` model
- Added `POST /api/auth/alumni/invite` and `GET /api/auth/alumni/invite/:token` routes
- Added `/alumni-invite/:token` frontend page to verify tokens
- Implemented Google OAuth end-to-end for students with domain restriction (express-session based)
- Added /api/auth/me route to fetch logged-in user details
- Base project scaffolding with React/Vite (client) and Node/Express (server)
- Concurrently script in root package.json to run both client and server
- Centralized error middleware and MongoDB connection in server
- Initial User model based on section 10 of MASTER_PLAN
- Passport Google OAuth stub and auth routes in server
- Axios client and basic Login/Home pages in React
- ESLint configuration in both client and server

### Changed
-

### Fixed
-
