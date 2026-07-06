# Feature Tracker

Live status of every feature from the Master Plan. Update this whenever a feature's
status changes — this is the single place to check "is X actually done" without
digging through commits.

Status values: Not Started / In Progress / Done / Blocked

## Phase 1: MVP & Core Systems
**Status: ✅ COMPLETED, AUDITED, AND POLISHED**
*(Note: As of July 2026, all Phase 1 features have been built, rigorously audited, and received a full UI/UX deployment polish pass. Systemic bugs identified in the pre-deployment audit (error handling middleware violation, missing rate limiters) have been resolved globally. The platform is ready for Phase 2.)*

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Google OAuth (SSN-restricted + alumni whitelist) | 1 | Done | | server/config/passport.js, server/routes/authRoutes.js, server/models/ApprovedAlumniEmail.js | 2026-07-05 |
| Role & Profile System | 1 | Done | | server/models/User.js, client/src/pages/CompleteProfile.jsx | 2026-07-05 |
| Sub-Community Feed Structure | 1 | Done | | server/models/Community.js, server/routes/communityRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Discussion/Q&A Posts | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js | 2026-07-05 |
| Anonymity Engine | 1 | Done (Tested) | | server/routes/postRoutes.js, server/tests/anonymity.test.js | 2026-07-05 |
| Comments & Upvotes | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Academic Resource Repository | 1 | Done (Upload/List/Summarization/Extraction) | | server/models/Resource.js, server/routes/resourceRoutes.js, server/services/geminiService.js | 2026-07-05 |
| Club Pages | 1 | Done | | server/models/Club.js, server/routes/clubRoutes.js, client/src/pages/ClubsList.jsx, client/src/pages/ClubPage.jsx | 2026-07-05 |
| Announcements Feed | 1 | Done | | server/routes/announcementRoutes.js, client/src/pages/Announcements.jsx | 2026-07-05 |
| 1:1 Direct Messaging (polling) | 1 | Done | | server/models/Chat.js, server/routes/chatRoutes.js, client/src/pages/Chats.jsx | 2026-07-05 |
| Report/Moderation Queue | 1 | Done | | server/routes/moderationRoutes.js, client/src/pages/ModerationQueue.jsx | 2026-07-05 |
| Search & Filter | 1 | Done | | client/src/components/SearchFilterBar.jsx, server/routes/postRoutes.js | 2026-07-05 |
| Email Notifications | 1 | Done | | server/config/mailer.js, server/services/notificationService.js | 2026-07-05 |
| @Mentions | 1 | Done | | server/models/Notification.js, server/routes/postRoutes.js | 2026-07-05 |

## Phase 2: Professional Networking & Growth
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Verified Alumni Directory | 2 | Done | | server/routes/alumniRoutes.js, client/src/pages/AlumniDirectory.jsx | 2026-07-05 |
| Referral Request Board | 2 | Done | | server/models/ReferralRequest.js, server/routes/referralRoutes.js, client/src/pages/ReferralBoard.jsx | 2026-07-05 |
| Full Profile Pages | 2 | Done | | server/routes/userRoutes.js, client/src/pages/PublicProfile.jsx, client/src/pages/ProfileSettings.jsx | 2026-07-05 |
| Mock Interview / Resume Review Pairing | 2 | Done | | server/models/MockInterviewRequest.js, server/routes/mockInterviewRoutes.js, client/src/pages/MockInterviews.jsx | 2026-07-05 |
| Interview Experience Repository | 2 | Done | | server/models/InterviewExperience.js, server/routes/interviewExperienceRoutes.js, client/src/pages/InterviewExperiences.jsx | 2026-07-05 |
| NPTEL / Elective Suggestion Aggregator | 2 | Done | | server/models/ElectiveSuggestion.js, server/routes/electiveRoutes.js, client/src/pages/Electives.jsx | 2026-07-05 |
| Career Roadmap Templates | 2 | Done | | server/models/CareerRoadmap.js, server/routes/careerRoadmapRoutes.js, client/src/pages/CareerRoadmaps.jsx | 2026-07-05 |
| Weekly Digest Email | 2 | Done | | server/services/digestService.js, server/routes/jobRoutes.js, server/models/User.js, client/src/pages/ProfileSettings.jsx | 2026-07-05 |
| Web Push Notifications | 2 | Done | | server/routes/pushRoutes.js, server/services/notificationService.js, client/public/sw.js | 2026-07-05 |
| Teammate Finder | 2 | Done | | server/models/TeamRequest.js, server/routes/teamRequestRoutes.js, client/src/pages/TeamFinder.jsx | 2026-07-05 |
| Club Analytics | 2 | Done | | server/routes/clubRoutes.js, client/src/pages/ClubPage.jsx | 2026-07-05 |
| Course & Professor Reviews | 2 | Done | | server/models/Review.js, server/routes/reviewRoutes.js, client/src/pages/Reviews.jsx | 2026-07-06 |
| Trending (Hot) Sort | 2 | Done | | server/routes/postRoutes.js, client/src/components/SearchFilterBar.jsx | 2026-07-06 |
| Personal Tracker (Bookmarks) | 2 | Done | | server/models/Bookmark.js, server/routes/bookmarkRoutes.js, client/src/pages/Bookmarks.jsx | 2026-07-06 |

## Phase 3: Campus Utility Expansion
**Status: 🏗 IN PROGRESS**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Lost & Found Board | 3 | Done | | server/models/LostFoundItem.js, server/routes/lostFoundRoutes.js, client/src/pages/LostFound.jsx | 2026-07-05 |
| Secondhand Marketplace | 3 | Done | | server/models/MarketplaceItem.js, server/routes/marketplaceRoutes.js, client/src/pages/Marketplace.jsx | 2026-07-06 |

## Phase 4: UI/UX & PWA
**Status: ✅ COMPLETED**

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Sidebar Migration & AppLayout | 4 | Done | | client/src/components/Sidebar.jsx, client/src/components/AppLayout.jsx, client/src/App.jsx | 2026-07-06 |
| Dashboard Redesign (Home.jsx) | 4 | Done | | client/src/pages/Home.jsx | 2026-07-06 |
| Progressive Web App (PWA) | 4 | Done | | client/public/manifest.json, client/public/sw.js, client/index.html | 2026-07-06 |
| Pre-Deployment Audit & Security | 4 | Done | | AGENTS.md, docs/DEPLOYMENT.md, docs/CHANGELOG.md | 2026-07-06 |