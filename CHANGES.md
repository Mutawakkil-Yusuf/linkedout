# LinkedOut — favicon + splash integration notes

**Status: fully merged.** `globals.append.css` has been folded into the real
`src/app/globals.css` (and deleted) — this is what fixes the splash text
rendering as unstyled black instead of "Linked" (ink) + "**Out**" (flame,
animated). Everything below is the history of what changed and why.

Reviewed against the existing codebase conventions (Tailwind design tokens
`bg-paper`/`text-ink`/`font-display`/`rounded-card` from `settings/page.tsx`,
`@dicebear` + `clsx`/`tailwind-merge` in `package.json`). Two real bugs in the
pasted spec were caught and fixed before integration — everything else is
copied through unchanged.

## Fixed

- **Removed `src/app/icon.tsx`.** Next.js only allows one `icon` route per
  segment. `icon.svg` and `icon.tsx` both claim that slot — having both
  causes a metadata file conflict at build time. `icon.svg` alone already
  covers every modern browser (Chrome, Firefox, Safari 16+) and scales to
  any size, so the PNG generator was redundant, not just conflicting.
- **Dropped the manual `icons` field from `layout.tsx` metadata.** With
  `icon.svg` and `apple-icon.tsx` present as file-convention routes,
  Next.js auto-injects the correct `<link rel="icon">` / `<link
  rel="apple-touch-icon">` tags. Restating the same URLs in `metadata.icons`
  rendered duplicate `<link>` tags in `<head>`.
- **Wired up `.lo-skip-splash`.** The pre-paint script in `layout.tsx`
  already added this class to `<html>` on repeat visits, but no CSS rule
  read it — so returning users still saw a one-frame flash of the splash
  before React's `useEffect` could bail out. Added `.lo-skip-splash
  #lo-splash { display: none !important; }` to `globals.css` to close that
  gap; `SplashScreen`'s own logic is untouched.

## Unchanged from spec

- `apple-icon.tsx`, `manifest.ts` (icons array trimmed to match the two
  real routes: `/icon.svg` + `/apple-icon`), `letter-word.tsx`,
  `splash-screen.tsx` component logic.

## Verified against the real project

- `mark-loader.tsx`, `topbar.tsx`, `lib/utils.ts` (`cn`), and `globals.css`
  checked directly — no naming or spec conflicts with anything above.
  `globals.css` now has both animation blocks (the pre-existing
  pop/slot-draw/breathe set for `MarkLoader`, plus the letter-sway set),
  and only one `.lo-skip-splash` rule (it already existed before this
  change; nothing got duplicated).

## The actual reason install still didn't work

`src/middleware.ts`'s matcher ran the Supabase auth check on almost every
request, and its `isPublic` allowlist only covered `/`, `/login`, `/auth`,
`/motion`, `/_next`, `/favicon`. `/manifest.webmanifest`, `/sw.js`,
`/icon.svg`, `/icon-192`, `/icon-512`, and `/apple-icon` weren't on it — so
any signed-out visitor (i.e. anyone Chrome would show an install prompt to
on your landing page) got all of those redirected to `/login`. An HTML
redirect where Chrome expects JSON/JS/PNG fails the manifest fetch, the
service-worker registration, and the icon checks simultaneously — which is
consistent with nothing above working despite every file being individually
correct.

**Fix:** added those paths to the middleware `config.matcher` negative
lookahead, so it skips them before the auth check ever runs:

```ts
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon.svg|icon-192|icon-512|apple-icon).*)",
  ],
};
```

After this, re-check in an incognito window (so you're testing signed-out,
where it was actually failing): DevTools → Network → reload → `manifest.webmanifest`
should return `200` with `Content-Type: application/manifest+json`, not a
redirect to `/login`.

## Install prompt (added)

The real blocker for Chrome/Edge/Android's install prompt wasn't the missing
service worker — Chrome dropped the service-worker requirement for
installability back in 2019. It was **missing icon sizes**: Lighthouse's
installability check requires a 192×192 *and* a 512×512 PNG in the manifest,
and the manifest only had `icon.svg` (any) + `apple-icon` (180×180).

- **`src/app/icon-192/route.tsx`, `src/app/icon-512/route.tsx`** — plain
  route handlers (not the special `icon`/`apple-icon` file convention, so no
  slot conflict) generating the two required PNG sizes via `ImageResponse`.
- **`manifest.ts`** — added those two sizes to the `icons` array.
- **`public/sw.js`** — added anyway, since you asked for it and it's good
  practice: network-first with cache fallback, so it never serves stale
  Supabase-backed content while online and gives you a basic offline shell
  for free. Cache list matches the icon/manifest routes above.
- **`src/components/register-service-worker.tsx`** — registers `sw.js` on
  mount; wired into `layout.tsx` next to `SplashScreen`.

