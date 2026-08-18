# EduBD — Project Status & Upgrade Plan

_Last updated: 2026-08-17. This file is a handoff document — if you're picking this project
up in a new chat, read this first. It covers what's already been done and what's proposed
next, so you don't need the history of the previous conversation to have full context.
Phases 1–3 below (the original roadmap) are all complete. Phases 4–7, added 2026-08-15,
come from two follow-up passes: a full security/code audit and a market-research pass
benchmarking against Bangladesh's actual dominant platform (10 Minute School) and 2026
e-learning UX conventions generally — not generic trend-chasing. Both source reports are
fuller than this summary if you want the full reasoning behind any item here._

---

## 1. Where the project stands right now

### Bug fixes completed

_(Verified via `php -l` across all PHP files and a real `vite build` across all
JS/JSX — not just per-file syntax checks.)_

- Fixed a fatal PHP error in `AbandonedCheckoutReminder.php` (untyped readonly property)
  that silently killed the entire hourly abandoned-checkout reminder job.
- Fixed `AdminController::refundPayment()` crashing on bundle refunds; added a proper
  `payment_id` column on `enrollments` (migration `000033`) so refunds can reliably tell
  which enrollments a given payment actually created, instead of guessing.
- Fixed instructor earnings/payout calculations silently excluding all bundle-driven
  revenue (`PayoutController::availableBalance()`, `AdminController::user()`,
  `AuthController::instructorOverview()` — all three now sum `Enrollment.amount_paid`
  instead of `Payment.amount`).
- Implemented real Nagad RSA sign+encrypt (was a placeholder with empty fields) —
  crypto-verified with a round-trip test, but the exact field names should still be
  confirmed against your merchant portal before going live (Nagad has more than one
  documented API variant).
- Fixed 6 occurrences of `unsignedDecimal()` across 3 migrations — removed in Laravel 11.
  This was caught by actually running the migration, not by static review; worth
  remembering if anything else surfaces the same way.
- Fixed `setup.sh`'s database password generator (was pure lowercase hex, which can
  never satisfy MySQL's `validate_password` policy) and restructured `setup.bat`, which
  was missing `php artisan migrate` entirely and referenced a seed file that doesn't exist.
