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
