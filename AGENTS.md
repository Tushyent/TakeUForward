# AGENTS.md — TakeUForward

## Project
Full-stack campus mentorship platform. See /docs/MASTER_PLAN.md or the /docs/TakeUForward_MasterPlan file for full product spec —
read it before implementing any feature not yet scaffolded.
/docs/FRONTEND.md is the file you should refer to for frontend related tasks.
/docs/BACKEND.md is the file you should refer to for backend related tasks.

## Stack (do not substitute without asking)
- Frontend: React + Vite, JavaScript, React Router, Axios — in /client
- Backend: Node.js + Express — in /server
- DB: MongoDB Atlas via Mongoose
- Auth: Passport.js Google OAuth 2.0
- Storage: AWS S3 (presigned URLs) — Supabase Storage is the approved fallback if S3 blocks progress
- Real-time: polling for MVP chat; Socket.io is the approved Phase 2 upgrade, not before

## Commands (use these exact commands, do not invent alternatives)
- Install: `npm install` (run in both /client and /server)
- Run dev (both): `npm run dev` from repo root (concurrently)
- Run server only: `npm run dev` in /server
- Run client only: `npm run dev` in /client
- Lint: `npm run lint` in each package — must pass with zero errors before any commit
- Test: `npm test` in /server (Jest), `npx playwright test` at root (E2E)

## Non-negotiable rules
1. **Never fabricate.** If you don't know whether a package, env var, endpoint, or field
   exists in this repo, check the actual file before answering or writing code that
   assumes it. Do not invent API responses, library methods, or config values that
   "seem right." If unsure, say so and ask, don't guess.
2. **Never commit secrets (CRITICAL).** `.env` is gitignored — never write real credentials 
   (like MongoDB URIs, AWS keys, or JWT secrets) into ANY tracked file, including test scripts, 
   migration scripts, or one-off checks like `check-db.cjs`. Always use `process.env.VARIABLE_NAME`. 
   If you need to test a connection, load it from the `.env` file. Leaking a URI/key is a 
   critical failure. Use `.env.example` with placeholder values only.
3. **Anonymity is a security requirement, not a UI feature.** When `isAnonymous: true`
   on a post/comment, `authorId` must be stripped server-side before the response
   is serialized — never filtered client-side only. Any change touching posts/comments
   must include a test proving this.
4. **No silent architecture changes.** Don't introduce a new library, change the folder
   structure, or alter the data model in /docs/MASTER_PLAN.md without flagging it
   explicitly in your response first.
5. **Match existing patterns.** Before adding a new route/model/component, look at how
   an existing one in this repo is structured and follow that pattern rather than
   introducing a new style.
6. **Confirm before destructive actions.** Never drop a collection, force-push, delete
   a branch, or run a migration without explicit confirmation in the current session.
7. **Deployment awareness.** Before touching anything related to env vars, CORS,
   sessions/cookies, auth callback URLs, hosting config, or build/start scripts,
   read /docs/DEPLOYMENT.md first — it documents this project's actual deployment
   topology and every real incident already hit in production. After fixing any
   new deployment-related bug, add it to DEPLOYMENT.md §7 (Known Issues) before
   considering the task done.

## Code style
- Functions and variables: camelCase. Components: PascalCase. Files: kebab-case except
  React components (PascalCase.jsx).
- Every Express route wrapped in try/catch, errors passed to the centralized error
  middleware — never a bare `res.status(500).send(err)`.
- No `console.log` left in committed code — use a real logger or remove it.
- No commented-out dead code in commits — delete it, git history keeps it if needed.

## Before every commit/push — run through this in order
1. `npm run lint` passes in both /client and /server, zero errors
2. `npm test` passes (or explicitly note which tests are expected to fail and why)
3. No `.env`, `node_modules`, or build artifacts staged (`git status` check)
3a. Audit codebase for hardcoded secrets: Ensure no URI strings or keys were accidentally written into scripts (e.g. `check-db.cjs` or `migrations/*.js`).
4. No leftover `console.log`/debugger statements
5. Update /docs/CHANGELOG.md with what changed (see format there)
6. Update /docs/FEATURE_TRACKER.md status for any feature touched
6a. If this task touched deployment-relevant code (env vars, CORS, sessions, auth
   URLs, build config) or fixed a production bug, update /docs/DEPLOYMENT.md too.
7. Commit message follows the Conventional Commits format below

## Commit message format (Conventional Commits — required)
`type(scope): short description`

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`
Examples:
- `feat(auth): add Google OAuth domain restriction for student login`
- `fix(posts): strip authorId server-side for anonymous comments`
- `test(anonymity): add test proving authorId never leaks in anon posts`

Bad (do not do this): `update stuff`, `fix bug`, `wip`, `final version`, `changes`

## When you finish a task
State clearly, in plain language, what was actually implemented, which files were
touched, and what was explicitly NOT done (deferred/stubbed) — do not imply something
works end-to-end if it was only scaffolded.