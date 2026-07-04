# Changelog

All notable changes to this project are logged here, newest first.
Every commit that adds/changes a feature should have a matching entry here.
Have orderwise log either based on filewise, or changes did in the codebase.
Format: Keep a Changelog style — Added / Changed / Fixed / Removed.

## [Unreleased]

### Added
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