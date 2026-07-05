# Changelog

All notable changes to this project are logged here, newest first.
Every commit that adds/changes a feature should have a matching entry here.
Have orderwise log either based on filewise, or changes did in the codebase.
Format: Keep a Changelog style — Added / Changed / Fixed / Removed.

## [Unreleased] - 2026-07-05

### Added
- **Global Auth Handling**: Added Axios interceptor to catch `401 Unauthorized` errors and automatically redirect to `/login` if the session expires.
- **Global User Feedback**: Installed `react-hot-toast` and replaced all generic `alert()` and silent feedback mechanisms with standardized toasts.
- **Loading States**: Implemented `isSubmitting`/`isUploading` disabled states for all destructive actions to prevent double-submissions.
- **Chat Notifications**: Integrated 1:1 message notifications in-app, enabling the recipient to instantly see message notifications in their notifications dropdown and navigate directly to the chat thread when clicked.

### Changed
- **Status**: Officially finalized Phase 1 MVP completion.

### Fixed
- **UI/UX Consistency**: Standardized button styling in `CommunityPosts.jsx` and `ModerationQueue.jsx`.
- **Docs**: Consolidated `AUDIT_2026-07.md` and `AUDIT_2026-07-FINAL.md` into one definitive final audit document.

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