# Feature Tracker

Live status of every feature from the Master Plan. Update this whenever a feature's
status changes — this is the single place to check "is X actually done" without
digging through commits.

Status values: Not Started / In Progress / Done / Blocked

## Phase 1: MVP & Core Systems
**Status: ✅ COMPLETED, AUDITED, AND POLISHED**
*(Note: As of July 2026, all Phase 1 features have been built, rigorously audited, and received a full UI/UX deployment polish pass. Systemic bugs identified in the pre-deployment audit (error handling middleware violation, missing rate limiters) have been resolved globally. As of 2026-07-10: Jest ESM config fixed (tests now run), unverified-alumni server-side gate added (closing client-side-only protection gap), 3 P0 bugs fixed. 11 tests pass across 3 suites.)*

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Google OAuth (SSN-restricted + alumni whitelist) | 1 | Done | | server/config/passport.js, server/routes/authRoutes.js, server/middleware/requireApprovedUser.js, server/models/ApprovedAlumniEmail.js | 2026-07-10 |
| Alumni Registration Request Flow | 1 | Done | | server/routes/authRoutes.js, server/routes/moderationRoutes.js, client/src/pages/Login.jsx, client/src/pages/ModerationQueue.jsx | 2026-07-10 |
| Role & Profile System | 1 | Done | | server/models/User.js, client/src/pages/CompleteProfile.jsx | 2026-07-05 |
| Sub-Community Feed Structure | 1 | Done | | server/models/Community.js, server/routes/communityRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Discussion/Q&A Posts | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js | 2026-07-05 |
| Anonymity Engine | 1 | Done (Tested) | | server/routes/postRoutes.js, server/utils/anonymity.js, server/tests/anonymity.test.js, server/tests/alumniGate.test.js | 2026-07-10 |
| Comments & Upvotes | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Academic Resource Repository | 1 | Done (Upload/List/Summarization/Extraction) | | server/models/Resource.js, server/routes/resourceRoutes.js, server/services/geminiService.js | 2026-07-05 |
| Club Pages | 1 | Done | | server/models/Club.js, server/routes/clubRoutes.js, client/src/pages/ClubsList.jsx, client/src/pages/ClubPage.jsx | 2026-07-05 |
| Announcements Feed | 1 | Done | | server/routes/announcementRoutes.js, client/src/pages/Announcements.jsx | 2026-07-05 |
| 1:1 Direct Messaging (polling) | 1 | Done | | server/models/Chat.js, server/routes/chatRoutes.js, client/src/pages/Chats.jsx | 2026-07-05 |
| Report/Moderation Queue | 1 | Done (Tested) | | server/routes/moderationRoutes.js, client/src/pages/ModerationQueue.jsx | 2026-07-10 |
| Search & Filter | 1 | Done | | client/src/components/SearchFilterBar.jsx, server/routes/postRoutes.js | 2026-07-05 |
| Email Notifications | 1 | Done | | server/config/mailer.js, server/services/notificationService.js | 2026-07-05 |
| @Mentions | 1 | Done | | server/models/Notification.js, server/routes/postRoutes.js | 2026-07-05 |

