# EduBD — Project Status & Upgrade Plan

_Last updated: 2026-08-02. This file is a handoff document — if you're picking this project
up in a new chat, read this first. It covers what's already been done and what's proposed
next, so you don't need the history of the previous conversation to have full context._

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

6. **Live classes.** The single biggest gap versus 10 Minute School and the single
   biggest lift — real-time video conferencing integration, scheduling, live chat/polls.
   This is a different product surface, not an incremental feature.
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
8. **Offline download of lessons.** Explicitly marketed by 10 Minute School and maps
   directly to real Bangladesh mobile-data cost/reliability concerns — this isn't just
   trend-chasing, it's locally load-bearing. Depends on #7 being done first; not
   realistically achievable on top of YouTube-embedded video. *Now unblocked by item 7
   above, with a wrinkle worth knowing: Bunny serves HLS (many small segment files),
   which is meaningfully harder to cache for offline playback than a single MP4 file
   would be — worth scoping as its own conversation, not assumed to be a quick add
   just because item 7 is done.*
9. **Native mobile app.** The API already exists, so this isn't starting from zero, but
   it's still a separate build (React Native or similar), not a design tweak. Not
   something buildable inside this repo/session — a real separate project.

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