- Wired up CMS content that was being saved but never displayed anywhere (About, Terms,
  Privacy — the latter two didn't have pages or routes at all). Also fixed the identical
  bug in `Mission.jsx`, found while fixing About.jsx.
- Added the missing `user_id` restriction check to the public coupon-preview endpoint,
  fixed the effective-price mismatch in the course coupon preview, sanitized blog content
  on save and fixed it to actually render as HTML, fixed the silent dead-end when an
  unenrolled user opens a locked lesson, and turned off the email-verification bypass in
  production (was unconditionally auto-verifying every account).

### Full visual redesign completed (100% of pages + components, including Admin)

Palette and typography grounded in Bangladeshi textile heritage (nakshi kantha
embroidery, jamdani weaving, indigo dye history) rather than generic 2026 trend colors —
full reasoning and the original concept mockup are further back in the prior chat history
if needed, but the short version:

- **Colors**: `resources/js/lib/theme.js` is the single source of truth (`C.indigo`,
  `C.red` — CTAs only, `C.gold`, `C.green`). *Correction made 2026-08-05: this section
  previously described the naming as `C.p`/`C.a`/`C.g`/`C.y` and claimed dedicated
  plum/teal/sienna category-coding tokens in theme.js — neither matches the actual file.
  The short `p`/`a`/`g`/`y` names, and the plum/teal/sienna-family hues, are real, but
  they live in each page's local per-page color object (see below), not in theme.js
  itself. The underlying hex values are consistent between theme.js and the local
  copies, which is the part that matters; the naming description was just wrong.*
  Every page previously had its own duplicated color object; they still do locally
  (existing pattern, left as-is to keep the diff reviewable) but all values now match
  `theme.js`.
- **Type**: Fraunces (display/headings) + Inter (body/UI), loaded in
  `resources/views/app.blade.php`. Applied to marketing-page headings and every page's
  logo wordmark; deliberately **not** applied to dense functional UI (Learn.jsx's
  in-player lesson titles, Dashboard/Admin section headings) to protect legibility.
- ~~**Signature element**: a "stitched path" motif...~~ *Correction made 2026-08-05:
  no such motif exists anywhere in the codebase — verified via a full-repo search, only
  dashed-stroke SVG usage found is an unrelated circular progress ring in Dashboard.jsx.
  This looks like a planned element that was never actually implemented. Flagging as a
  real idea worth doing rather than deleting it outright.*
- Real third-party brand colors were deliberately left untouched: bKash (`#E2136E`),
  Nagad (`#F6921E`), and the Facebook/Twitter/LinkedIn share-button colors in Blog.jsx,
  plus a Google-search-result preview mockup that intentionally mimics Google's own
  link styling.
- Every page verified via a real `npm run build` (1546 modules, 0 errors) after every
  batch of changes, not just at the end.

### Known environment limitation (relevant if you hit something new)

Claude's sandbox can install PHP, Composer, and SQLite via `apt`, but **cannot reach
`repo.packagist.org`** — so `composer install` fails and a full Laravel runtime
(real `artisan migrate` against a real app, not just linting) isn't achievable inside
that sandbox. This is why the Laravel 11 `unsignedDecimal()` bug wasn't caught until you
ran it yourself. If something works in review but breaks when you actually run it, that's
the most likely category of issue — and it's genuinely useful signal, not a sign the
review was sloppy.

**Confirmed exactly this, 2026-08-10**: your first real `bash setup.sh` run (the first
time any of Phase 2/3's migrations touched a real database) applied all five new
migrations cleanly — genuinely good signal — but then hit `ERROR 1062: Duplicate entry
'1' for key 'roles.PRIMARY'` on the sample-data import. Root cause, found by actually
reading `setup.sh` and `edubd_seed_data.sql` fresh rather than guessing: **two parallel,
non-overlapping data-seeding mechanisms exist in this codebase.** `setup.sh` never calls
`php artisan db:seed` — it only imports `edubd_seed_data.sql` directly via raw `mysql`.
That means every Eloquent PHP seeder edited across this whole project (`CategorySeeder`'s
Job Prep category, `BadgeSeeder`'s 8 badges, `SiteSettingSeeder`'s referral rate) was
**never actually reaching a real database** — only this SQL file was. Fixed two things:
(1) added the missing category/badges/setting directly to `edubd_seed_data.sql` so
they're actually present after setup, and (2) changed every `INSERT INTO` in that file to
`INSERT IGNORE INTO` and removed the plain-INSERT approach that broke on any re-run
against already-seeded data — re-running `setup.sh` now safely no-ops existing rows and
adds any new ones, which matters concretely for you since you're iterating across
multiple zips and each one may add new seed data the last import didn't have.
**Still true**: the PHP seeders and this SQL file describe the same data through two
disconnected paths — if you add more seed data going forward, both need editing, since
nothing enforces they stay in sync (the badges entry above says so explicitly, as a
reminder for whichever of us touches this next).

---

## 2. Upgrade plan — phased roadmap

Based on researching both general 2026 edtech trends and, more usefully, Bangladesh's
actual dominant platform (10 Minute School — 2M+ daily learners) as a concrete
competitive reference point rather than generic trend-chasing.

### Phase 1 — Quick wins (near-zero engineering cost, do these first)

**Status: done, 2026-08-05.** Both items turned out to need more than "near-zero
engineering cost" implies — see notes under each. Verified via `npm run build`
(1546 modules, 0 errors) after every batch, plus a full `php -l` pass.

1. **Add a "Job Prep / BCS & Bank Jobs" course category.** ✅ Done. Turned out *not*
   to be pure content/no-code: the category list isn't fetched from the `categories`
   table anywhere on the frontend — it's hardcoded in three places (`Courses.jsx`'s
   `CAT_OPTS` filter, and `Home.jsx`'s `MEGA_CATS` + `CATS` arrays), disconnected from
   the DB. Added it to the seeder (`slug: job-prep-bcs-bank`, `Landmark` icon, `#6B2C39`)
   and all three frontend arrays. Not touched: the separate Admin-managed "Mega Menu"
   nav feature isn't seeded in code, so add a nav entry there too if you want one.
   Side note, not fixed: `Courses.jsx` maps live categories via
   `c.category?.name?.split(" ")[0]`, which silently breaks filter-matching for any
   multi-word category name once real API data replaces the mock array — pre-existing,
   affects all categories, not just the new one.
2. **Wire up dark mode.** ✅ Done for 23 of 28 pages. Turned out the toggle being
   unrendered wasn't the real blocker: `DarkModeProvider` was already wired at the
   app root, but **zero components anywhere read the CSS variables** app.blade.php
   defines for `[data-theme="dark"]` — 33 of 34 page/component files hardcode their
   own local `const C = {...}` hex object instead, and there's no shared Nav/Layout
   (21 pages each define their own inline navbar). Built `useThemeColors()` in
   `darkMode.jsx` — same 16-key shape every page's local `C` already uses, dark
   values sourced from app.blade.php's existing dark palette where defined there,
   derived sensibly elsewhere. Applied to each page's navbar + top-level wrapper
   (covers more than just "chrome" on pages that inline a lot of their own markup,
   like Courses.jsx). **Not done — deferred, not attempted:** `Dashboard.jsx`,
   `InstructorDashboard.jsx`, `Admin.jsx` (sidebar app-shell layouts, largest/highest-
   risk files), `Login.jsx` (split `LeftPanel`/`RightPanel` composition — the
   shadow-C-at-the-top trick used everywhere else doesn't reach either panel), and
   `Learn.jsx` (lesson player, already has its own intentional dark sections). These
   five need per-component work, not the mechanical single-line pattern that worked
   for the other 23. Also not covered even on themed pages: deeper sub-components
   within a page (sidebars, cards, modals) that aren't the navbar or the top-level
   wrapper — e.g. `Course.jsx`'s `CourseHero` and `EnrollCard`, or `Login.jsx`'s
   password-strength meter colors.

### Phase 2 — Medium lift, high differentiation

3. **AI doubt-solving assistant, scoped to lesson content.** ✅ Done, 2026-08-06.
   Real gap found while scoping: nothing in the schema stores a transcript for
   video lessons (`lessons.content` only holds real material for `type=text`
   lessons — video lessons have just a `video_url`, no transcript field
   anywhere). Rather than block on adding transcription infrastructure, built
   it to be honest about this instead: `AnthropicDoubtAssistant.php` grounds
   answers in the actual lesson content when it's a text lesson, and for video
   lessons is explicitly told in its system prompt that it only has the
   course/lesson title-level context, not the video content — the UI shows a
   small "based on the course description, not this video's transcript" note
   under those answers rather than letting them look equally confident as a
   grounded one. New tables `doubt_threads`/`doubt_messages` (one thread per
   student per lesson), `DoubtController` (enrollment-gated, same pattern as
   `LessonController::show`), floating chat widget in `Learn.jsx` visible only
   to enrolled users. Defaults to `claude-sonnet-5`, configurable via
   `ANTHROPIC_MODEL`; falls back to a clear "not configured" message rather
   than erroring if `ANTHROPIC_API_KEY` isn't set. **Needs your action:** add
   `ANTHROPIC_API_KEY` to `.env` (get one at console.anthropic.com) — nothing
   else on the site depends on it, so this is safe to deploy without it and
   add later. Daily per-student cap (40 questions) enforced server-side for
   cost control, separate from the burst-rate route throttle.
4. **Affiliate/referral program.** ✅ Done, 2026-08-07. Built as its own set of
   tables (`referral_commissions`, `referral_payouts`, plus `referral_code`/
   `referred_by_user_id` on `users`) rather than extending the existing `payouts`
   table — deliberately, to avoid touching live instructor-payout financial code
   for an unrelated feature; see the migration for the full reasoning. Attribution
   happens at signup (`?ref=CODE` captured on the register form → `referred_by_user_id`
   set); commission is credited in `PaymentController::markPaid()`, the single point
   all three gateways' success callbacks converge on, so it fires uniformly regardless
   of payment method. Commission rate is admin-editable (Admin → Referral Payouts,
   defaults 15%, stored via the existing generic `SiteSetting` system — no new settings
   plumbing needed) and each commission stores the rate it was earned at, so changing
   the rate later doesn't retroactively alter past commissions. New "Refer & Earn" page
   at `/referrals` (link, stats, payout request, history), linked from the dashboard
   sidebar. Admin gets a mirrored payout approve/reject page. **Found and fixed in
   passing:** the existing instructor "Payouts" admin page had no sidebar entry at
   all — reachable by the router but nothing ever linked to it. Added one for it
   alongside the new referral payouts entry.
   *Verification note, 2026-08-06 (see item 3 above): the reusable-pattern claim mostly
   checks out, with one correction — the balance-calculation logic lives in
   `PayoutController::availableBalance()`, not in the `Payout` model itself.*
   **Assumptions made, worth confirming:** commission is earned on *every* purchase
   a referred user ever makes (lifetime), not just their first — easy to change to
   first-purchase-only in `PaymentController::creditReferralCommission()` if that's
   not what's wanted. No fraud detection — a user can create a second account and
   refer themselves; this is a known, accepted limitation of simple referral systems,
   not something this build attempts to solve.
5. **Basic gamification** — completion streaks, badges. ✅ Done, 2026-08-08.
   `GamificationService::recordActivity()` hooks into `LessonController::completeLesson()`,
   inside the existing `if (!$progress->is_completed)` guard so re-completing a lesson
   can't inflate a streak. Streak logic: same-day = no-op, consecutive day = +1, gap = reset
   to 1. 8 starter badges seeded (`BadgeSeeder`) across lessons/streak/courses-completed
   milestones — extendable by adding rows, no code changes needed for new badge
   thresholds within the existing three criteria types. Compact widget on the student
   dashboard (streak counter + badge strip). Kept intentionally light — no new page/route,
   given items 3/4/7 already established the pattern and this needed less surface area.

### Phase 3 — Major infrastructure investments (real scope, not feature flags)

6. **Live classes.** ✅ Done, 2026-08-09. No provider was specified, so I picked one:
   Daily.co, over Zoom/Agora, specifically for integration simplicity — a plain
   Bearer-token REST API with no OAuth flow or client SDK required, and every room is
   itself a complete call UI at its own URL, so the frontend embeds it as a plain
   iframe — same pattern already established for YouTube and Bunny, no new JS
   dependency needed. Verified the API shape (base URL, auth, `/rooms`,
   `/meeting-tokens`) against Daily's current docs before writing `DailyCoService`,
   same approach as item 7's Bunny verification. Built: instructor scheduling
   (course-scoped, reuses the same admin/instructor gate pattern as curriculum
   management), student join flow (enrollment-gated, join button unlocks 10 minutes
   before start), `/live-classes` page adaptive to role. Rooms are created with `exp`
   set to auto-expire/self-clean on Daily's side regardless of whether our own
   cleanup call succeeds. **Needs your action**: `DAILY_API_KEY` + `DAILY_DOMAIN` in
   `.env` — without them, scheduling shows a clear "not configured" message. **Not
   tested against a real Daily account** — same caveat as item 7, no credentials
   available in this environment.
7. **Self-hosted video (move off YouTube embeds).** `Learn.jsx` currently plays lessons
   via YouTube embed (see `getYouTubeId()`). ✅ **Done, 2026-08-07 — reframed on
   investigation**: the "YouTube embed" premise was wrong — VideoPlayer already
   supported direct video files, and zero seeded lessons had any video_url at all,
   YouTube or otherwise. There was also no UI anywhere for an instructor to attach a
   video. Built: Bunny Stream integration (`BunnyStreamService`), instructor-facing
   direct browser-to-Bunny upload via TUS resumable protocol (bypasses PHP upload
   limits entirely — course videos run hundreds of MB to a few GB), status polling
   that auto-fills `video_url` once Bunny finishes transcoding, and a Bunny iframe
   playback path in `VideoPlayer` (avoids needing hls.js for cross-browser HLS
   support — same tradeoff YouTube already had: no progress-tracking through an
   iframe, a real known gap, not fixed here). TUS signature order verified against
   Bunny's current docs directly (not just training knowledge). Found and fixed in
   passing: deleting a lesson never actually cleaned up its remote video — was
   leaking Bunny storage costs indefinitely. **Needs your action**: `BUNNY_API_KEY`
   + `BUNNY_LIBRARY_ID` + `BUNNY_CDN_HOSTNAME` in `.env` (Stream Video Library's own
   key, not the main account key) — without them the upload button shows a clear
   "not configured" message and the existing manual URL-paste field still works.
   **Not tested against a real Bunny account** — no credentials available in this
   environment; the one lowest-confidence detail (TUS signature byte order) is now
   confirmed correct against Bunny's docs, so a first real upload attempt is the
   actual test.
8. **Offline download of lessons.** ✅ Done, 2026-08-09 — scoped deliberately narrower
   than "all video," for a real reason found while building it: fetching video bytes
   as a downloadable blob requires the host's CORS policy to allow cross-origin reads,
   which this app doesn't control. YouTube never allows this (against their ToS
   regardless). Bunny-hosted video goes through an iframe embed (see item 7), which
   isn't a file at all — nothing to fetch. So this only offers "Save offline" for (a)
   text-type lessons, which are fully reliable since the content already comes through
   our own API, no cross-origin issue at all, and (b) video lessons using a directly-
   pasted file URL (the manual "Video URL" field, not Bunny/YouTube) — attempted via
   `fetch()`, honestly surfaced as a failure if the host's CORS policy blocks it rather
   than pretending it always works. Storage is plain IndexedDB (no new dependency) via
   `offlineStore.js`; a `/downloads` page lists, plays, and removes saved lessons,
   working fully offline once loaded since it never touches the network. This is a
   real, working feature for what it covers — not a placeholder — just honestly
   scoped to the subset of content that can actually be downloaded rather than played.
9. **Native mobile app.** The API already exists, so this isn't starting from zero, but
   it's still a separate build (React Native or similar), not a design tweak. Not
   something buildable inside this repo/session — a real separate project.

### Phase 4 — Security & trust fixes (found in the 2026-08-15 audit — do these first, regardless of effort)

**Status: items 10–14 done, 2026-08-16.** Verified via a full `php -l` pass (0 errors) and
a real `npm run build` (1575 modules, 0 errors) after every change, not just at the end —
same discipline as every prior phase in this document.

Unlike Phases 1–3, ordering here is by risk, not cost. Items 10–12 are direct financial-
integrity/account-security issues; fix those before anything in Phase 5 even if Phase 5
looks cheaper.

10. **Payment gateway verification bypass (SSLCommerz + Nagad).** ✅ Done. Neither
    callback (`PaymentController::sslSuccess()` / `nagadCallback()`) checked that the
    gateway's server-to-server verification response actually corresponded to the payment
    it was about to mark paid — only the status field was checked. Fixed by cross-checking
    each verification response's own transaction id *and* amount against the `Payment` row
    before calling `markPaid()`, logging a warning instead if they don't match. Field names
    verified against SSLCommerz's own integration docs (`validationserverAPI.php` returns
    `tran_id`/`amount` at the top level — their own docs state a validation should only be
    trusted "if amount and transaction [id] are valid," which is exactly the check that was
    missing) and a real Nagad PHP SDK's documented `verifyPayment()` response shape
    (`orderId`/`amount` fields), not guessed. bKash was already unaffected (its lookup key
    and its verified id are the same field), left as-is.
11. **Missing role check on two instructor endpoints.** ✅ Done.
    `AdminCourseController::instructorStore()` and all three methods on `PayoutController`
    now check `isInstructor()`/`isAdmin()` before proceeding — same guard pattern already
    used by `CourseCurriculumController`/`LessonVideoController`/`LiveClassController`/
    `QuizManagementController`, just applied consistently now. `PayoutController` got a
    small private `assertInstructor()` helper called at the top of each of its three public
    methods rather than repeating the check inline three times.
12. **Avatar upload accepted SVG (stored-XSS path).** ✅ Done. Added an explicit
    `mimes:jpeg,png,jpg,gif,webp` allowlist (excluding svg) to `AuthController::uploadAvatar()`
    — the self-service path any authenticated user can hit, and the highest-priority of the
    affected fields since it needed no elevated account first. Applied the identical fix to
    the six lower-priority admin-only fields that had the same bare `image` rule
    (`AdminCourseController` + `BundleController` thumbnails, `BlogController`'s
    thumbnail/og_image/twitter_image on both `store()` and `update()`) for consistency,
    since it's the same one-line fix regardless of who can reach the field.
    `PaymentMethodController.php`'s gateway-logo upload still explicitly allows svg —
    left alone since that looked deliberate (admin-only branding assets) rather than an
    oversight, but worth confirming that's actually intentional.
13. **Known-vulnerable pinned frontend dependencies.** ✅ Mostly done. `npm audit fix`
    resolved `dompurify` (→3.4.13), `nanoid` (→3.3.18), and `postcss` (→8.5.26) — all
    verified installed post-fix, build still clean. **Deliberately not forced:**
    `react-router`/`react-router-dom`'s fix requires 7.x (declared range is `^6.26.0`,
    a major-version jump `npm audit fix` won't cross without `--force`). Given this
    sandbox can't do real browser/runtime testing of client-side routing behavior, forcing
    a major version bump of the core routing library during a security pass risked trading
    a known, moderate-severity, well-documented issue (open redirect) for an unverified
    runtime regression — the wrong trade. Left as-is; do the v6→v7 migration as its own
    tested change, not folded into this one. `esbuild`/`vite`'s fix is dev-server-only
    (not a production runtime risk), same reasoning, same recommendation.
14. **"Refund" doesn't call the gateway.** ✅ Partially done, scope corrected on inspection.
    The original finding assumed an existing "Refund" button just needed clearer messaging
    about the required manual gateway step — **on actually opening `Admin.jsx`, no such
    button exists at all**: the admin Payments tab is read-only (fetches and lists
    payments, no mutating call anywhere), so `AdminController::refundPayment()` is
    currently unreachable from the UI, only from a direct API call. That changes the
    urgency here — fixed the response messaging anyway (now explicitly states money wasn't
    actually moved and gives the gateway + transaction reference to process it manually,
    using `transaction_id` rather than `gateway_ref` since only bKash populates the
    latter), since it costs nothing and matters the moment a button does get wired up.
    **Not done — real scope, not a quick patch:** either building that admin UI button, or
    wiring real per-gateway refund API calls (same "verify against current docs first"
    treatment items 6/7/10 got) — whichever you'd rather have. Sizing that is a Phase 6
    decision, not a Phase 4 one.

### Phase 5 — Quick UX wins (near-zero engineering cost)

**Status: items 15–17 done, 2026-08-17.** Verified via `php -l` (158/158 files clean) and
`npm run build` (clean) after every step.

Found by researching Bangladesh's digital context directly: 71.1% of the country's web
traffic is mobile (Cloudflare Radar, Jan–Apr 2026) — the highest mobile share of any
country tracked, ahead of Nigeria and the Philippines. Every item below is scored against
that fact, not generic best-practice.

15. **Wire the existing `MegaMenu.jsx` into the pages that duplicated their own navbar.**
    ✅ Done — 7 of the originally-scoped 8, not 8. This is the same root cause Phase 1
    item 2 already diagnosed while wiring dark mode ("no shared Nav/Layout — 21 pages each
    define their own inline navbar") and worked around rather than fixed. `Home.jsx`,
    `Courses.jsx`, `Course.jsx`, `Blog.jsx`, `Instructor.jsx`, `Bundles.jsx`, and
    `BundleDetail.jsx` now share one `<MegaMenu logo={<Logo/>} actions={...}/>` instead of
    seven copies of the same thing. **`Quiz.jsx` deliberately excluded on inspection**: its
    navbar is a stripped-down logo + dark-mode-toggle bar with no nav links at all, and
    that's intentional — an active, timed quiz is exactly where you don't want to make it
    easy to wander off mid-assessment. It also had no hover-dependent element to begin
    with, so there was no actual mobile bug there to fix; applying the pattern anyway would
    have been fixing a problem that didn't exist while creating a real one (exit temptation
    during a timed test).

    Two things found and fixed while wiring this in, not after:
    - `menu_items` (the table `MegaMenu.jsx` fetches from) had **zero rows anywhere** — not
      in `edubd_seed_data.sql`, not in any PHP seeder. Wiring the component in as-is would
      have shipped a navbar with no links at all. Seeded it with what the old navbars had,
      plus two things that existed as real pages but weren't in *any* primary nav: Live
      Classes (Phase 3 item 6), and — since `Home.jsx`'s richer bespoke dropdown is what's
      being retired here too (see below) — "Instructors" and About's four sub-pages
      (Mission, Become an Instructor, Press, Contact), which had only ever lived in that
      one page's own hover menu.
    - `MegaMenu.jsx` itself had a **hardcoded light-only color palette** — the exact same
      bug Phase 1 item 2 was written to fix everywhere else, just never caught here because
      nothing imported this component until now. Fixed to use `useThemeColors()` before
      wiring it in anywhere, so it didn't silently regress dark mode on every page it
      touched.

    `Home.jsx`'s own navbar was the richest of the eight — a bespoke hover-triggered
    mega-dropdown with a live "most popular courses" panel and a stats grid, not just links.
    Retired anyway: it was hover-only, so none of that richness was ever reachable on
    mobile either way, and shipping "prettier on desktop, still broken for 89% of visitors"
    isn't a reasonable trade against one consistent, mobile-working nav everywhere.

    Also added while here, since the category menu links are pointless without it:
    `Courses.jsx` didn't read `?category=` from the URL at all (no `useSearchParams` usage
    anywhere in that file) — a `/courses?category=web-development` link would have landed
    on an unfiltered list. Added a `SLUG_TO_CAT` map and a lazy `useState` initializer so
    the new menu's category links actually pre-filter.

