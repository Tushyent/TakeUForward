# Feature Tracker

Live status of every feature from the Master Plan. Update this whenever a feature's
status changes — this is the single place to check "is X actually done" without
digging through commits.

Status values: Not Started / In Progress / Done / Blocked

## Phase 1: MVP & Core Systems
**Status: ✅ COMPLETED, AUDITED, AND POLISHED**
*(Note: As of 2026-07-13, a final full code-level E2E verification pass was executed covering Auth, Core Content, Clubs, Moderation, Push Notifications, and Email Systems (SendGrid). All Phase 1, Phase 2, and Phase 3 mutating endpoints were audited and are strictly guarded with rate limiters and server-side authorization. UI/UX text-wrapping and mobile layouts verified. Fully ready for deployment.)*

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Google OAuth (SSN-restricted + alumni whitelist + fixed system admin) | 1 | Done | | server/config/passport.js, server/routes/authRoutes.js, server/middleware/requireApprovedUser.js, server/middleware/requireSystemAdmin.js, server/models/ApprovedAlumniEmail.js | 2026-07-11 |
| Alumni Registration Request Flow | 1 | Done | | server/routes/authRoutes.js, server/routes/moderationRoutes.js, client/src/pages/Login.jsx, client/src/pages/ModerationQueue.jsx | 2026-07-10 |
| Role & Profile System | 1 | Done | | server/models/User.js, server/utils/userIdentity.js, client/src/pages/CompleteProfile.jsx (+welcome toast) | 2026-07-12 |
| Sub-Community Feed Structure | 1 | Done | | server/models/Community.js, server/routes/communityRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Discussion/Q&A Posts | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js | 2026-07-05 |
| Anonymity Engine | 1 | Done (Tested) | | server/routes/postRoutes.js, server/utils/anonymity.js, server/tests/anonymity.test.js, server/tests/alumniGate.test.js | 2026-07-10 |
| Comments & Upvotes | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Academic Resource Repository | 1 | Done (Upload/List/Summarization/Extraction) | | server/models/Resource.js, server/routes/resourceRoutes.js, server/services/geminiService.js | 2026-07-05 |
| Club Pages | 1 | Done | | server/models/Club.js, server/routes/clubRoutes.js, client/src/pages/ClubsList.jsx (autocomplete search), client/src/pages/ClubPage.jsx | 2026-07-12 |
| Announcements Feed | 1 | Done (Retested) | | server/routes/announcementRoutes.js, server/routes/clubRoutes.js, client/src/pages/Announcements.jsx, client/src/pages/ClubPage.jsx | 2026-07-11 |
| 1:1 Direct Messaging (polling) | 1 | Done | | server/models/Chat.js, server/routes/chatRoutes.js, client/src/pages/Chats.jsx | 2026-07-05 |
| Report/Moderation Queue | 1 | Done (System Admin Only) | | server/routes/moderationRoutes.js, server/middleware/requireSystemAdmin.js, client/src/pages/ModerationQueue.jsx | 2026-07-11 |
| Search & Filter | 1 | Done | | client/src/components/SearchFilterBar.jsx, server/routes/postRoutes.js | 2026-07-05 |
| Email Notifications | 1 | Done (SendGrid) | | server/config/mailer.js, server/services/SendGridService.js, server/services/notificationService.js, server/models/Notification.js | 2026-07-12 |
| @Mentions | 1 | Done (Email Handle Based, Deep Linked) | | server/models/Notification.js, server/routes/postRoutes.js, server/routes/clubRoutes.js, server/routes/userRoutes.js, server/utils/userIdentity.js | 2026-07-11 |

## Phase 2: Professional Networking & Growth
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Verified Alumni Directory | 2 | Done | | server/routes/alumniRoutes.js, client/src/pages/AlumniDirectory.jsx | 2026-07-05 |
| Referral Request Board | 2 | Done (Tested) | | server/models/ReferralRequest.js, server/routes/referralRoutes.js, client/src/pages/ReferralBoard.jsx | 2026-07-10 |
| Full Profile Pages | 2 | Done | | server/routes/userRoutes.js, client/src/pages/PublicProfile.jsx, client/src/pages/ProfileSettings.jsx | 2026-07-09 |
| Mock Interview / Resume Review Pairing | 2 | Done (Tested) | | server/models/MockInterviewRequest.js, server/routes/mockInterviewRoutes.js, client/src/pages/MockInterviews.jsx | 2026-07-10 |
| Interview Experience Repository | 2 | Done (Retested) | | server/models/InterviewExperience.js, server/routes/interviewExperienceRoutes.js, client/src/pages/InterviewExperiences.jsx | 2026-07-11 |
| NPTEL / Elective Suggestion Aggregator | 2 | Done (Retested) | | server/models/ElectiveSuggestion.js, server/routes/electiveRoutes.js, client/src/pages/Electives.jsx | 2026-07-11 |
| Career Roadmap Templates | 2 | Done | | server/models/CareerRoadmap.js, server/routes/careerRoadmapRoutes.js, client/src/pages/CareerRoadmaps.jsx | 2026-07-05 |
| Weekly Digest Email | 2 | Done | | server/services/digestService.js, server/routes/jobRoutes.js, server/models/User.js, client/src/pages/ProfileSettings.jsx | 2026-07-05 |
| Web Push Notifications | 2 | Done | | server/routes/pushRoutes.js, server/services/notificationService.js, client/public/sw.js | 2026-07-05 |
| Teammate Finder | 2 | Done (Tested) | | server/models/TeamRequest.js, server/routes/teamRequestRoutes.js, client/src/pages/TeamFinder.jsx | 2026-07-10 |
| Club Analytics | 2 | Done (Tested) | | server/routes/clubRoutes.js, client/src/pages/ClubPage.jsx | 2026-07-10 |
| Course & Professor Reviews | 2 | Done (Tested) | | server/models/Review.js, server/routes/reviewRoutes.js, client/src/pages/Reviews.jsx | 2026-07-10 |
| Trending (Hot) Sort | 2 | Done | | server/routes/postRoutes.js, client/src/components/SearchFilterBar.jsx | 2026-07-06 |
| Personal Tracker (Bookmarks) | 2 | Done (Retested) | | server/models/Bookmark.js, server/routes/bookmarkRoutes.js, client/src/pages/Bookmarks.jsx | 2026-07-11 |
| Support / Feedback System | 2 | Done (System Admin Queue) | | server/models/SupportTicket.js, server/routes/supportRoutes.js, client/src/pages/Support.jsx, client/src/pages/AdminSupportQueue.jsx | 2026-07-11 |

