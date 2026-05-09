# E2E Investor Flow — Findings 2026-05-09

**Personas exercised:**
- `Casey Reyes` / `casey.reyes.e2e+wt1-1778344178@e2e.test` — fresh
  signup as `investor`, taken through onboarding + public profile
  edit (unverified state).
- `deals@pelion.test` (D. Ortiz, Pelion Ventures) — seeded verified
  investor, used for watchlist + outbound intro brokerage.
- `scout@slangels.test` (Casey Lin, Salt Lake Angels) — seeded
  verified investor, used to verify inbound intro visibility.
- `admin@goed.test` (Sarah Chen, GOEO) — seeded admin, used to
  Accept + Decline intros.
- Anonymous (cookies cleared) — used for directory and profile
  visibility checks.

**Branch:** `investor-qa-e2e` (worktree wt1).
**Test surface:** PR #52 (investor public surface + intro brokerage)
plus everything wired into the investor role — sign-up,
onboarding, settings, watchlist, header.
**Browser tool:** `agent-browser` (Chromium via CDP), driven at
1280×900 desktop and 375×812 mobile.
**Env:** `AUTH_SKIP_OTP=true`, `MAILPIT_URL=http://localhost:8026`
in `.dev.vars` (mailpit not started in this run — relevant only
to the spot-check noted at the bottom).

Severity rubric: **blocker** = investor cannot complete the flow ·
**major** = wrong data / role gate hole / breaks responsive at
375px / silent failure that traps a user · **minor** = small
behavioral oddity that confuses but doesn't trap · **polish** =
copy, spacing, label issue · **a11y** = keyboard / screen-reader /
focus / dialog issue · **dev-DX** = developer-environment only,
never reaches a user.

---

## Summary

