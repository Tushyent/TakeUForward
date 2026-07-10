# FRONTEND.md — TakeUForward

## How to use this file

This is the frontend equivalent of AGENTS.md. Read this fully before touching
any React component, page, or stylesheet in `/client`. It exists so that
every page, whichever agent or session built it, looks and behaves like it
came from the same senior frontend developer — not like twenty separate
people each built one page in isolation.

If a rule here conflicts with something already in the codebase, don't
silently pick a side: flag the inconsistency and follow AGENTS.md rule 4 (no
silent architecture/pattern changes without saying so first).

This file does not replace AGENTS.md — it extends it specifically for
frontend work. Stack reminder: React + Vite, JavaScript, React Router,
Axios, vanilla CSS (no Tailwind, no CSS-in-JS library — check
`client/src/components/ui/` before assuming otherwise), `react-hot-toast`
for feedback.

---

## 1. Mindset: act like a senior frontend developer, not a code-completion tool

A senior frontend developer does these things by default, without being
asked each time:

- Never ships a page with only the "happy path" working. Every page that
  fetches data has three other states to design for: loading, empty, and
  error — see §7.
- Never invents a new visual pattern when an existing one already solves the
  same problem elsewhere in the app. Consistency beats local cleverness.
- Treats spacing, alignment, and type scale as a system, not a per-page
  decision made by eye.
- Reads the component before extending it. If `Card.jsx` already supports a
  `variant` prop, use it — don't hand-roll a new card-shaped div.
- Never leaves a user unsure whether their click did anything (§9).
- Assumes their work will be used on a phone in bad lighting on a slow
  connection before it's used on a designer's 27" monitor.

If you catch yourself about to write inline `style={{...}}` with a one-off
color or pixel value, stop — that's very likely a sign the shared design
system doesn't have the right token yet, and the fix is to add the token,
not to hardcode around it.

---

## 2. Design system — the tokens everything else must derive from

