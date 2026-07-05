# Feature Tracker

Live status of every feature from the Master Plan. Update this whenever a feature's
status changes — this is the single place to check "is X actually done" without
digging through commits.

Status values: Not Started / In Progress / Done / Blocked

## Phase 1: MVP & Core Systems
**Status: ✅ COMPLETED, AUDITED, AND POLISHED**
*(Note: As of July 2026, all Phase 1 features have been built, rigorously audited, and received a full UI/UX deployment polish pass. The platform is ready for Phase 2.)*

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