| ID | Severity | Area | One-liner |
| - | - | - | - |
| [B-Auth-1](#b-auth-1) | major | sign-up | `AUTH_SKIP_OTP=true` signup still redirects to `/sign-up/verify` "Check your inbox", trapping the user even though the session is set |
| [B-Header-1](#b-header-1) | major | header | Header keeps "Sign in" / "Claim a company" CTA after a successful sign-in or sign-up until a manual reload |
| [B-NavMenu-1](#b-navmenu-1) | major | nav | Investor user has no in-app entry point to Saved / Intros / Public profile — neither user menu nor primary nav links there |
| [B-OnDone-1](#b-ondone-1) | major | onboarding/done | "Your map is filtered to match your preferences" promise on `/onboarding/done` is not actually wired; the map ignores investor preferences |
| [B-Confirm-1](#b-confirm-1) | minor / a11y | watchlist | Unsave uses native `window.confirm()` — modal blocks programmatic testers and feels dated against the rest of the UI |
| [B-OwnProfile-1](#b-ownprofile-1) | minor | profile | Owner viewing their own investor profile sees "Request intro through GOEO" buttons (twice) instead of an Edit affordance |
| [B-IntroSuccess-1](#b-introsuccess-1) | polish | intro | After intro submit, "✓ Request sent" success text is concatenated into the metadata line, not a banner |
| [B-IntroDup-1](#b-introdup-1) | minor | intro | Duplicate intro: dialog stays open with Send re-enabled, lets the user keep clicking; prior success banner still visible |
| [B-IntroTabs-1](#b-introtabs-1) | a11y | intros queue | Active tab is rendered as plain text instead of a link with `aria-current=page` |
| [B-EditLabels-1](#b-editlabels-1) | polish | profile editor | Slug / Tagline / Bio field labels are visually concatenated with their help text ("Slug Lowercase letters, digits, and hyphens.") |
| [B-Step-1](#b-step-1) | polish | progress meter | "Step 2 of 3" appears on both `/sign-up/account` and `/onboarding/investor` — distinct journeys re-using the same counter |
| [B-VerifyCopy-1](#b-verifycopy-1) | polish | sign-up | "Send verification code →" CTA copy on the account form is misleading when `AUTH_SKIP_OTP=true` (no code is ever sent) |
| [B-WatchlistCol-1](#b-watchlistcol-1) | polish / a11y | watchlist | `/me/saved` table has an unlabeled `<th>` for the actions column |
| [B-OnDoneCTAs-1](#b-ondonectas-1) | polish | onboarding/done | Done page only offers Map + Settings; an investor would naturally want Directory / Saved / Public profile |
| [B-DevSrv-1](#b-devsrv-1) | dev-DX | local dev | wt1's PORT=3001 is squatted by another local Next project; the wt1 server silently falls through to 3000 with `BETTER_AUTH_URL` mismatched |

A11y / cross-cutting observations and a "things that work well"
section follow the bug write-ups.

---

## Bugs (broken or wrong behavior)

### <a id="b-auth-1"></a>B-Auth-1 — Skip-OTP signup dead-ends on `/sign-up/verify`
- **Severity:** major (UX blocker for skip-OTP dev flows; likely
  identical pattern in prod against real OTP).
- **Where:** `app/sign-up/account/page.tsx:93` —
  `router.push(`/sign-up/verify?${sp.toString()}`)` is unconditional.
  `auth.ts:33,97` shows the server-side skip-OTP gate is real.
- **Steps:**
  1. With `AUTH_SKIP_OTP=true`, `npm run dev`, hit
     `/sign-up/account?role=investor`.
  2. Fill name / email / password / agree, click "Send
     verification code →".
- **Expected:** Land on `/onboarding/investor` (or `/onboarding/done`
  if investor has a profile). Better Auth has set the session
  cookie and `requireEmailVerification` is false on the server.
- **Actual:** Land on `/sign-up/verify?email=…&role=investor`
  showing "We sent a code to …" with only a "Wrong email?"
  button. The session cookie *is* set (verified by decoding
  `atlas.session_data` — `role: investor`, valid expiresAt) and
  the account row exists; the user simply can't see this. The
  only way forward is to hand-type `/onboarding/investor`.
- **Suggested fix:** Either gate the client-side redirect on the
  same `AUTH_SKIP_OTP` flag (cleanest: have the sign-up API
  response include `verified: true|false` and route accordingly),
  or branch in `account/page.tsx` based on the auth response.
- **Adjacent issue:** Production users (no skip-OTP) hit the
  verify screen which is *correct* for them, but the verify page
  has no "Resend code" affordance and no inline code input
  visible above the fold — worth a separate look at the verify
  screen UX (out of scope of this run).

### <a id="b-header-1"></a>B-Header-1 — Header doesn't refresh after sign-in / sign-up
- **Severity:** major (every newly authenticated user sees a
  conflicting "Sign in" CTA on their first page after auth).
- **Where:** `app/layout.tsx` `loadHeaderUser()` + `SiteNav` /
  `UserMenu`. Likely a `cache()` hit / RSC tree caching of the
  layout when the auth client does a `router.push` instead of a
  full navigation.
- **Steps:**
  1. Anon, hit `/sign-in`.
  2. Submit valid credentials.
  3. Land on `/`.
- **Expected:** Header shows "Account menu for D. Ortiz (Pelion)"
  immediately.
- **Actual:** Header still shows "Sign in" link + "Claim a company →"
  CTA. A manual reload fixes it. Same behavior after sign-up:
  the user lands on `/sign-up/verify` with header still showing
  "Sign in".
- **Suggested fix:** After successful sign-in / sign-up, call
  `router.refresh()` (server) before / instead of `router.push()`,
  or do a hard navigation. Alternatively, expose the user state
  to a client subscriber so `UserMenu` can react without a full
  RSC reload.

### <a id="b-navmenu-1"></a>B-NavMenu-1 — Investor has no nav path to Saved / Intros / Public profile
- **Severity:** major (the three core investor surfaces are
  unreachable from the chrome — every investor will have to
  remember the URLs or be sent links).
- **Where:** `components/site/NavLinks.tsx` (primary nav) and
  `components/site/UserMenu.tsx` (dropdown).
- **Steps:** Sign in as `deals@pelion.test`. Look at the header.
- **Expected:** Either primary nav or user menu links to
  `/me/saved`, `/me/intros`, `/me/investor`, `/investors`
  (directory).
- **Actual:** Primary nav shows only Atlas / Map / Resources /
  For agents — no `/investors` directory entry even though it's
  a public surface. User menu shows only Settings + Sign out.
  The only way to reach the watchlist / intros queue / own
  public profile is to type the URL or click "Manage your public
  profile →" deep inside `/settings`.
- **Suggested fix:** Add per-role items to the user menu —
  for an investor, "Saved companies", "My intros", "My public
  profile". Add an "Investors" link to primary nav (same
  treatment as the founder-facing "Resources").

### <a id="b-ondone-1"></a>B-OnDone-1 — "Your map is filtered to match your preferences" promise is unfulfilled
- **Severity:** major (false marketing — the user submitted a
  preferences form and the next screen claims it's been applied,
  but the map ignores it).
- **Where:** `app/onboarding/done/page.tsx`. The wiring of
  investor preferences → map filters is on the post-launch
  Phase 5b backlog.
- **Steps:**
  1. Onboard as a fresh investor with non-default preferences
     (e.g. Angel, Pre-seed/Seed, Wasatch Front only).
  2. Land on `/onboarding/done`. Click "Open the map →".
- **Expected:** Map is filtered to Wasatch Front pre-seed /
  seed companies, or at least visually highlights them.
- **Actual:** Map opens unfiltered. The "Your map is filtered…"
  copy is an empty promise.
- **Suggested fix:** Either wire the filter (carry preferences as
  a default URL filter on the map for investor users) or rewrite
  the copy to "Your preferences are saved — the team is wiring
  them into the map next" / similar honest framing.

### <a id="b-confirm-1"></a>B-Confirm-1 — Unsave uses `window.confirm()`
- **Severity:** minor / a11y (jarring native dialog; blocks
  programmatic test harnesses; doesn't theme with the rest of
  the UI).
- **Where:** `app/me/saved/_components/SavedRowActions.tsx:48` —
  `if (!confirm("Remove from saved?")) return;`.
- **Steps:**
  1. Visit `/me/saved`, click Unsave on a row.
- **Expected:** Inline confirmation (e.g. "Are you sure?" toggle
  button) or a styled modal — consistent with Atlas's other
  destructive affordances. Or just unsave with a toast +
  undo button (preferable; Save is one click, Unsave should
  be one click).
- **Actual:** Native browser confirm dialog. Also blocks browser
  automation: I had to override `window.confirm = () => true`
  via JS eval to test the unsave path. Per CLAUDE.md guidance
  on agent-browser, native dialogs are anti-pattern in this
  codebase.
- **Suggested fix:** Replace with the inline confirm pattern
  used elsewhere, or a toast + undo. If kept, there's no
  loading state on the button while the DELETE is in flight —
  also worth fixing.

### <a id="b-ownprofile-1"></a>B-OwnProfile-1 — Owner sees "Request intro" buttons on their own profile
- **Severity:** minor (confusing, not blocking).
- **Where:** `app/investors/[slug]/page.tsx` — the page is the
  same for owner / admin / anon.
- **Steps:**
  1. Sign in as `deals@pelion.test`.
  2. Visit `/investors/pelion`.
- **Expected:** "Request intro through GOEO" replaced by an
  "Edit profile" CTA (or hidden) when the viewer is the owner.
- **Actual:** Hero and Contact section both show "Request intro
  through GOEO" buttons that, if clicked, open a self-intro
  dialog. (POST behavior to self not exhaustively tested — out
  of scope; the UI lets you start the request, which is
  already wrong.)
- **Suggested fix:** Detect `viewerInvestorId === profile.id` in
  the page server component and swap the CTA. Same change
  applies to "View public profile" being more useful than
  "Request intro" for the owner.

### <a id="b-introsuccess-1"></a>B-IntroSuccess-1 — Intro success message glued to metadata line
- **Severity:** polish.
- **Where:** `app/investors/[slug]/_components/RequestIntroDialog.tsx`
  (or sibling) — the success state collapses the dialog and
  appends a text fragment to the hero meta line.
- **Steps:**
  1. Sign in, request an intro from `/investors/salt-lake-angels`.
  2. After submit, look at the hero.
- **Expected:** Standalone confirmation banner / toast.
- **Actual:** The hero meta line reads
  `Wasatch Front · $25k–$250k · updated 2026-05-09 ✓ Request sent. We'll email you when GOEO reviews it.`
  — visually OK on desktop because of an inline-block break,
  but accessibility-tree is a single text node. On a small
  viewport it wraps awkwardly.
- **Suggested fix:** Render the success state as its own
  `<p role="status">` callout above or below the hero; clear it
  after a few seconds or when the user navigates.

### <a id="b-introdup-1"></a>B-IntroDup-1 — Dup intro request doesn't lock the dialog
- **Severity:** minor.
- **Where:** Same dialog as B-IntroSuccess-1.
- **Steps:**
  1. Submit one intro to `/investors/salt-lake-angels` (success).
  2. Click "Request intro through GOEO" again.
  3. Type a new message and click Send.
- **Expected:** Either the button "Request intro" is hidden /
  replaced by "Pending review" once a request exists, or the
  dialog detects the dup state on open and disables Send with
  a callout.
- **Actual:** Dialog opens fresh, Send becomes enabled at 20+
  chars. After click, the API correctly returns 409 and the
  UI shows "You already have a pending intro request to this
  target." but **Send stays enabled** and the prior success
  banner ("✓ Request sent…") is still visible in the meta line
  — combined, it reads contradictorily as "Request sent, but
  also you already have a pending request".
- **Suggested fix:** Disable Send while the dup-error callout
  is shown. Better: prefetch existing pending requests for the
  current viewer/target pair on profile load and toggle the
  CTA to "Pending — view in your queue" with a link to
  `/me/intros?tab=outbound`.

### <a id="b-introtabs-1"></a>B-IntroTabs-1 — Intros queue active tab is plain text
- **Severity:** a11y / polish.
- **Where:** `app/me/intros/page.tsx`.
- **Steps:**
  1. Visit `/me/intros` (default outbound).
  2. Inspect the Outbound / Inbound tabs.
- **Expected:** Both rendered as `<a aria-current="page">` /
  `<button role="tab" aria-selected>`, visually styled to show
  selection.
- **Actual:** Active tab is rendered as plain text (e.g.
  `Outbound (2)` link only when on the inbound tab; on
  outbound tab it's just text "Outbound (2)"). Inverse for
  Inbound. Screen readers don't announce tab selection.
- **Suggested fix:** Use the same accessible-tab pattern as
  the founder plan / settings pages, with consistent `aria-current`
  behavior on both tabs.

### <a id="b-editlabels-1"></a>B-EditLabels-1 — Profile editor labels concatenated with help text
- **Severity:** polish.
- **Where:** `app/investors/[slug]/edit/_components/InvestorPublicEditor.tsx`
  (or whatever component renders the inputs).
- **Steps:** Visit `/investors/<your-slug>/edit`. Snapshot the
  Slug, Tagline, and Bio fields.
- **Expected:** Label is on its own line, help text is a
  `<p class="text-xs text-ink-3">` underneath.
- **Actual:** The accessible-name reads as the concatenation:
  - "Slug Lowercase letters, digits, and hyphens."
  - "Tagline One line. Shows under your name on the profile."
  - "Bio A few short paragraphs. Plain text — no HTML."
  Visually they may render OK because of layout, but for screen
  readers and copy/paste they're one string. The same form
  shows the "Display name" label cleanly so the pattern exists.
- **Suggested fix:** Use `<label>` + sibling `<p class="hint">`
  with `aria-describedby` on the input — don't put the help
  text inside the `<label>` content.

### <a id="b-step-1"></a>B-Step-1 — "Step 2 of 3" appears in two unrelated journeys
- **Severity:** polish.
- **Where:** `app/sign-up/account/page.tsx` ("FOUNDER · step 2 of 3")
  and `app/onboarding/investor/page.tsx` ("Investor · step 2 of 3").
- **Expected:** Either share a unified meter (Role → Account →
  Onboarding) or distinguish them ("Onboarding · 1 of 1" or
  drop the step counter on the onboarding page entirely).
- **Actual:** A user who signs up and immediately starts
  onboarding sees two consecutive screens both marked "step 2
  of 3", with totally different "step 3"s implied (Verify vs.
  whatever the onboarding tail is). Confusing.
- **Suggested fix:** Drop the step counter on `/onboarding/<role>`
  unless onboarding becomes multi-step.

### <a id="b-verifycopy-1"></a>B-VerifyCopy-1 — "Send verification code" copy is wrong under skip-OTP
- **Severity:** polish (only in dev / staging where skip-OTP is on).
- **Where:** `app/sign-up/account/page.tsx` button text.
- **Expected:** Either the button text is conditional ("Create
  account →" when skip-OTP, "Send verification code →" otherwise)
  or the page reuses a generic "Continue →".
- **Actual:** Always reads "Send verification code →" even when
  no code is ever generated.
- **Suggested fix:** Same gate as B-Auth-1 — branch the UI on
  whether OTP is required.

### <a id="b-watchlistcol-1"></a>B-WatchlistCol-1 — Unlabeled actions column on the watchlist table
- **Severity:** polish / a11y.
- **Where:** `app/me/saved/page.tsx` (table header markup).
- **Steps:** Visit `/me/saved` on desktop (≥768px). Inspect
  the `<thead>`.
- **Expected:** Final `<th>` either says "Actions" or contains
  `<span class="sr-only">Actions</span>`.
- **Actual:** Final `<th>` is empty (`columnheader` with no
  text in the snapshot).
- **Suggested fix:** Add visually-hidden text for screen readers,
  or just label the column "Actions".

### <a id="b-ondonectas-1"></a>B-OnDoneCTAs-1 — Onboarding-done CTAs aimed at founders, not investors
- **Severity:** polish.
- **Where:** `app/onboarding/done/page.tsx`.
- **Expected:** For an investor, the natural next steps are
  "View the investor directory", "Edit your public profile",
  "Browse companies (saved companies start here)", or "View
  your intros queue (if any)".
- **Actual:** Two CTAs only — "Open the map →" and "Or visit
  settings →". The map CTA also reinforces B-OnDone-1 (claiming
  filtering that doesn't work).
- **Suggested fix:** Branch the Done page on role. Investors
  should land on something like:
  ```
  → Edit your public profile
  → Browse the investor directory
  → Open the map
  ```

### <a id="b-devsrv-1"></a>B-DevSrv-1 — wt1's PORT=3001 is squatted; dev silently falls through
- **Severity:** dev-DX.
- **Where:** `package.json` `dev` script + `.env.local`
  `PORT=3001`. CLAUDE.md "Worktree port table" relies on the
  port being free.
- **Repro (this machine):**
  1. `prepa-nav-web-wt1` is already running on `:3001`.
  2. Run `npm run dev` in `startup-state-atlas-wt1` without
     overriding `PORT`. Next.js (or the `dev` runner) silently
     starts on `:3000` (or another fallback) instead of erroring.
  3. `BETTER_AUTH_URL=http://localhost:3001` in `.dev.vars`
     points at the wrong server. Better Auth logs
     "Base URL could not be determined" warnings every request.
     Sign-up still half-works (cookie set), but anything that
     does a callback or relies on the canonical URL is fragile.
  4. wt2's dev server (port 3000) is on a different branch and
     does *not* have `/me/investor`, `/me/saved`, `/me/intros`
     — but a new agent might think it's their wt1 server and
     spend ten minutes debugging the 404.
- **Suggested fix:** Have `npm run dev` check the configured
  PORT and exit non-zero with a friendly message if it's
  already in use by something other than its own previous
  instance. Set `BETTER_AUTH_URL` from the actual listening
  port (or read from `process.env.NEXT_PUBLIC_SITE_URL`).
  Possibly add a small smoke test: GET `/api/auth/get-session`
  on dev start and warn if the URL Better Auth is using
  doesn't match the listening port.

---

## Quirky UX

- **Type vs Stages buttons look identical** but are different
  cardinalities — Type is single-select, Stages and Sectors are
  multi-select. There's no visual cue (chips vs radios). Users
  may not realize they can pick multiple stages/sectors.
- **Default investor preferences feel "founder-y"**: VC + Seed +
  B2B SaaS + Wasatch Front are pre-selected. Reasonable, but
  a brand-new investor who clicks Save without changing
  anything ends up with "VC writing $100k–$1M Wasatch Front
  Seed B2B SaaS checks" — a generic profile that may not match
  them. Either ship with no defaults, or with a "this is a
  starting point — edit any of these" hint.
- **`/me/investor` invisibly bootstraps a slug.** It's a great
  feature, but the user has no idea their slug was generated
  from their displayName until they land on the editor page.
  A "We've reserved `/investors/<slug>` for you — change it
  here" callout would help.
- **Public profile preview at the top of editor.** The editor
  shows a code snippet of the slug ("This is what founders
  …will see on `/investors/<slug>`") but no actual rendered
  preview. A "View public profile →" link is at the bottom —
  could be at the top so users can flip back and forth as they
  edit.
- **Intro dialog opens inline** (replacing the hero CTA area)
  rather than as a modal. This is fine on desktop but on mobile
  it feels like a navigation step (because the request body
  pushes the rest of the profile down). Either treat it as a
  proper modal sheet on mobile or keep it inline but anchor
  the page scroll position so the user doesn't lose context.
- **Empty inbound queue is silent.** `/me/intros?tab=inbound`
  with 0 items just shows the tab — no copy explaining "Once
  GOEO accepts an intro to you, it'll appear here." Same for
  empty Outbound.
- **No sort / filter on watchlist.** With three saved companies
  it's fine; with thirty an investor will want sort by sector,
  filter by stage, search by name. Probably future work.

---

## Polish

- Save-button toggle from "+ Save" to "✓ Saved [pressed]" is
  great, but no loading state during the in-flight POST. On a
  slow network the button can feel non-responsive.
- "Outbound (2)" / "Inbound (0)" tab counts re-render correctly
  after admin actions — nice. Could highlight when count
  changes (notification dot).
- Verified directory header reads "2 verified Utah-active
  investors" — accurate but pluralization will need attention
  for "1 verified".
- Profile editor "✓ Saved." confirmation is small and easy to
  miss; consider a subtle slide-down toast.
- The `/admin/intros` queue page shows requester email
  (`deals@pelion.test`) and target email
  (`scout@slangels.test` for verified investors) — correct for
  admin's eyes, just noting it's clearly inside a privileged
  view.
- "Step 2 of 3 · INVESTOR" formatting on the account page uses
  uppercase "FOUNDER" / "INVESTOR" / "OWNER" depending on the
  role param. Consistent and reads well.

---

## Things that work well

- **Public profile pages** render cleanly with hero, focus
  chips (stage / sector / geo), check size, contact section,
  and an Agent Card sidebar listing the `.md` / `.json` /
  API URLs. Verified vs unverified styling is clear.
- **Email redaction is rigorous.** The HTML, Markdown, and
  JSON variants all redact owner email; the `/investors`
  directory only lists verified profiles; unverified profiles
  return 404 to anon and require owner-or-admin auth to view.
  The Contact section explicitly explains the GOEO-mediated
  intro flow instead of leaking contact info.
- **Watchlist save / note / unsave** persistence is solid.
  Save state survives navigation (Alysio profile shows
  "✓ Saved [pressed]" after returning to it). Inline note
  edit with character count is clean.
- **Intro brokerage end-to-end** works exactly as designed:
  1. Pelion submits two intros (one to SL Angels, one to
     Alysio) — both land in `/me/intros?tab=outbound` as
     pending.
  2. Sarah (admin) sees both in `/admin/intros` with a
     count badge ("2 pending"), reviews each at
     `/admin/intros/[id]`, accepts one with a note ("Worth
     a 30-min call. Both write Wasatch Front pre-seed
     checks."), declines the other with a different note.
  3. The detail page replaces the action buttons with a
     **Review history** block showing status + actor +
     timestamp + admin note.
  4. Pelion's outbound queue updates — both intros now show
     `accepted` / `declined` with the GOEO note inlined.
  5. SL Angels' inbound queue shows the accepted intro with
     full requester contact info and the GOEO note. Pre-accept,
     SL Angels saw nothing in inbound (privacy holds).
- **Admin review screen** (`/admin/intros/[id]`) has very
  good IA: requester block (name / email / role at request
  / current role) + target block (name / profile link /
  contact email / type / verification status / owner name)
  + message blockquote + 3-action panel with explanatory
  copy underneath. Strong work.
- **Duplicate-pending guard** on intro requests works at the
  API layer (409) and produces a user-readable error in the
  dialog. Just needs the polish items in B-IntroDup-1.
- **Slug auto-bootstrap** from `displayName` /  `firmName`
  via `ensureInvestorSlug` produces clean values
  (`Reyes Family Capital` → `reyes-family-capital`).
- **Mobile responsiveness at 375px** — 0 horizontal overflow
  on `/investors`, `/investors/[slug]`, `/sign-up`, `/sign-in`,
  `/onboarding/investor`, `/me/intros`, `/me/saved`,
  `/settings`, `/investors/[slug]/edit`, `/admin/intros`.
  `/me/saved` correctly collapses from a desktop table to a
  stacked-card layout.
- **Sign-in to request** progressive enhancement: anon viewers
  see "Sign in to request →" instead of the "Request intro
  through GOEO" button. Clear, no dead-end state.
- **Verified vs unverified visibility** is enforced
  consistently across `.html` / `.md` / `.json` and the
  directory listing. Confirmed Kickstart Fund (unverified
  in seed data) is not in `/investors`.
- **Settings page** is well-structured with a left-rail TOC
  (Profile / Security / Investor preferences / Notifications /
  Agent tokens / Danger zone), and the investor-preferences
  section mirrors the onboarding form so users can tweak
  without leaving Settings.
- **Sign out** via user menu works — clean session clear,
  redirect to `/`, header reflects anon state immediately.
- **`/onboarding/investor` form** is fast and clean with sane
  defaults, character-aware fields, and visible focus state.

---

## Coverage table

| Area | Status |
| - | - |
| A. Sign-up & onboarding (fresh investor) | ✓ (Casey Reyes signed up + onboarded; B-Auth-1, B-VerifyCopy-1, B-Step-1) |
| B. Public profile editor | ✓ (Reyes Family Capital edited; B-EditLabels-1) |
| C. Directory + profile (anon + signed-in) | ✓ (anon, signed-in-as-other, signed-in-as-self all checked; B-OwnProfile-1 found) |
| D. Watchlist (saved companies) | ✓ (3 companies saved, 1 noted, 1 unsaved; B-Confirm-1, B-WatchlistCol-1) |
| E. Intro brokerage (requester) | ✓ (intro to investor + company + dup; B-IntroSuccess-1, B-IntroDup-1, B-IntroTabs-1) |
| E. Intro brokerage (admin + inbound) | ✓ (Sarah accept + decline; SL Angels inbound view) |
| F. Settings + sign out | ✓ (B-NavMenu-1) |
| G. Mobile pass (375 px) | ✓ (no overflow on any tested page) |
| OTP path spot-check | ✗ — not run this session. The verify screen itself was hit (under skip-OTP) and renders correctly except for B-Auth-1; running through real-OTP would require restarting the dev server with `AUTH_SKIP_OTP` unset and starting `mailpit --listen 0.0.0.0:8026 --smtp 0.0.0.0:1025`. The findings here are independent of that path. |

---

## Notes on environment encountered during this run

- The wt1 dev server I started on port `3009` (workaround for
  B-DevSrv-1) appears to have died at some point near the end
  of the session (likely an OOM or hot-reload crash; the wt1
  process was no longer in the listening port table when I
  tried a final email-redaction sanity curl). Earlier in the
  session the same instance had served every page tested above,
  so the bugs are not artifacts of a flaky server.
- Hot-reload occasionally rebuilt the layout between steps;
  no observable functional impact on the bugs above.
- Console logs across all pages were clean — no React
  warnings, no hydration errors, no failed network requests
  (other than the expected 404s on unverified profile probes
  and the expected 409 on the duplicate intro request). The
  only repeated server-side log was the
  `[Better Auth]: Base URL could not be determined`
  warning — see B-DevSrv-1.
