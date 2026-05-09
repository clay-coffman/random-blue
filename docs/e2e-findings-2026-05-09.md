# E2E Founder Flow — Findings 2026-05-09

**Persona:** Priya (`fp_priya`, B2B SaaS / paying customers / raising seed)
**Branch:** `e2e-user-testing-founder` (worktree wt1, port 3001)
**Browser tool:** `agent-browser`
**Test assets:** `tests/e2e-assets/priya-llc-articles.pdf`,
`priya-ein-letter.pdf`, `priya-headshot.png`, `priya-company-logo.png`

Severity rubric: **blocker** = founder cannot complete the flow ·
**major** = wrong data / breaks responsive at 375px / silent failure ·
**minor** = copy / spacing / polish.

---

## Bugs (broken or wrong behavior)

### B1 — Landing: hardcoded `1,247` companies stat doesn't match DB (220)
- **Severity:** major (data integrity)
- **Repro:** Open `/`, look at the bottom stats strip.
- **Expected:** Real count from `companies` table.
- **Actual:** Hardcoded `"1,247"` shipped in JSX. Real count is **220**
  (and `Map Data for Builder Day - Sheet1.csv` has 254 rows, of which
  220 made it through seeding — also worth a sanity check on the
  loader).
- **File:** `app/page.tsx:21` —
  `{ value: "1,247", label: "Companies" }`. The other three stats
  (`312` resources, `29` counties, `84` profiles) are also hardcoded
  in the same array; verify each against the DB. The marketing
  story is "every Utah resource", so the displayed numbers should
  match the seeded inventory or read from a server-rendered count.

### B2 — Landing: mobile (375) has no sign-in CTA in the header
- **Severity:** major
- **Repro:** Resize to 375px, load `/`. Top header shows "Claim a
  company →" only.
- **Expected:** A way for a returning founder to sign in (a
  hamburger, a text link, or a secondary header button).
- **Actual:** "Sign in" appears in desktop header (visible at 768
  and 1280) but is hidden at 375 with no replacement. Founders
  returning from email links land on the homepage, then have no
  on-screen path back to sign-in.
- **File hint:** `app/page.tsx` header markup; likely a `hidden
  sm:inline-flex` (or similar) on the sign-in link. Either show it
  always, or add a hamburger that contains it.

### B3 — Worktree dev: applying migration 0003 was needed but not flagged
- **Severity:** minor (dev-env only, blocker-grade for new
  worktrees)
- **Repro:** Fresh worktree, run `npm run dev`, open `/`.
- **Expected:** Either migrations auto-apply on dev start, or the
  homepage tolerates missing columns and the README/`refresh-worktrees`
  skill prompts to run `npm run db:migrate:local`.
- **Actual:** Homepage threw a Next.js dev-overlay "1 issue" error
  because `profile_updates.source_client` was missing (migration
  `0003_curious_fat_cobra.sql` not applied even though the file was
  on disk). The error originated in
  `lib/activity.ts:72` (`recentActivity` query joins
  `profile_updates` × `companies`). After
  `npm run db:migrate:local`, error gone.
- **Improvement:** `lib/activity.ts` should `try/catch` and return
  `[]` on schema errors so the homepage degrades gracefully — it
  already prints "recentActivity failed" so the catch exists, but
  the dev overlay still surfaces the error. Either silence the
  console error in dev when the catch fires, or add a
  schema-version sanity check in `npm run dev`.

---

## UX polish (works, but rough)

### P1 — "Claim a company" is the only header CTA on mobile
- The primary persona on the homepage is the **founder** (per the
  hero copy "A guide for Utah founders"), but the only header
  button at 375px is "Claim a company →" (an owner action). The
  founder primary CTA ("Start my plan →") is in the hero body, not
  the persistent header. Consider swapping or adding a "Start my
  plan" button to the mobile header for symmetry with desktop.
- **File:** `app/page.tsx` header.

---

## Accessibility / responsive

### B4 — Sign-up: `AUTH_SKIP_OTP=true` still routes to `/sign-up/verify`
- **Severity:** major (dev-DX; breaks the documented shortcut)
- **Repro:** With `AUTH_SKIP_OTP=true` in `.dev.vars`, complete the
  account form. After submit you land on `/sign-up/verify?email=...`
  and see "We sent a code to ...". No code was actually sent
  (Mailpit inbox empty).
- **Expected (per CLAUDE.md § Local authentication testing):**
  "Sign-up auto-verifies and drops you on the authenticated page —
  no verify screen, no code to grab."
