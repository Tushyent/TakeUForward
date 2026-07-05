# Changelog

All notable changes to this project are logged here, newest first.
Every commit that adds/changes a feature should have a matching entry here.
Have orderwise log either based on filewise, or changes did in the codebase.
Format: Keep a Changelog style — Added / Changed / Fixed / Removed.

## [Unreleased]

### Fixed
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
- **[Phase 3] Global UI/UX Redesign Rollout:** Implemented Feature #3a & 3b. Rolled out a centralized design system using vanilla CSS variables in `index.css`. Replaced all bespoke/ad-hoc layout elements (cards, buttons, inputs, selects, textareas, empty states) across all 18+ feed/list/form pages in the application with shared React components (`client/src/components/ui/`).
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