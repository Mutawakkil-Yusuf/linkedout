import "server-only";
import { Avatar, Style } from "@dicebear/core";
import loreleiJson from "@dicebear/styles/lorelei.json" with { type: "json" };
import notionistsJson from "@dicebear/styles/notionists.json" with { type: "json" };
import shadowsJson from "@dicebear/styles/shadows.json" with { type: "json" };
import type { AvatarStyle } from "./avatar";

// Style instances are safe to reuse across requests — build them once.
const STYLES: Record<AvatarStyle, Style> = {
  lorelei: new Style(loreleiJson as any),
  notionists: new Style(notionistsJson as any),
  shadows: new Style(shadowsJson as any),
};

/**
 * Background tints per style, matching what the app previously sent to the
 * hosted DiceBear API (see AVATAR_BACKGROUNDS in ./avatar.ts) so switching
 * to self-hosted rendering doesn't change how any existing avatar looks.
 */
const AVATAR_BACKGROUNDS: Record<AvatarStyle, string[]> = {
  lorelei: ["ffd5c2", "ffe9d1", "c2e8ff"],
  notionists: ["f4d7c3", "d9f4c3", "c3e0f4"],
  shadows: ["e8571f"],
};

const MIN_SIZE = 16;
const MAX_SIZE = 512;

export function renderAvatarSvg(style: AvatarStyle, seed: string, size: number): string {
  const clampedSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(size)));
  const avatar = new Avatar(STYLES[style], {
    seed,
    size: clampedSize,
    backgroundColor: AVATAR_BACKGROUNDS[style],
    backgroundColorFill: "linear",
  });
  return avatar.toString();
}