- **Actual:** Front-end always pushes to `/sign-up/verify` regardless
  of OTP shortcut. The user *is* authenticated (manually navigating
  to `/onboarding/founder` works and redirects to `/founder?onboard=1`),
  but the verify page traps them with a non-functional OTP input.
- **Fix candidates:**
  1. `app/sign-up/account/page.tsx:79-85` — when the sign-up
     response includes a session (i.e., no email verification
     required), skip the verify push and route straight to
     `/onboarding/${role}`.
  2. Or, in `app/sign-up/verify/page.tsx`, add a one-shot check on
     mount: if `authClient.getSession()` already returns a verified
     user, `router.replace("/onboarding/" + role)`.
- **Why it's not a blocker:** the shortcut is dev-only, never set in
  production. But it makes the documented "fast inner loop" not work
  out of the box.

### B5 — Better Auth: trustedOrigins not derived from request origin
- **Severity:** minor (only triggered when running on a non-default
  port for a worktree)
- **Repro:** Run dev server on a port that doesn't match
  `BETTER_AUTH_URL` in `.dev.vars`. Sign-up POST to
  `/api/auth/sign-up/email` returns **403** with server log
  `[Better Auth]: Invalid origin: http://localhost:3000`.
- **Workaround:** Edit `.dev.vars` to match. Already done for this
  session.
- **Improvement:** in `auth.ts:35`, set
  `trustedOrigins: [baseURL, "http://localhost:3000",
  "http://localhost:3001", "http://localhost:3002", ...]` for
  worktree-friendly dev, OR fall back to deriving the baseURL from
  the request URL when it's a localhost origin. Helps when
  `create-worktree`/`refresh-worktrees` rotates ports.

---

## Accessibility / responsive

### B6 — Header still shows "Sign in" / "Claim a company" CTAs when authenticated
- **Severity:** major
- **Repro:** Sign in (or finish sign-up). Visit any page (`/founder`,
  `/plan/<id>`, etc.). The top header still shows "SIGN IN" and
  "CLAIM A COMPANY →".
- **Expected:** When authenticated, the header should show the
  user's name / role (or an avatar/menu) and switch the right-side
  CTAs to authenticated equivalents (e.g., "My plan", "Settings",
  "Sign out"). Currently you can't tell from the header alone
  whether you're logged in.
- **File hint:** the shared header component used by `app/page.tsx`,
  `app/founder/page.tsx`, `app/plan/[id]/page.tsx`. Probably renders
  the same nav unconditionally — needs a `useSession` (or
  server-side `auth.api.getSession()`) branch.

### B7 — Plan: "9 things you don't need" reasons read like positive matches
- **Severity:** major (UX confusion — the whole point of the section
  is to tell the founder *why* something was filtered out)
- **Repro:** `/plan/fp_priya`, expand the "9 things you don't need"
  disclosure.
- **Examples of confusing reasoning:**
  - **Utah Microloan Fund (UMLF)** — reason shown: "Covers what you
    need: capital — angel, vc, grants." That's the exact phrasing
    the *positive* matches use; it tells the founder this resource
    *does* match. Why is it ignored?
  - **Wildcat MicroFund** — same issue, identical reason.
  - **U.S. Commercial Service** — reason shown: "Available
    statewide." That's a feature, not a reason to skip.
- **Expected:** Each ignored item explains the *delta* — e.g.,
  "Loan amount cap is below your funding target," "Targets pre-seed
  not paying-customer stage," "Already covered by a higher-ranked
  resource." The current implementation appears to fall back to the
  same explanation generator the positive bucket uses.
- **File hint:** `lib/recommend.ts` or wherever the ignore list's
  per-item rationale is built. The positive bucket uses one
  `explainMatch()`-style helper; the ignore bucket should use a
  dedicated `explainSkip()` that picks the strongest *negative*
  signal (industry mismatch, geo mismatch, stage mismatch,
  community mismatch, capability already covered).

