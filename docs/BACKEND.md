# BACKEND.md — TakeUForward

## How to use this file

This is the backend/architecture equivalent of docs/FRONTEND.md, and it
extends AGENTS.md the same way. Read this fully before touching any route,
model, service, or config file in `/server`. It exists so that every
feature — whichever agent or session built it — reads like it came from the
same senior backend engineer, not like a dozen separately-improvised
implementations bolted together.

If a rule here conflicts with something already in the codebase, don't
silently pick a side: flag the inconsistency per AGENTS.md rule 4 (no silent
architecture/pattern changes without saying so first) and ask.

Stack reminder: Node.js + Express, MongoDB Atlas via Mongoose, Passport.js
(Google OAuth 2.0, session-based), AWS S3 (presigned URLs, Supabase Storage
as approved fallback), Nodemailer, `express-rate-limit`, polling-based chat
(Socket.io is an approved but explicitly deferred Phase 2 upgrade — see
MASTER_PLAN.md §11), Gemini API for summarization. Deployed on Render, kept
warm via UptimeRobot, with MongoDB Atlas as the managed database.

---

## 1. Mindset: act like a senior backend engineer, not a route-generator

A senior backend engineer does these things by default, without being asked
each time:

- Never trusts the client. Every check the frontend does (validation,
  ownership, role) is re-verified server-side, because the frontend can be
  bypassed entirely with a raw HTTP request.
- Thinks about the request three ways before writing a route: what happens
  when this succeeds, what happens when it fails, and what happens when
  it's called by someone who shouldn't be allowed to call it at all.
- Treats the database schema as a contract, not a suggestion — validates at
  the Mongoose level, not just hopes the frontend sends well-formed data.
- Never adds a feature that silently changes an existing feature's
  behavior, performance characteristics, or data shape without saying so.
- Assumes any endpoint will eventually be called with more data than
  expected, more often than expected, and by users who never read the
  intended UI flow at all (via direct API calls, scripts, or malicious
  intent) — and designs defensively for that from the start, not after an
  incident.
- Writes code that the next engineer (or next AI session) can trust without
  re-reading every line — consistent patterns are a form of documentation.

If you catch yourself writing a route that trusts `req.body.userId` instead
of `req.user._id` from the authenticated session, or skips ownership
verification "because the frontend already checked" — stop. That's exactly
the class of bug that turns into a real incident.

---

## 2. Route → Controller → Service architecture — follow it consistently

Every feature must follow the same layered structure already established in
this codebase:

- **Route** (`server/routes/*.js`): defines the endpoint, applies
  middleware (auth check, rate limiter, validation), and delegates to a
  controller/handler function. Routes should be thin — no business logic,
  no direct database calls living inline in the route file if the codebase's
  existing pattern separates that into a service layer (check actual
  existing files first — match whatever separation already exists rather
  than inventing a new layering convention).
- **Service/business logic**: where the actual "what does this feature do"
  logic lives — e.g. computing the "hot" trending score, stripping
  `authorId` for anonymous content, aggregating digest content. Keep this
  testable and independent of `req`/`res` where reasonable, so it can be
  unit tested without mocking the whole Express request cycle.
- **Model** (`server/models/*.js`): Mongoose schema + schema-level
  validation + any model-level static/instance methods that are genuinely
  about the data shape itself (not business logic).

Before adding a new route/model/service, look at how an existing,
similar feature is structured (e.g. `ReferralRequest`/`referralRoutes.js` is
the closest analog for most new "request + match + close" features in this
app) and follow that exact pattern — per AGENTS.md rule 5.

---

## 3. Error handling — one system, applied everywhere, no exceptions

- **Every single Express route** is wrapped in try/catch (or an async
  error-wrapping utility, if one already exists in the codebase — check
  before adding a new one) and errors are passed to `next(err)`, landing in
  the one centralized error-handling middleware. A route that does
  `res.status(500).send(err)` directly, bypassing the middleware, is a bug
  — find and fix every instance of this, not just new code.
- The centralized error middleware returns a consistent, structured shape:
  `{ error: { code, message } }` — never leak a raw stack trace or raw
  Mongoose error object to the client in production.
