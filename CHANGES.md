# LinkedOut — favicon + splash integration notes

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

## Not included (assumed already in your repo, not in the uploaded zip)

- `src/components/mark-loader.tsx`, `src/components/topbar.tsx`,
  `src/lib/utils.ts` (`cn` — consistent with `clsx` + `tailwind-merge`
  already in `package.json`), and the current `src/app/globals.css` (see
  `globals.append.css` — append it, don't replace the file).

## Manual step (optional, not code)

`public/favicon.ico` for pre-Safari-16 / legacy browsers: run `icon.svg`
through realfavicongenerator.net, keep only `favicon.ico`, and drop it in
`app/favicon.ico` (not `public/`) — Next.js auto-detects it from that path
directly, no metadata change needed. Skippable — `icon.svg` alone is fine
for 2026 browser share.