### B8 — Plan: "Email <addr>" CTAs link to website URL, not `mailto:`
- **Severity:** major (looks like a mailto, isn't)
- **Repro:** `/plan/fp_priya`. Each "DO THIS NOW" card has a CTA
  like *"Email info@pelionvp.com with a one-page pitch. →"*.
  Inspect href.
- **Expected:** `mailto:info@pelionvp.com?subject=...&body=...`,
  pre-populating a draft from the persona context — that's how
  founders actually act on this.
- **Actual:** `href="https://pelionvp.com/"` (the company website).
  Same pattern for `slcangels.org`, `kickstartfund.com`,
  `mercatopartners.com`. The link text says "Email"; the link goes
  to the website.
- **Fix:** Either change the link to a real `mailto:` (preferred —
  the brief calls out "draft email actions"), or change the visible
  text to "Visit pelionvp.com" so it matches what the click does.
- **File hint:** `app/plan/[id]/_components/ResultsView.tsx` where
  the per-recommendation actions render.

### B9 — Plan: persona quick-test buttons collide submit path
- **Severity:** minor (works, but model is unclear)
- **Repro:** Sign in as new account. Open `/founder?onboard=1`.
  Click the Priya quick-test fixture. Click "Get my plan →".
- **Actual:** Lands on `/plan/fp_priya` — the *seeded* Priya
  passport that belongs to user `u_priya`, not the signed-in user.
- **Expected (or, at least, document it):** The fixture mode
  intentionally shorts-out to the seeded passport (CLAUDE.md says
  this is a "quick tour"). But the signed-in user will be confused
  that submitting their persona-prefilled intake routes them away
  from their own founder-passport id, and into someone else's. Two
  fixes possible:
  1. After the user signs in, hide the persona quick-test fixtures
     bar entirely (it's dev/marketing, not their flow).
  2. When they click Priya, show a confirm: "This loads the sample
     Priya passport. Your own intake will be discarded. Continue?"

### B10 — No way to sign out (no sign-out CTA anywhere in the app)
- **Severity:** blocker (returning users on shared/public devices
  cannot sign out; multi-account testing requires manual cookie
  clear)
- **Repro:** Sign in. Open `/settings`, the homepage, plan page,
  any page. Search for "Sign out", "Log out", "Logout". Nothing.
  Also no avatar dropdown / user menu in the header.
- **Expected:** A sign-out option in the header (an avatar menu) or
  in `/settings` (under Sign-in & sessions). Better Auth's
  `authClient.signOut()` is already wired in client code; just
  needs a UI surface.
- **File hint:** add to the shared header (paired with B6 — once
  the header knows the user is authenticated, it should expose
  Settings + Sign out), or extend `app/settings/page.tsx`'s
  Sign-in & sessions card with a "Sign out of this session" button.
- **Workaround for testing:** clear cookies in DevTools.

### B11 — Persona display name inconsistency (Priya Patel vs Priya Mehta)
- **Severity:** minor (cosmetic / data-source inconsistency)
- **Repro:** Sign in as `priya@persona.test`. Settings shows the
  user's full name as **"Priya Patel"** (`db/seed/users.ts`-driven).
  But on `/sign-up/account`, the placeholder name in the "Full name"
  field is **"Priya Mehta"** (chosen by `app/sign-up/account/page.tsx`
  to evoke the persona).
- **Expected:** One canonical surname for "Priya" across the
  codebase. If both are intentional ("Patel" = seeded test account,
  "Mehta" = a *different* example name in the placeholder), at
  minimum pick something that doesn't share the first name to avoid
  the impression of a typo. Alternatively, drop the placeholder name
  and use a generic one (e.g., "Your name").
- **File hint:** `db/seed/users.ts` (Patel) vs the sign-up form's
  default placeholder.

---

## What worked well (notable positives)

These are the parts of the flow that came through without friction
during this pass. Calling them out so that fixes for the bugs above
don't accidentally regress them.

- **Persona quick-test prefill** — clicking "Priya" on the intake
  form populates every field, the live JSON preview on the right
  updates in real time, and the route param (`?persona=priya`) is
  shareable. Genuinely delightful.
- **Plan page typography & layout** — three-column layout at desktop,
  per-card score badge, "why →" disclosure, and the "9 things you
  don't need" disclosure are well-considered. Mobile layout
  collapses cleanly to a single column.
- **Map filtering & investor brief** — sector chips work, "B2B
  Software" filtered down to 121 companies cleanly, the Claude-
  generated Investor Brief produced 5 named cluster themes with real
  company chips that link to profile pages. The brief panel
  `<aside>` is also nicely accessible (`data-open`, `aria-hidden`).
- **Company profile + Agent Card** — the `/startups/<slug>` page is
  beautiful, and the "AGENT CARD" panel exposing `/.md`, `/.json`,
  `/api/v1/companies/<slug>`, and `/llms.txt` is a strong agent-
  native signal that ships well above the bar of similar gov sites.
- **Claim flow end-to-end** — `/companies/alysio/claim` accepted the
  generated PDF (`priya-llc-articles.pdf`, 16 KB) and persisted a
  row in `business_ownership_submissions` with the right
  `r2_key`, mime type, file size, status `pending`, and redirect to
  `/me/submissions?submitted=1` showing the success banner. R2
  upload appears wired despite earlier worry about blank creds —
  worth confirming the file actually lives in R2 (vs just metadata
  in D1) before launch.
- **Share plan** — clipboard copy works, button label flips to
  "Copied!" briefly. Subtle, correct.
- **Settings page** — full set of sections (Profile, Security,
  Founder passport, Notifications, Agent tokens, Danger zone),
  Phase-5 sections honestly labeled "Coming in Phase 5" rather
  than fake-disabled — good restraint.

---

## Accessibility / responsive

### A1 — Sample-plan preview card hidden on mobile (375)
- The persona-styled "Priya, 31 · SLC" sample card on the right
  side of the hero is hidden on mobile widths. Acceptable as a
  responsive choice, but the card is one of the most concrete
  selling points of the product — consider rendering a condensed
  version below the hero copy on mobile so first-touch users see
  what a plan looks like before they commit.

---

## Known-blocked-by-env (won't fix in this pass)

- R2 credentials are blank in `.dev.vars` (`R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`). Any presigned-URL flow
  for ownership-doc upload or admin preview is expected to fail
  locally. Findings from the claim flow will note R2-vs-other
  causes.

---

## Did-not-test

- **Resources page** (`/resources`) — never opened in this pass.
- **Forgot password / reset** — saw the page, didn't run a code
  through it.
- **Owner search** (`/onboarding/owner` proper) — went straight to a
  company profile and clicked Claim instead.
- **Investor onboarding** (`/onboarding/investor`) — out of scope
  (founder pass).
- **Admin queue** (`/admin/submissions`) — out of scope; the
  ownership PDF I uploaded is sitting in `pending` for a future
  admin-flow pass.
- **Multi-page `/me/submissions`** — only one row to look at; no
  pagination/empty-state interactions.
- **Real intake submission for the new "Priya Test Founder"
  account** — the Priya quick-test fixture short-circuited to
  `/plan/fp_priya` (per B9) so we never exercised the path where a
  newly signed-up user fills the form *manually* and gets their
  own freshly generated `fp_*` passport. Worth a follow-up pass.
- **R2 file durability** — DB row has the right `r2_key` but I did
  not confirm the actual PDF exists at that key in R2 (would need
  `wrangler r2 object get` against the `atlas-ownership-docs`
  bucket).
- **Mobile widths for the claim flow and settings** — checked
  desktop only.
- **Keyboard navigation / screen-reader pass** — full a11y review
  is out of scope here; the `a11y-reviewer` agent should follow up.

---

## Summary

**Pass scope:** 10 of 10 planned flow steps walked. Persona: Priya
(both as a fresh-signed-up account modeled on Priya Mehta and as
the seeded `priya@persona.test` / `fp_priya`).

**Findings tally:** **11 bugs** (1 blocker, 6 major, 4 minor) and
**1 polish item** plus **1 a11y/responsive item**. The product is in
remarkably good shape for an end-to-end walk — most failures are
header-level cross-cutting (B6/B10), not page-specific.

**Top three things to fix first** (highest leverage, smallest blast
radius):

1. **B6 + B10 together — header doesn't reflect auth state, and
   there's no sign-out anywhere.** This is the single most jarring
   thing in the flow because it touches every page. Fix the shared
   header to (a) read the session, (b) replace "Sign in / Claim a
   company" with an authenticated user menu, and (c) include
   "Sign out" as a menu item. One PR, fixes both.

2. **B8 — "Email <addr>" CTAs in the plan should be `mailto:`.**
   The plan is the founder's most-visited page and the email links
   look like primary actions. Right now the link text says "Email"
   and the click goes to a website. This is the highest-impact UX
   bug, easy fix in `ResultsView.tsx`.

3. **B7 — "9 things you don't need" reasons explain matches, not
   skips.** Founders read this section to learn how Atlas thinks.
   Right now it tells them, in effect, "we don't need Wildcat
   MicroFund because it covers what you need" — which is the
   opposite of useful. Replace with a dedicated
   `explainSkip(resource, passport)` that picks the strongest
   negative signal.

After those, B1 (hardcoded `1,247` companies stat doesn't match the
220-row DB), B4 (`AUTH_SKIP_OTP` shortcut still routes to the
verify screen), and B9 (persona quick-test sends signed-in users to
someone else's plan) round out the must-fix list before launch.