- Distinct, correct HTTP status codes per failure type — do not collapse
  everything into a generic 500:
  - `400` — validation/malformed input errors (including Mongoose
    validation errors, mapped to a clean message, not the raw Mongoose
    error object).
  - `401` — not authenticated (no valid session).
  - `403` — authenticated but not authorized for this specific action
    (e.g. trying to close someone else's request, trying to access another
    club's analytics).
  - `404` — resource not found (including the case where an ID is
    well-formed but doesn't exist, and the case where it exists but the
    user shouldn't know that — see §5's note on information leakage).
  - `409` — conflict (e.g. duplicate action, already-resolved request
    being acted on again).
  - `413` — payload/file too large (uploads).
  - `429` — rate limit exceeded.
  - `500` — genuine unexpected server error only, after everything above
    has been ruled out.
- Async errors specifically: confirm every `async` route handler's promise
  rejections are actually caught — a naked `async (req, res) => {...}`
  without a wrapping try/catch or error-wrapping utility will crash silently
  or hang the request if something inside throws.
- Third-party/external call failures (Gemini API, S3, Nodemailer, the
  Google OAuth callback) must degrade gracefully and return a meaningful
  error to the client — never let an external service's failure surface as
  an unhandled exception or a generic 500 with no context.

---

## 4. Database & data modeling (MongoDB / Mongoose)

- **Schema validation is real, not decorative.** Required fields, enums,
  min/max, and types must be enforced at the Mongoose schema level — do not
  rely on the frontend form validation as the only line of defense.
- **Index every field that's actually queried/filtered on** — cross-check
  every `find`/`aggregate` call against its corresponding schema and
  confirm the filtered/sorted fields are indexed. This project has
  accumulated many filterable list endpoints (posts, resources, reviews,
  interview experiences, electives, team requests, lost & found) — audit
  each one specifically, don't assume indexing was kept consistent as
  features were added incrementally.
- **Pagination is mandatory on every list endpoint.** No endpoint should be
  able to return an unbounded result set as data grows — use `.limit()` +
  `.skip()` or cursor-based pagination consistently, matching whatever
  pattern is already established elsewhere in the codebase.
- **Avoid N+1 query patterns.** If a route loops over an array and issues a
  separate query per item, that's a bug to fix with a single aggregation,
  `$in` query, or `.populate()` instead.
- **Prefer a single well-designed aggregation pipeline over multiple
  sequential queries** when computing derived data (e.g. Club Analytics,
  Trending/Hot sort, Weekly Digest content) — this project already
  established this pattern for Trending Sort and Club Analytics; new
  similar features should follow it, not fall back to fetch-everything-
  then-compute-in-JS.
- **Referential integrity is manual in MongoDB — think about it
  explicitly.** When a document that other documents reference gets
  deleted (e.g. a user, a club, a community), decide and document what
  happens to those references (cascade delete, orphan-and-ignore, or
  soft-delete) rather than leaving it undefined behavior. Flag this as a
  real design decision if it's not already covered by MASTER_PLAN.md,
  don't silently pick one.
- **Never trust a client-supplied ID blindly.** Validate that an ObjectId
  is well-formed before querying with it (a malformed ID should return a
  clean 400, not an unhandled Mongoose CastError that becomes an ugly 500).

---

## 5. Security — the non-negotiable baseline

- **Authorization is checked on every single mutating route, server-side,
  every time — no exceptions.** For any update/delete/close/resolve/match
  action, verify the authenticated user (`req.user`) actually owns or has
  the right role for that specific resource before performing the action.
  A route that "would only be called correctly by the UI" is not secure —
  it must reject an unauthorized direct API call too. Audit this across
  the ENTIRE route surface, including older Phase 1 routes, not just
  recently-added ones.
- **NoSQL injection**: never pass raw `req.body`/`req.query` values
  directly into a Mongoose query without validating their shape first — a
  maliciously-crafted object (e.g. `{ $gt: "" }`) passed as a query
  operator instead of a plain value is a real, well-known MongoDB
  injection vector. Validate expected types before they reach a query.
- **XSS**: any user-generated content that gets rendered on the frontend
  (post/comment text, bios, reviews) must be treated as untrusted — confirm
  the frontend is not using `dangerouslySetInnerHTML` (or equivalent) on
  raw user content without sanitization.
- **Anonymity stripping is the single most safety-critical piece of logic
  in this codebase.** `authorId` must never be present in the serialized
  response for anonymous content — not filtered client-side, not
  conditionally included based on a frontend flag, stripped at the service
  layer before the response is ever constructed. Every content type that
  supports anonymity (Posts, Comments, Interview Experiences, and any
  future addition) must have this enforced identically and must have a
  dedicated test proving it, per AGENTS.md rule 3. When adding ANY new
  anonymity-capable content type in the future, this test is written
  first, not after.
- **Rate limiting** applied consistently to every creation/mutation
  endpoint across the whole app, not just recently-built features — audit
  older routes specifically for gaps.
- **Secrets** never committed, never logged, never included in error
  messages returned to the client. `.env` stays gitignored; `.env.example`
  stays accurate and placeholder-only.
- **Session/cookie security**: `httpOnly` cookies (never tokens in
  localStorage unless a deliberate, documented architecture decision says
  otherwise — see docs/DEPLOYMENT.md for what was actually decided re:
  cross-site cookie handling), correct `sameSite`/`secure` flags matching
  the real production cross-origin setup.
- **File uploads** (S3 presigned URLs): validate file type and size
  constraints server-side before issuing a presigned URL, not just via
  frontend `accept` attributes — a presigned URL request should not
  blindly trust an arbitrary content-type/size from the client.
- **Dependency hygiene**: no known-vulnerable packages left unaddressed —
  run `npm audit` periodically and don't ignore high/critical findings
  without a documented reason.

---

## 6. API design consistency

- **Consistent URL/resource naming**: plural nouns for collections
  (`/api/posts`, `/api/team-requests`), nested resources for sub-actions
  (`/api/posts/:id/comment`, `/api/team-requests/:id/apply`) — match the
  convention already used across the existing API surface (see
  MASTER_PLAN.md §16), don't introduce a different naming style for a new
  feature.
- **Consistent response shape**: successful responses should follow one
  consistent envelope convention already established in this codebase
  (check actual existing responses before assuming a shape) — don't have
  some endpoints return the raw document and others return `{ data: ... }`
  inconsistently.
- **Consistent filtering/query-param conventions**: list endpoints already
  use query params like `?community=&type=&dept=&year=` — new filterable
  endpoints should follow the same naming and combination pattern, not
  invent a new filtering syntax.
- **Idempotency where it matters**: actions like upvote-toggle should
  behave predictably on repeated calls (toggle on/off, not accumulate
  duplicate upvotes from the same user) — verify this is actually enforced
  at the schema/query level (e.g. checking if `userId` is already in the
  `upvotes` array before pushing), not just assumed to work.
- **Versioning awareness**: this project doesn't need API versioning at
  its current scale — don't add `/v1/` prefixes speculatively; note this
  explicitly as a "not needed yet" rather than silently adding
  infrastructure for a scale problem that doesn't exist.

---

## 7. Authentication & authorization architecture

- Google OAuth (Passport.js) domain-restriction is enforced **server-side
  on the callback**, re-verifying the returned email's domain regardless of
  the `hd` parameter sent to Google — the `hd` parameter is a client-side
  hint only and must never be trusted as the actual security boundary
  (MASTER_PLAN.md §9.1 already specifies this; confirm the implementation
  actually does it, don't assume from the plan alone).
- Alumni whitelist/invite-token verification happens server-side against
  the `approvedAlumniEmails` collection — never trust a client-asserted
  "I am alumni" claim.
- Role checks (`student` / `alumni` / `club_admin` / fixed `platform_admin`)
  must treat `takeuforwardssn@gmail.com` as the only system admin. Use
  `requireSystemAdmin` for global admin actions; do not trust `role:
  platform_admin` by itself. All role and admin checks must be read from
  the authenticated session/user document server-side, never from a
  client-supplied role field in the request body.
- Club-admin scoping is per-`clubId`, not a blanket "is club admin"
  check — verify every club-admin-gated route checks the specific `clubId`
  the admin is authorized for, not just the boolean role flag (this
  exact pattern already matters for Club Analytics — confirm it's
  correctly scoped, not just role-checked).

---

## 8. Third-party integrations — treat every external call as unreliable

For AWS S3/Supabase, Gemini API, Nodemailer/SMTP, and Google OAuth:

- Wrap every external call in proper error handling — assume timeouts,
  rate limits, and outright failures will happen in production, not just
  in theory.
- Never let an external service's failure cascade into an unrelated
  feature breaking (e.g. Gemini summarization failing should not prevent
  the resource upload itself from succeeding — it should degrade
  gracefully to "no summary yet," matching what MASTER_PLAN.md already
  specifies as the intended graceful-fallback behavior for this exact
  case).
- Set explicit timeouts on outbound HTTP calls to third parties — an
  unbounded hanging request to an external API can tie up server resources
  indefinitely.
- Log failures from third-party calls with enough context to debug later
  (which service, what was attempted, what the error was) — without
  logging any secrets/credentials in the process.

---

## 9. Background jobs & scheduled work

- The Weekly Digest webhook (`POST /api/jobs/weekly-digest`) and any
  future scheduled job must be secured with a shared secret
  (`x-cron-secret` or equivalent header check) — never a publicly
  triggerable endpoint, since it performs a real side effect (sending
  emails to real users).
- Must be idempotent-safe against retries from the external scheduler
  (cron-job.org) — a slow cold-start causing a timeout-then-retry should
  never result in double-sending. The `lastDigestSentAt` guard pattern
  already used for the digest is the template for any future scheduled
  job — reuse it.
- Any future background/scheduled work should default to this same
  "external trigger hits a secured webhook" pattern rather than an
  in-process `node-cron`, consistent with the reasoning already documented
  in docs/DEPLOYMENT.md for why that was chosen over in-process scheduling
  on Render's free tier.

---

## 10. Logging & observability

- No `console.log` in committed code (AGENTS.md rule) — use whatever real
  logger is established in the codebase; if none exists yet, that's a gap
  to flag explicitly, not silently work around with more `console.log`.
- Log server-side errors with enough structured context to actually debug
  a production incident (route, user ID where relevant and safe to log,
  error message/stack) — but never log full request bodies containing
  sensitive data (passwords, tokens, full session objects) or PII beyond
  what's needed.
- The health check endpoint should verify actual dependency health (e.g.
  MongoDB connection state), not just return a static `200 OK` — a health
  check that always passes regardless of real DB connectivity provides
  false confidence during an incident.
- Distinguish expected/handled errors (a 400 validation failure — normal,
  don't alarm-log it) from genuinely unexpected errors (a 500 — this is
  the class of thing that should be loud in logs) — don't treat every
  error the same way in terms of log severity.

---

## 11. Performance

- Avoid blocking the event loop with synchronous, CPU-heavy work in a
  request handler — if any genuinely heavy computation exists (e.g. large
  file processing), consider whether it belongs in a background job
  instead of inline in the request/response cycle.
- Confirm expensive aggregations (Trending/Hot sort, Club Analytics,
  Weekly Digest content) have appropriate indexes backing them and
  reasonable result-set limits — an aggregation over an unbounded
  collection with no limit is a latent performance bug that won't show up
  until real data volume exists.
- Presigned S3 URLs mean file bytes never pass through the Node server —
  confirm this pattern is actually followed for every file
  upload/download path, not accidentally proxied through Express
  somewhere, which would reintroduce the exact bottleneck this pattern
  was chosen to avoid (MASTER_PLAN.md §7.4).
- Response payload size: list endpoints should return only the fields the
  frontend actually needs (e.g. don't serialize a full nested `comments`
  array on a list view that only shows a comment count) — over-fetching
  compounds badly once pagination volume grows.

---

## 12. Testing

- Every mutating route should have at least one test covering: the happy
  path, an unauthorized-access attempt (expect 401/403, not a successful
  mutation), and a validation-failure case (expect 400, not a crash).
- Anonymity-stripping tests are mandatory for every anonymity-capable
  content type — written immediately when the feature is built, per
  AGENTS.md rule 3, never deferred.
- Rate-limiting behavior should have at least a basic test confirming the
  limiter actually engages (e.g. the Nth request in a window gets a 429),
  not just that the middleware is wired in without verifying it functions.
- Prefer testing behavior (what a route actually does, given valid/invalid
  input/auth) over testing implementation details that would break on a
  harmless refactor.
- Playwright E2E coverage should track the platform's actual critical
  path as features are added — if a new feature becomes part of a realistic
  new-user journey, consider whether the E2E suite needs to reflect that,
  rather than letting it silently go stale against a Phase-1-era flow.

---

## 13. Deployment & configuration

- Every environment variable used in code must exist in `.env.example`
  with a placeholder value, and vice versa — no drift between what's
  documented and what's actually read via `process.env`.
- Config differences between dev and production (CORS origins, cookie
  flags, log verbosity) must be driven by environment variables/`NODE_ENV`
  checks, never hardcoded branches that need manual editing before deploy.
- Graceful shutdown: handle `SIGTERM` to let in-flight requests complete
  and close the MongoDB connection cleanly before the process exits —
  important specifically for Render's deploy/restart behavior, which will
  send this signal on every redeploy.
- Anything genuinely new or changed about deployment topology, env vars,
  CORS, sessions, or build/start scripts must be documented in
  docs/DEPLOYMENT.md and flagged per AGENTS.md rule 7 before/alongside the
  change — never left for someone to discover by trial and error during a
  deploy.

---

## 14. Common backend mistakes to actively check for (checklist)

Run this specifically as a review pass on any route/service you touch or
create:

- [ ] Route not wrapped in try/catch, bypassing the centralized error
      middleware.
- [ ] Ownership/role check missing or only implied, not actually verified
      against `req.user` server-side.
- [ ] Client-supplied ID used in a query without validating it's a
      well-formed ObjectId first.
- [ ] Unbounded query/list endpoint with no pagination.
- [ ] Missing index on a field that's actually filtered/sorted on in a
      real query.
- [ ] N+1 query pattern (loop + per-item query instead of one
      aggregation/`$in`/`.populate()`).
- [ ] Anonymous content path where `authorId` could leak (check the
      actual serialized response, not just the intent of the code).
- [ ] Rate limiter missing on a new mutation-creating route.
- [ ] Third-party call (S3/Gemini/Nodemailer/OAuth) with no timeout or
      error handling, capable of cascading into an unrelated failure.
- [ ] Secret or credential value referenced directly instead of via
      `process.env`, or accidentally included in a log/error response.
- [ ] Inconsistent response shape or status code compared to equivalent
      existing endpoints elsewhere in the API.
- [ ] A new scheduled/background job built as in-process `node-cron`
      instead of the established secured-webhook pattern, without an
      explicit reason and my sign-off.
- [ ] `console.log` left in committed code.
- [ ] Duplicate upvote/toggle logic not actually idempotent under repeated
      calls from the same user.

---

## 15. Per-feature audit template

When reviewing or building any backend feature, go through this exact list:

1. Does every mutating route verify ownership/role server-side, not just
   assume the frontend already checked?
2. Are all fields this feature filters/sorts by actually indexed?
3. Is the list endpoint paginated?
4. Is rate limiting applied to creation/mutation routes?
5. If this feature supports anonymity, is stripping enforced at the
   service layer with a passing dedicated test?
6. Does every route funnel errors into the centralized middleware with
   correct status codes?
7. Are third-party calls (if any) wrapped with timeouts/error handling
   that degrade gracefully rather than cascading failures?
8. Is the response shape and URL/query-param convention consistent with
   equivalent existing endpoints?
9. Any of the common mistakes from §14 present? Fix them now, don't defer.

---

## 16. When extending backend architecture itself

If a task genuinely requires a new pattern, library, or structural change
that doesn't exist yet in this codebase (a new logging library, a new
background-job mechanism, a new external service integration):

1. Check thoroughly that an existing pattern in the codebase doesn't
   already solve this — reuse before adding.
2. If it's genuinely new, flag it explicitly per AGENTS.md rule 4 before
   building it — a new dependency or architectural pattern is a real
   decision, not an implementation detail, even under a "senior engineer"
   mandate to use good judgment. Good judgment here specifically means
   asking before introducing new infrastructure, not silently deciding
   for the team.
3. Once approved, document the new pattern here (or in AGENTS.md) so
   future work follows it consistently instead of re-deciding each time.
