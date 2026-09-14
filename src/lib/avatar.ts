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