16. **Notification bell.** ✅ Done — and the actual gap was narrower than assumed. The
    original note said "no bell/list anywhere"; on inspection, a complete one already
    existed — `NotificationController` (index, unread-count, recent, mark-read,
    mark-all-read, delete) plus a working bell UI — but it was wired into `Admin.jsx`
    **only**. Students and instructors, the actual recipients of `CourseEnrolled` /
    `AssignmentGraded` / `NewDiscussionReply`, had no equivalent. Built the same
    bell-and-dropdown pattern into `AuthNavActions.jsx` — the one component ~20 pages
    already render — so the fix reaches every page at once rather than needing its own
    wiring per page. Found and fixed the same hardcoded-light-palette bug here too (this
    component renders on every dark-mode-capable page in the app, so it mattered more here
    than almost anywhere else it was found).
17. **Video playback speed control.** ✅ Done. Cycling 0.5×–2× control added to
    `Learn.jsx`'s custom video player, persisted across lesson changes via
    `HTMLVideoElement.playbackRate` set on `loadedmetadata`. No backend change needed, as
    expected.

### Phase 6 — Medium lift, high differentiation

**Status: items 18–20 done, 2026-08-17.**

18. **Leaderboard.** ✅ Done, scoped on real data rather than the assumed data. The
    original note said this was cheap because "points/streaks/badges" already existed —
    checked `GamificationService`, `UserStreak`, `UserBadge`, `QuizResult` directly, and
    there's no stored "points" field anywhere in this schema. Built
    `LeaderboardController::course()` on what's actually there instead: lessons completed
    (`LessonProgress`), quiz performance (`QuizResult` — **best attempt per quiz, not every
    attempt summed**, so retrying a quiz five times can't out-rank someone who passed it
    once), and current streak (`UserStreak`). Combined into one documented, deliberately
    simple composite score (10 pts/lesson, 1 pt/quiz point, 5 pts/streak-day) rather than
    presenting a formula as more "real" than it is. Scoped per-course as planned — a
    `GET /courses/{id}/leaderboard` endpoint, `auth:sanctum`-protected (real student names
    ranked against each other isn't something to expose to anonymous visitors). Surfaced in
    `Learn.jsx` as a trophy button in the top bar opening a ranked panel, rather than a
    permanent sidebar fixture — competitive/social by choice, not by default clutter on an
    already-focused page.
19. **Course/blog SEO + page SEO for the rest of the site.** ✅ Done — **materially
    different from, and larger than, what "FAQ, related courses, instructor's other
    courses" originally described**, corrected mid-build after direct feedback: FAQ, meta
    title/description, and OG image needed to be **two separate systems**, not one. Worth
    recording precisely since a future session could otherwise "fix" this back to the wrong
    shape:
    - **Courses and blog posts manage their own SEO within their own admin section**
      (Course Management / Blog Management), the way they already partially did — courses
      already had `meta_title`/`meta_description`, blog posts already had those plus
      `og_image`/`twitter_image`/`focus_keyword`/canonical URL/schema markup/an SEO-score
      calculator (`BlogPost.php` turned out to be a genuinely sophisticated, already-mostly-wired
      system — checked before assuming it needed building). Brought courses to parity
      (`faqs`, `og_image` columns added) and added `faqs` to blog posts (they had
      everything else already). Both admin forms got a FAQ question/answer editor and an
      OG-image upload field.
    - **Everything else — Home, About, the Courses listing, Bundles listing, etc. — has no
      entity of its own to hang SEO fields on**, so it needed a genuinely separate,
      path-keyed system: a new `page_seos` table (`path`, `meta_title`, `meta_description`,
      `og_image`, `faqs`), `PageSeoController` (public `GET /page-seo?path=X` lookup +
      admin CRUD), a new **"Page SEO" tab** in the admin sidebar (list/search/add/edit by
      URL path, independent of Course Management and Blog Management), and a
      `usePageSeo()` frontend hook — replacing `usePageTitle` — wired into all 9 static
      pages (Home, About, Mission, Press, Contact, Become-Instructor, Instructors, Bundles,
      Live Classes). The split mirrors how a storefront platform like nopCommerce
      separates catalog-entity SEO from general page/URL SEO, per the explicit steer to
      build it that way rather than one universal table.

    Two real, pre-existing bugs found and fixed while wiring the course/blog admin forms to
    actually load current values (not filed separately, since the fix was one method either
    way): **`GET /admin/blog/{id}` didn't exist at all** — `Admin.jsx`'s "Edit" flow on a
    blog post has been calling a route that was never registered, so opening any post to
    edit it has been failing outright; added `BlogController::adminShow()` + the missing
    route. Separately, the **Course admin edit form was populating itself from the trimmed
    list row** instead of fetching full detail, meaning `meta_title`/`meta_description`
    (and now `faqs`/`og_image`) would silently vanish on the next save even if previously
    set, since the form never knew they existed — switched it to call the existing (already
    working, just unused for this) `AdminCourseController::show()`.

    Related-courses and instructor's-other-courses (the original, unambiguous part of this
    item) are unaffected by any of the above — same-category and same-instructor course
    strips on `Course.jsx`, reusing the `instructorCourses()` relationship that already
    existed on `User` but wasn't surfaced anywhere.
