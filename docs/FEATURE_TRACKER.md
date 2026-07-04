# Feature Tracker

Live status of every feature from the Master Plan. Update this whenever a feature's
status changes — this is the single place to check "is X actually done" without
digging through commits.

Status values: Not Started / In Progress / Done / Blocked

| Feature | Phase | Status | Owner | Files | Last Updated |
|---|---|---|---|---|---|
| Google OAuth (SSN-restricted + alumni whitelist) | 1 | Done | | server/config/passport.js, server/routes/authRoutes.js, server/models/ApprovedAlumniEmail.js | 2026-07-05 |
| Role & Profile System | 1 | In Progress (Profile completion flow built) | | server/models/User.js, client/src/pages/CompleteProfile.jsx | 2026-07-05 |
| Sub-Community Feed Structure | 1 | Done | | server/models/Community.js, server/routes/communityRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Discussion/Q&A Posts | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js | 2026-07-05 |
| Anonymity Engine | 1 | Done (Tested) | | server/routes/postRoutes.js, server/tests/anonymity.test.js | 2026-07-05 |
| Comments & Upvotes | 1 | Done | | server/models/Post.js, server/routes/postRoutes.js, client/src/pages/CommunityPosts.jsx | 2026-07-05 |
| Academic Resource Repository | 1 | Done (Core Upload/List) | | server/models/Resource.js, server/routes/resourceRoutes.js, client/src/pages/Resources.jsx | 2026-07-05 |
| Club Pages | 1 | Not Started | | | |
| Announcements Feed | 1 | Not Started | | | |
| 1:1 Direct Messaging (polling) | 1 | Not Started | | | |
| Report/Moderation Queue | 1 | Not Started | | | |
| Search & Filter | 1 | Not Started | | | |
| Email Notifications | 1 | Not Started | | | |
| @Mentions | 1 | Not Started | | | |