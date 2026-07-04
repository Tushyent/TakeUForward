# Changelog

All notable changes to this project are logged here, newest first.
Every commit that adds/changes a feature should have a matching entry here.
Have orderwise log either based on filewise, or changes did in the codebase.
Format: Keep a Changelog style — Added / Changed / Fixed / Removed.

## [Unreleased]

### Added
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