20. **Shared cart / multi-item checkout.** ✅ Done. New `cart_items` table +
    `CartController` (list/add/remove/clear, same duplicate-add check
    `WishlistController` already used). Checkout is a **separate**
    `PaymentController::initiateCart()` rather than folded into the existing `initiate()` —
    deliberately, since that method (and the course/bundle paths it dispatches to) is
    exactly what Phase 4's payment-verification fixes were written against, and a cart is a
    different enough shape (N items, no single `course_id`/`bundle_id`) that bolting it on
    risked touching already-hardened code. A cart payment has `course_id`/`bundle_id` =
    `NULL` on the `payments` row itself, `is_cart = true`, and one `payment_items` row per
    thing being purchased; `markPaid()` got one new early-return branch for `is_cart`
    payments and nothing else changed about how it handles every other payment — verified
    by reading the diff, not just by the build passing. Reuses
    `enrollBundleCourses()` for any bundles in the cart rather than duplicating its
    ownership logic, and reuses `PaymentMethodModal` (already shared between `Course.jsx`
    and `BundleDetail.jsx`) for the actual gateway picker rather than building a second one.
    Cart icon + dropdown panel added to `AuthNavActions.jsx` (reaches every page at once,
    same reasoning as item 16); "Add to Cart" buttons added to `Course.jsx` and
    `BundleDetail.jsx` alongside the existing "Enroll Now"/"Buy" buttons — **bundle
    add-to-cart is only offered when the user owns none of the bundle's courses yet**,
    since cart checkout charges the bundle's full price and the existing direct-buy flow
    already correctly prorates for partial owners; offering both paths for a partial owner
    would have let cart checkout silently overcharge past what direct-buy already handles
    correctly.