All of the below must live as CSS custom properties in one global stylesheet
(check if `client/src/index.css` or a `theme.css` already holds these before
creating a new file — extend, don't duplicate). Every component and page
must reference these variables, never a raw hex code, raw pixel spacing
value, or an arbitrary font stack, outside of this one file.

### 2.1 Color

Define named tokens, not just raw values — this is what lets a future theme
change (e.g. dark mode) happen in one file instead of a thousand find-and-
replaces:

```css
--color-bg              /* page background */
--color-surface         /* card/panel background, one step up from bg */
--color-surface-raised  /* modals, dropdowns — one step up again */
--color-border          /* default hairline border */
--color-border-strong   /* emphasized border, e.g. focused input */
--color-text-primary
--color-text-secondary  /* metadata, timestamps, helper text */
--color-text-muted      /* placeholder, disabled */
--color-accent          /* primary brand action color */
--color-accent-hover
--color-success
--color-warning
--color-danger          /* destructive actions, error states */
--color-info
```

Do not default to generic corporate SaaS blue-on-white. This is a student
campus platform — the palette should feel energetic and peer-to-peer, not
enterprise-dashboard. Pick an accent with actual character (check if one was
already chosen in a prior design pass before picking a new one — don't
relitigate an already-approved direction without saying so).

Anonymity is a first-class concept in this product (posts, comments,
interview experiences can be anonymous). Anonymous content should have a
subtle, consistent visual treatment (e.g. a distinct badge/icon + muted
author-line styling) applied identically everywhere it appears — feed,
comments, interview experiences — never styled differently in different
places.

### 2.2 Typography

- One display/heading typeface, one body typeface. Two is enough; a third
  "utility" face for timestamps/metadata is optional, not required.
- Define a real type scale, not ad hoc `font-size` values per component:
  `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`,
  `--text-2xl`, `--text-3xl`. Every heading/paragraph in the app should map
  to one of these, never a bespoke value like `font-size: 17px` invented for
  one component.
- Line-height must scale with font-size — larger text gets tighter relative
  line-height, small text gets looser, so nothing feels cramped or floaty.
- Set a max line-length on body text (roughly 60–75 characters per line via
  `max-width` on text containers) — full-bleed paragraph text on a wide
  desktop viewport is a classic tell of an unfinished layout.

### 2.3 Spacing

- One spacing scale, used everywhere, no exceptions: e.g. `--space-1: 4px`
  through `--space-12` or similar, in a consistent multiplier (4px or 8px
  base). If a component needs 13px of padding, that's a sign to round to the
  nearest scale step, not to add a new arbitrary value.
- Card padding, button padding, form field spacing, and section gaps should
  each consistently map to the same 2–3 scale steps across the whole app —
  audit for drift (e.g. one page using 12px card padding and another using
  18px for what's visually the same kind of card).

### 2.4 Radius, shadow, elevation

- One small set of border-radius values (e.g. `--radius-sm`, `--radius-md`,
  `--radius-lg`), applied consistently by component type (all cards use the
  same radius, all buttons use the same radius, etc.) — not a different
  radius per page.
- A small elevation system (2–3 shadow levels) used consistently for
  hierarchy: flat page background → raised card → floating modal/dropdown.
  Don't apply heavy shadows everywhere; reserve the strongest shadow for the
  thing that's actually floating above everything else (modals, dropdowns,
  toasts).

### 2.5 Iconography

- Pick exactly one icon library for the whole app (e.g. `lucide-react` —
  flag as a new dependency per AGENTS.md rule 4 if not already installed)
  and use only that library. Never mix icon sets (e.g. one page using
  emoji as icons, another using a different icon package) — this is one of
  the fastest ways an app looks unfinished.
- Icons are used with intent, not decoration for its own sake: a bell for
  notifications, a bookmark outline vs. filled for saved/unsaved state, a
  location pin for Lost & Found's location tag. Don't sprinkle icons next to
  every single word in a sentence.
- Icon sizing should map to the type scale it sits next to (an icon next to
  `--text-sm` text should not be sized for `--text-2xl`).
- Icon color follows the same token system as text — use
  `--color-text-secondary` for a muted metadata icon, `--color-accent` for
  an active/selected state icon, not arbitrary colors.

---

## 3. Shared component library — the single source of truth

`client/src/components/ui/` (`Button`, `Card`, `Badge`, `Spinner`, `Input`,
and whatever else exists there) is the ONLY place base visual styling should
live for these primitives. Rules:

- Every page must import and use these shared components for buttons,
  cards, badges, inputs, and loading indicators. A page hand-rolling its own
  `<button>` with inline styles instead of using `<Button>` is a bug, not a
  stylistic choice — fix it, don't work around it.
- If an existing shared component doesn't support a variant a new page
  needs (e.g. a destructive/danger button style), extend the shared
  component with a new prop/variant — do not create a second, parallel
  button component, and do not override its styles from the outside with
  page-specific CSS.
- Before building any new page, check whether an existing page already
  solves a visually-similar problem (a filterable list, a create-item form
  with dynamic fields, a card grid) and reuse that exact pattern rather than
  inventing a new layout convention. The app currently has several
  "browsable list + create form" pages (Resources, Reviews, Referral Board,
  Team Finder, Lost & Found, Electives, Career Roadmaps, Interview
  Experiences) — these should look and behave like siblings, not like
  separately-designed products.

---

## 4. Layout and alignment

- Every page has a consistent max content width and consistent horizontal
  page padding — define this once (e.g. a `.page-container` class) and use
  it everywhere, rather than each page picking its own container width.
- Vertical rhythm: consistent spacing between a page's title, its
  filter/action bar, and its content list — this should feel identical
  across every list-style page in the app.
- Alignment must be intentional, not accidental: text baselines, icon
  centers, and button contents should visually align with their neighbors.
  A common, easy-to-miss bug: an icon that's 2–3px off-center vertically
  next to text — check this specifically wherever icon+text pairs appear
  (buttons, badges, nav items).
- Grids/flex layouts must have consistent gap values from the spacing
  scale (§2.3) — not a mix of `margin` hacks and `gap` on different pages
  doing the same visual job.
- Forms: labels consistently positioned (e.g. always above the field, never
  sometimes-beside-sometimes-above across different pages), consistent
  field spacing, consistent error-message placement directly under the
  relevant field (never a generic top-of-form error blob that doesn't say
  which field is wrong).
- Z-index must be managed as a small defined scale (e.g. dropdown: 100,
  modal backdrop: 200, modal: 201, toast: 300) — not arbitrary large numbers
  picked ad hoc per component, which is how dropdown-behind-modal bugs
  happen.

---

## 5. Responsiveness — non-negotiable, checked on every page

Mobile-first. Design and build for the smallest viewport first, then extend
upward with `min-width` media queries — do not design for desktop and
squeeze it down as an afterthought.

### 5.1 Required breakpoints to actually test at

- **~375px** (small phone, e.g. iPhone SE class)
- **~768px** (tablet portrait)
- **~1024px** (tablet landscape / small laptop)
- **~1440px+** (standard desktop/laptop)

### 5.2 Checklist — run this against every page, not just new ones

- [ ] No horizontal scroll/overflow at any of the four breakpoints.
- [ ] Navbar collapses to a proper mobile menu (hamburger or equivalent)
      below tablet width — never just visually shrinks/wraps/overlaps.
- [ ] All interactive touch targets are at least ~44×44px on mobile
      (buttons, icon buttons, checkboxes, nav links) — a visually small
      icon button still needs adequate invisible tap padding.
- [ ] Forms are usable one-handed on a phone: full-width inputs, no
      horizontally-clipped labels, submit button reachable without
      awkward reach/zoom.
- [ ] Card grids/lists reflow to a single column on mobile — never a
      crushed multi-column grid with unreadable text at small widths.
- [ ] Modals, dropdowns, and autocomplete menus (e.g. @mention
      autocomplete, notification dropdown) never overflow off-screen or
      get clipped by the viewport edge on small screens.
- [ ] Tables (Reviews, Club Analytics) either reflow into a card-like
      layout on mobile or become contained horizontally-scrollable
      elements — never break the page's overall layout.
- [ ] Text never overflows its container and is never sized below
      `--text-sm` on mobile for anything a user needs to actually read
      (not just decorative labels).
- [ ] The chat thread view specifically: message input is never covered
      by the on-screen mobile keyboard, and the thread auto-scrolls
      correctly on send/receive.
- [ ] `client/index.html` has a correct
      `<meta name="viewport" content="width=device-width, initial-scale=1" />`
      — verify this exists, don't assume it.
- [ ] No fixed pixel widths on layout containers that should instead use
      relative units, flexbox, or grid — a hardcoded `width: 800px` on a
      container is almost always a bug on smaller viewports.

---

## 6. PWA behavior

- `manifest.json` present and linked from `index.html`: `name`,
  `short_name`, icons at minimum 192×192 and 512×512, `theme_color`,
  `background_color`, `display: "standalone"`, correct `start_url`.
- Exactly ONE service worker for the whole app. If a service worker already
  exists (e.g. for Web Push), extend it for offline app-shell caching rather
  than registering a second, competing one — two service workers fighting
  over the same scope is a real, hard-to-debug class of bug.
- `apple-touch-icon` and related iOS meta tags present for homescreen
  support — iOS does not follow the standard manifest icon spec the same
  way Android/Chrome does, both need to be covered.
- A real offline fallback state (not a blank white screen) when the network
  is unavailable — even a simple "you're offline" message with a retry
  affordance is better than nothing.
- Anything installed as a PWA must still pass the full responsiveness
  checklist in §5 — a PWA on a phone has zero tolerance for desktop-only
  layouts.

---

## 7. The four states every data-driven page must design for

Every page or component that fetches data from the API must explicitly
design, not just technically handle, these four states — "it works when the
API returns data" is not sufficient:

1. **Loading** — use the shared `<Spinner>` component (or a skeleton
   pattern if one has been established — check first, be consistent).
   Never a blank white flash before content pops in.
2. **Populated** — the normal case, most of the design effort naturally
   goes here.
3. **Empty** — this is a design opportunity, not an afterthought. A list
   with zero items should show a purposeful empty state: a relevant icon,
   a short explanation of why it's empty, and — where it makes sense — a
   direct call to action (e.g. Lost & Found with no items: "Nothing
   reported yet — post if you've lost or found something"). Never just
   render nothing, and never a generic "No data" with no context.
4. **Error** — when a fetch fails, show a clear, specific, non-technical
   message with a retry action where reasonable, delivered via the
   existing toast system (§9). Never let a failed fetch silently leave a
   page blank or stuck on a spinner forever.

---

## 8. Motion and animation

- Motion should clarify, not decorate. Good uses: a smooth transition when
  a card expands, a subtle fade/slide when a toast appears, a hover state
  transition on interactive elements, a loading skeleton shimmer.
- Keep transitions fast — roughly 150–250ms for most UI micro-interactions.
  Slow, showy animations read as unpolished, not premium, in a utility app
  like this.
- Respect `prefers-reduced-motion` — wrap non-essential animation in a media
  query check and fall back to instant state changes for users who've
  opted out at the OS level.
- Don't animate everything. A page where every single element fades/slides
  in on load is more distracting than a page with zero animation. Pick a
  small number of meaningful moments (page-load of a feed, a new chat
  message arriving, a toast) rather than applying motion uniformly
  everywhere.
- Hover/focus states on every interactive element are mandatory, even if
  the transition is instant — a button, link, or card that gives zero
  visual feedback on hover feels broken, not calm.

---

## 9. Feedback — the user must always know what just happened

This app already has `react-hot-toast` installed — use it consistently
everywhere a mutation happens. Audit checklist, apply to every action:

- **Every mutating action gets a toast**: create post/comment, upvote,
  report, resolve/close a request, apply to a team, message sent, resource
  uploaded, bookmark toggled, profile/settings updated, moderation action
  taken, join/leave, etc. If an action changes data and gives the user
  zero feedback, that's a bug.
- **Success toasts use the same verb as the action that triggered them**
  (see the writing guidance in §11) — a button that says "Post" should
  result in a toast that says "Posted," not a generic "Success!"
- **Error toasts are specific, not generic.** "Something went wrong" is
  the last resort, not the default — where the API can tell you what
  failed (validation error, auth error, rate limit hit), surface that
  specific reason.
- **Destructive actions get a confirmation step** before the toast (e.g. a
  confirm dialog for closing/deleting something) — don't let a single
  misclick silently destroy data, consistent with AGENTS.md rule 6's
  "confirm before destructive actions" applying to the UI layer too.
- **Disabled/loading state on the triggering button** while a mutation is
  in-flight (`isSubmitting`/`isUploading` pattern already used elsewhere in
  this app) — prevents double-submission and tells the user something is
  happening even before the toast fires.
- **Long-running actions** (file upload, AI summarization) should show
  visible progress or at minimum a persistent "in progress" indicator, not
  just a spinner the user has to guess the meaning of.

---

## 10. Accessibility baseline (non-negotiable floor, not a stretch goal)

- Every interactive element must have a visible keyboard focus state — do
  not strip default focus outlines without replacing them with an
  equally-visible custom one.
- All interactive elements must be reachable and operable via keyboard
  alone (tab order, enter/space to activate) — check this specifically
  for custom components like dropdowns and modals, not just native
  buttons/links.
- Every form input has an associated, real `<label>` — not just a
  placeholder acting as a label (placeholders disappear on input and are
  not reliably read by screen readers as labels).
- Images/icons that convey meaning have `alt` text or `aria-label`;
  purely decorative icons are marked `aria-hidden="true"`.
- Color is never the only way information is conveyed (e.g. an error
  state should have an icon/text, not just red text/border, for
  colorblind users).
- Sufficient color contrast between text and its background, especially
  for `--color-text-secondary`/muted text — don't let "subtle" styling
  drift into "illegible."

---

## 11. Writing / microcopy voice

- Write from the student's side of the screen: name things by what they
  recognize and control, not by internal system/DB naming (a user
  "bookmarks a post," they don't "toggle a Bookmark document").
- Active voice, one clear verb per action: a button that says "Post" (not
  "Submit"), and everything downstream — the toast, any confirmation text
  — uses that exact same verb ("Posted," not "Your submission was
  successful"). This consistency is how someone learns their way around
  the app without thinking about it.
- Empty states are an invitation to act, not just a status report ("No
  reviews yet — be the first to review this course" beats "No data").
- Error messages explain what happened and, where possible, what to do
  next — never vague, never apologetic filler ("Oops! Something broke :(" 
  is worse than a plain, specific statement of the problem).
- Keep tone conversational but not cutesy — this is a tool students rely
  on for real academic/placement decisions, not a lifestyle app; humor is
  fine in empty states, not appropriate in error states or anything
  involving moderation/reporting.
- Anonymous content UI copy should never accidentally imply less
  legitimacy ("Anonymous" stated plainly, not styled or worded to look
  suspicious/lesser than identified content) — the whole point of the
  anonymity engine is that it's a trusted, first-class option.

---

## 12. Common frontend mistakes to actively check for (checklist)

Run this specifically as a review pass on any page you touch or create:

- [ ] Inline `style={{}}` with hardcoded colors/pixel values instead of
      using design tokens/shared classes.
- [ ] A hand-rolled button/card/input instead of the shared `ui/`
      component.
- [ ] Missing loading/empty/error state (§7) — only the happy path was
      built.
- [ ] No toast feedback on a mutating action (§9).
- [ ] No disabled state on a submit button during an in-flight request,
      allowing double-submission.
- [ ] Horizontal overflow at the 375px breakpoint.
- [ ] Icon and text visually misaligned (baseline/vertical-center off).
- [ ] Inconsistent spacing/padding compared to visually-equivalent
      components elsewhere in the app.
- [ ] Text truncation without a way to see the full content (e.g. a
      clipped long username/title with no tooltip/expand option).
- [ ] A list/table with no pagination or virtualization that will
      visibly degrade once real data volume exists.
- [ ] Uncaught promise rejections on API calls — every Axios call needs
      a `.catch` or try/catch wired to user-facing feedback, never a
      console-only silent failure.
- [ ] A modal/dropdown that doesn't close on outside-click or Escape key.
- [ ] Missing `key` prop (or an unstable `key`, e.g. array index on a
      reorderable list) on any mapped list of components — a classic
      React correctness bug, not just a style nit.
- [ ] Stale state after a mutation — e.g. creating an item doesn't update
      the visible list without a manual refresh (check this specifically
      given the profile-completion stuck-page bug already found once in
      this exact codebase — stale local state after a successful mutation
      is a recurring risk here).
- [ ] Layout shift when content loads (e.g. images without reserved
      space causing the page to jump) — reserve space with fixed
      aspect-ratio containers where images/media are involved.
- [ ] A z-index conflict (dropdown appearing behind a modal, toast
      appearing behind a fixed navbar) — check against the z-index scale
      in §4.

---

## 13. Per-page audit template

When reviewing or building any page, go through this exact list and be able
to answer each point concretely — don't mark a page "done" without having
actually checked each one:

1. Does it use only shared `ui/` components for buttons/cards/inputs/badges/
   spinners?
2. Does it correctly show loading, empty, and error states (§7)?
3. Does every mutating action on this page trigger a toast (§9)?
4. Does it pass the full responsiveness checklist (§5.2) at all four
   breakpoints?
5. Are icons from the single chosen icon library, sized and colored
   consistently with the rest of the app (§2.5)?
6. Is spacing/padding/radius consistent with equivalent components
   elsewhere (§2.3, §2.4)?
7. Is every interactive element keyboard-accessible with a visible focus
   state (§10)?
8. Does the copy on this page follow the writing voice rules (§11)?
9. Any of the common mistakes from §12 present? Fix them now, don't defer.

---

## 14. When extending the design system itself

If a task genuinely requires a new token, component variant, or pattern that
doesn't exist yet:

1. Check thoroughly first that it really doesn't already exist somewhere in
   `ui/` or another page — duplication is the main way inconsistency
   creeps in.
2. Add it to the shared system (tokens file or shared component), not as a
   one-off in the page that needed it — the next page that needs the same
   thing should be able to reuse it, not reinvent it again.
3. Flag it explicitly in your response, per AGENTS.md rule 4 — a new design
   token or component variant is a small architecture decision, even if it
   feels like "just CSS."