After merging, hard-reload once, check DevTools → Application → Manifest
(no warnings) and → Service Workers (status "activated"), then the install
icon should appear in Chrome's address bar.

## Manual step (optional, not code)

`public/favicon.ico` for pre-Safari-16 / legacy browsers: run `icon.svg`
through realfavicongenerator.net, keep only `favicon.ico`, and drop it in
`app/favicon.ico` (not `public/`) — Next.js auto-detects it from that path
directly, no metadata change needed. Skippable — `icon.svg` alone is fine
for 2026 browser share.

## Round 4 — landing page nav, counts

- **GitHub icon**: moved from the header (next to "sign in," where it read as
  part of the auth flow) to the footer, next to "AGPL-3.0 · self-hostable" —
  now reads as source-code attribution, not a nav action. `src/app/page.tsx`.
- **Duplicate email on sign-in**: investigated, found no app-level bug —
  there's no password signup path, only `signInWithOtp`, and `profiles` has
  no email column at all (identity is 100% Supabase Auth's `auth.users`).
  Flagged as either working-as-intended or a Supabase project setting
  ("Allow duplicate emails"), not something fixable in this repo. Asked for
  exact repro steps before assuming more.
- **Reply + warmth counts**: added `reactions(count)` / `replies(count)` to
  the post queries in `rooms/[slug]/page.tsx`, `u/[handle]/page.tsx`,
  `p/[id]/page.tsx`, passed through as `replyCount` / `warmthCount` props on
  `PostCard`.
  - Reply count shows to everyone — matches `replies_read`'s RLS scope, and
    it's wayfinding, not a vanity metric.
  - Warmth count only renders when the viewer is the post's author — the
    `reactions_read` policy already only lets the reactor or the post's
    author see reaction rows, so a public count would either be wrong (an
    undercount for anyone else) or need a policy change that turns private
    acknowledgment into a public score, which cuts against the "no follower
    counts / not inventory" pitch on the landing page. Kept it private,
    author-only — no RLS change needed since it already matches that policy.

## Round 5 — voice pass, 404 page, toast system

**Copy (3 of the 4 approved changes — DM empty state left as-is per request):**
- Onboarding submit: "Create profile" → "Enter LinkedOut" ("Creating…" → "Walking in…") — echoes the login page's own phrase.
- New room submit: "Create room" → "Open the room" ("Creating…" → "Opening…") — matches "Rooms you can walk into" on the landing page.
- Settings save: "Save changes" → "Keep it" ("Saving…" → "Keeping…").

**`src/app/not-found.tsx` (new)** — custom 404. Catches both bad URLs and every
existing `notFound()` call in nested routes (`p/[id]`, `rooms/[slug]`,
`u/[handle]`) since none of them had their own `not-found.tsx`. On-brand copy,
CTAs to `/rooms` and `/`.

**Global toast system** — `src/components/toast-provider.tsx` (new),
wired into `layout.tsx` around `<Topbar>`/`<main>`. Two visual variants only,
on purpose: error (paper/`flame-deep`, matches the existing inline error
convention every form already used) and everything else (a dark ink pill) —
no invented "success green," this app's palette is flame + neutrals.
Respects `prefers-reduced-motion`.

Wired in where it actually closes a gap, not everywhere:
- **`composer.tsx`** — had an error message but *zero* success feedback
  (textarea just cleared). Now toasts both.
- **`reply-form.tsx`** — real bug fixed: on insert failure it silently reset
  with no feedback at all. Now toasts both success and error.
- **`dm-composer.tsx`** — same silent-failure bug on error, fixed with an
  error toast. No success toast added — the message appearing instantly in
  the thread is already the confirmation; toasting every send would be noise
  in a chat UI.
- **`report-dialog.tsx`**, **`mod-action-card.tsx`** — these already had
  `ActionButton`'s inline "Done"/"Try again" state, which is generic by
  design and never surfaces *why* something failed. Added toasts carrying
  the actual detail (`res.error`) and, for mod actions, which action was
  taken ("Post hidden." / "Report dismissed." / etc.) — additive, doesn't
  replace the existing button feedback.
- **`rooms/new/page.tsx`** — added a success toast ("#slug is open."). This
  survives the `router.push()` into the new room because the root layout
  (where `ToastProvider` lives) doesn't remount on client-side navigation.

**Deliberately not touched:**
- `profile-settings.tsx` / `avatar-settings.tsx` already have a working
  inline "saved"/error pattern next to their buttons — left alone rather
  than force a redundant refactor onto something that wasn't broken.
- Onboarding's success path has no toast: `createProfile` is a server action
  that redirects server-side on success, so there's no client state left to
  toast from without restructuring the action itself.
- `/api/delete` and `/api/export` are plain form posts / downloads, not
  client-side fetches — can't toast without converting them, out of scope
  for this pass.

Verified with `npx tsc --noEmit` after `npm install` — zero errors across
every file touched this session.