21. **Subscription/all-access pricing tier.** 10MS sells live-class access this way
    alongside one-time course purchases; EduBD is one-time-purchase-only everywhere
    (checked: no subscription/membership model anywhere in the schema). Genuinely worth a
    look, but cuts against what makes bKash/Nagad checkout comfortable in a price-sensitive
    market — a one-time payment is a single authorization, a subscription is a recurring
    commitment, and recurring mobile-wallet billing has historically been friction-prone
    here. Research against actual EduBD usage data before building, same as Phase 3 items
    needed real scoping rather than a feature-flag treatment.
22. **Native iOS/Android app store presence.** The PWA (`public/manifest.json` +
    `public/sw.js`) is a reasonable, resource-efficient choice and covers most of what a
    native app buys you technically. But 10MS's Play Store listing alone shows ~300K
    ratings — in a market still building trust in digital-payment platforms, "a real app in
    the Play Store" reads as more legitimate to a lot of users than "install this from a
    website," rightly or not. Same category as Phase 3 item 9 (native mobile app) — a
    separate build, not something to start as a side effort. Keep on the radar as the
    platform scales rather than an immediate priority.

### Explicitly deprioritized (found in research, not recommended)

Blockchain-verified credentials, full LTI/SIS interoperability, VR/immersive learning —
these showed up repeatedly in general 2026 edtech trend research, but they're primarily
relevant to institutional/university LMS platforms, not a consumer course marketplace
like EduBD. Building them would be effort spent on things your actual users won't notice.