## Cross-Cutting Admin & Operations

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| System Admin Dashboard | Ops | Done (Polished) | | server/routes/adminRoutes.js (+signups feed), server/middleware/requireSystemAdmin.js, client/src/pages/AdminDashboard.jsx (+Recent Signups), client/src/App.jsx | 2026-07-13 |
| Seed: Welcome Announcement | 1 | Done | | server/scripts/seedAnnouncement.js | 2026-07-12 |
| Seed: Career Roadmaps | 2 | Done | | server/scripts/seedRoadmaps.js | 2026-07-12 |
| Community Browse Page | 4 | Done | | client/src/pages/CommunityBrowse.jsx, client/src/constants/navigation.js, client/src/App.jsx | 2026-07-12 |
| Search Autocomplete (Clubs) | 4 | Done | | client/src/pages/ClubsList.jsx | 2026-07-12 |
| About Page Revamp | 4 | Done | | client/src/pages/About.jsx | 2026-07-12 |
| Feedback CTA / Home Support | 4 | Done | | client/src/pages/Home.jsx | 2026-07-12 |
| Explicit MongoDB Database Name | Ops | Done | | server/config/db.js, server/index.js, server/.env.example, server/scripts/ensureSystemAdmin.js | 2026-07-11 |
| Dedicated Notifications Page | 4 | Done | | client/src/pages/NotificationsPage.jsx, client/src/components/NotificationsDropdown.jsx, client/src/App.jsx | 2026-07-13 |

## Phase 3: Campus Utility Expansion
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Lost & Found Board | 3 | Done (Tested) | | server/models/LostFoundItem.js, server/routes/lostFoundRoutes.js, client/src/pages/LostFound.jsx | 2026-07-10 |
| Secondhand Marketplace | 3 | Done (Retested) | | server/models/MarketplaceItem.js, server/routes/marketplaceRoutes.js, client/src/pages/Marketplace.jsx | 2026-07-11 |

## Phase 4: UI/UX & PWA
**Status: ✅ COMPLETED**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Sidebar Migration & AppLayout | 4 | Done | | client/src/components/Sidebar.jsx, client/src/components/AppLayout.jsx, client/src/App.jsx | 2026-07-09 |
| Dashboard Redesign (Home.jsx) | 4 | Done | | client/src/pages/Home.jsx | 2026-07-09 |
| Progressive Web App (PWA) | 4 | Done | | client/vite.config.js (PNG icons, orientation, scope, start_url), client/src/sw.js | 2026-07-12 |
| Pre-Deployment Audit & Security | 4 | Done | | AGENTS.md, docs/DEPLOYMENT.md, docs/CHANGELOG.md, server/index.js, server/middleware/requireApprovedUser.js, server/models/Notification.js, server/models/Resource.js, server/models/LostFoundItem.js | 2026-07-11 |
| Production Readiness — Part 3 | 4 | Done | | server/models/Post.js, server/models/User.js, server/routes/referralRoutes.js, server/routes/mockInterviewRoutes.js, server/routes/bookmarkRoutes.js, server/middleware/rateLimiter.js, server/services/digestService.js, all server routes, client/src/api/axiosClient.js, client/src/pages/Marketplace.jsx | 2026-07-10 |
| Jest ESM Configuration | 1 | Done (Tested) | | server/jest.config.js, server/tests/anonymity.test.js, server/tests/chat.test.js, server/tests/alumniGate.test.js | 2026-07-10 |
| Playwright Critical-Path E2E | 4 | Done (Tested) | | playwright.config.js, e2e/critical-path.spec.js | 2026-07-10 |
| Production Readiness — Part 4 (A/A2-7/B/C/D/E) | 4 | Done | | 15 files, see CHANGELOG | 2026-07-10 |
