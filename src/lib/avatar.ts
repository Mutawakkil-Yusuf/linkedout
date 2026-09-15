const GRADIENTS = [
  "linear-gradient(135deg,#ff8a4c,#e8571f)",
  "linear-gradient(135deg,#4f8bff,#2c6df5)",
  "linear-gradient(135deg,#f5b53c,#e08914)",
  "linear-gradient(135deg,#6cc18a,#3f9a63)",
  "linear-gradient(135deg,#c084fc,#8b3ff5)",
  "linear-gradient(135deg,#f472b6,#db2777)",
  "linear-gradient(135deg,#22d3ee,#0891b2)",
  "linear-gradient(135deg,#fbbf24,#d97706)",
];

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

export function initials(handle: string): string {
  const clean = handle.replace(/[^a-z0-9]+/gi, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return handle.slice(0, 2).toUpperCase();
}

// --- DiceBear-backed avatars -------------------------------------------------

export const AVATAR_STYLES = ["lorelei", "notionists", "shadows"] as const;
export type AvatarStyle = (typeof AVATAR_STYLES)[number];

export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  lorelei: "Lorelei",
  notionists: "Notionists",
  shadows: "Shadows",
};

/**
 * Self-hosted avatar route (src/app/api/avatar/[style]/[seed]/route.ts).
 * Renders the same three DiceBear styles server-side instead of hitting
 * api.dicebear.com directly, so we don't leak every viewer's IP + the
 * seed they're looking at to a third party on every page load.
 */
export function dicebearUrl(style: AvatarStyle, seed: string, size = 128): string {
  return `/api/avatar/${style}/${encodeURIComponent(seed)}?size=${size}`;
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export type AvatarChoice = { style: AvatarStyle; seed: string };

/** A fresh grid of `count` random avatars for one category tab, or a shuffled mix across all styles for "mix". */
export function buildAvatarGrid(category: AvatarStyle | "mix", count = 9): AvatarChoice[] {
  return Array.from({ length: count }, () => ({
    style: category === "mix" ? AVATAR_STYLES[Math.floor(Math.random() * AVATAR_STYLES.length)] : category,
    seed: randomSeed(),
  }));
}