## Phase 2: Professional Networking & Growth
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Verified Alumni Directory | 2 | Done | | server/routes/alumniRoutes.js, client/src/pages/AlumniDirectory.jsx | 2026-07-05 |
| Referral Request Board | 2 | Done (Tested) | | server/models/ReferralRequest.js, server/routes/referralRoutes.js, client/src/pages/ReferralBoard.jsx | 2026-07-10 |
| Full Profile Pages | 2 | Done | | server/routes/userRoutes.js, client/src/pages/PublicProfile.jsx, client/src/pages/ProfileSettings.jsx | 2026-07-09 |
| Mock Interview / Resume Review Pairing | 2 | Done (Tested) | | server/models/MockInterviewRequest.js, server/routes/mockInterviewRoutes.js, client/src/pages/MockInterviews.jsx | 2026-07-10 |
| Interview Experience Repository | 2 | Done (Tested) | | server/models/InterviewExperience.js, server/routes/interviewExperienceRoutes.js, client/src/pages/InterviewExperiences.jsx | 2026-07-10 |
| NPTEL / Elective Suggestion Aggregator | 2 | Done | | server/models/ElectiveSuggestion.js, server/routes/electiveRoutes.js, client/src/pages/Electives.jsx | 2026-07-05 |
| Career Roadmap Templates | 2 | Done | | server/models/CareerRoadmap.js, server/routes/careerRoadmapRoutes.js, client/src/pages/CareerRoadmaps.jsx | 2026-07-05 |
| Weekly Digest Email | 2 | Done | | server/services/digestService.js, server/routes/jobRoutes.js, server/models/User.js, client/src/pages/ProfileSettings.jsx | 2026-07-05 |
| Web Push Notifications | 2 | Done | | server/routes/pushRoutes.js, server/services/notificationService.js, client/public/sw.js | 2026-07-05 |
| Teammate Finder | 2 | Done (Tested) | | server/models/TeamRequest.js, server/routes/teamRequestRoutes.js, client/src/pages/TeamFinder.jsx | 2026-07-10 |
| Club Analytics | 2 | Done (Tested) | | server/routes/clubRoutes.js, client/src/pages/ClubPage.jsx | 2026-07-10 |
| Course & Professor Reviews | 2 | Done (Tested) | | server/models/Review.js, server/routes/reviewRoutes.js, client/src/pages/Reviews.jsx | 2026-07-10 |
| Trending (Hot) Sort | 2 | Done | | server/routes/postRoutes.js, client/src/components/SearchFilterBar.jsx | 2026-07-06 |
| Personal Tracker (Bookmarks) | 2 | Done | | server/models/Bookmark.js, server/routes/bookmarkRoutes.js, client/src/pages/Bookmarks.jsx | 2026-07-06 |

## Phase 3: Campus Utility Expansion
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Lost & Found Board | 3 | Done (Tested) | | server/models/LostFoundItem.js, server/routes/lostFoundRoutes.js, client/src/pages/LostFound.jsx | 2026-07-10 |
| Secondhand Marketplace | 3 | Done (Tested) | | server/models/MarketplaceItem.js, server/routes/marketplaceRoutes.js, client/src/pages/Marketplace.jsx | 2026-07-10 |

## Phase 4: UI/UX & PWA
**Status: ✅ COMPLETED**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Sidebar Migration & AppLayout | 4 | Done | | client/src/components/Sidebar.jsx, client/src/components/AppLayout.jsx, client/src/App.jsx | 2026-07-09 |
| Dashboard Redesign (Home.jsx) | 4 | Done | | client/src/pages/Home.jsx | 2026-07-09 |
| Progressive Web App (PWA) | 4 | Done | | client/vite.config.js, client/src/sw.js | 2026-07-09 |
| Pre-Deployment Audit & Security | 4 | Done | | AGENTS.md, docs/DEPLOYMENT.md, docs/CHANGELOG.md, server/middleware/requireApprovedUser.js, server/models/Notification.js, server/models/Resource.js, server/models/LostFoundItem.js | 2026-07-10 |
| Production Readiness — Part 3 | 4 | Done | | server/models/Post.js, server/models/User.js, server/routes/referralRoutes.js, server/routes/mockInterviewRoutes.js, server/routes/bookmarkRoutes.js, server/middleware/rateLimiter.js, server/services/digestService.js, all server routes, client/src/api/axiosClient.js, client/src/pages/Marketplace.jsx | 2026-07-10 |
| Jest ESM Configuration | 1 | Done (Tested) | | server/jest.config.js, server/tests/anonymity.test.js, server/tests/chat.test.js, server/tests/alumniGate.test.js | 2026-07-10 |
| Playwright Critical-Path E2E | 4 | Done (Tested) | | playwright.config.js, e2e/critical-path.spec.js | 2026-07-10 |
| Production Readiness — Part 4 (A/A2-7/B/C/D/E) | 4 | Done | | 15 files, see CHANGELOG | 2026-07-10 |