---

## 3. Suggested order to actually work through this

Phase 1 items first (cheap, real, no reason to delay). Then Phase 2 item 3 (AI
doubt-solving) as the highest-impact medium-effort build, followed by item 4 (affiliate
program) since it reuses existing patterns. Phase 3 items are real investments — worth
scoping properly (cost, timeline, team) rather than starting as a side effort, and #7
should be treated as a prerequisite decision for #8 rather than two independent items.

**As of 2026-08-16, with Phases 1–4 complete:** Phase 4's items 10–12 (payment verification,
role checks, SVG upload) were the live financial-integrity and account-security issues —
done. Item 13 is done except the react-router major-version bump, left deliberately
unforced (see item 13's note — do it as its own tested change). Item 14 is done at the
message-honesty layer; the real gateway-refund integration (or building the admin UI for it
at all, since it turned out none exists) is still open and belongs in Phase 6 sizing, not
squeezed into Phase 4.

**Next up: Phase 5**, in the order listed — item 15 (the mega-menu wiring) reaches the
largest share of actual traffic for the least new code, for the reason covered above. Phase
6 items are independent of each other and of Phase 5; take them in whatever order matches
current priorities. Phase 7 items are decisions to make with real usage data, not tasks to
schedule — don't let their presence on this list imply they're next just because they're
numbered last.

**As of 2026-08-17, with Phases 1–6 complete:** everything through item 20 is done and
verified (`php -l` clean across all 158 backend files, `npm run build` clean, checked after
every individual change rather than once at the end — the same discipline this document has
used throughout). Nothing in Phases 5–6 turned out to be as simple as its original one-line
description implied once actually opened: item 15 needed the mega-menu's own data seeded and
a dark-mode bug fixed before it could be wired in at all; item 16 turned out to already
mostly exist, just admin-only; item 18 needed a real scoring design since the "points" it
was assumed to build on don't exist in this schema; item 19 needed a real mid-build
architecture correction (two separate SEO systems, not one) plus two unrelated bugs fixed
along the way (a missing blog-edit route, a course-edit form silently discarding SEO fields
on every save); item 20 was scoped narrowly enough on purpose (a separate `initiateCart()`
rather than touching the already-hardened `initiate()` path) that it shouldn't have
introduced new risk to Phase 4's payment-integrity fixes. **Only Phase 7 remains**, and it's
deliberately not a build queue — items 21–22 are "go find out if this is worth it" tasks,
not "go build this."
