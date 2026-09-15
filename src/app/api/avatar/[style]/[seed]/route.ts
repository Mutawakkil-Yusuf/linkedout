import { NextResponse, type NextRequest } from "next/server";
import { AVATAR_STYLES, type AvatarStyle } from "@/lib/avatar";
import { renderAvatarSvg } from "@/lib/avatar-render";

export const runtime = "nodejs";

// Same shape as the avatar_seed column's check constraint (0001/0003 migrations).
const SEED_MAX_LEN = 64;

function isAvatarStyle(value: string): value is AvatarStyle {
  return (AVATAR_STYLES as readonly string[]).includes(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ style: string; seed: string }> }
) {
  const { style, seed } = await params;

  if (!isAvatarStyle(style)) {
    return new NextResponse("Unknown avatar style", { status: 404 });
  }
  const decodedSeed = decodeURIComponent(seed);
  if (!decodedSeed || decodedSeed.length > SEED_MAX_LEN) {
    return new NextResponse("Invalid seed", { status: 400 });
  }

  const sizeParam = request.nextUrl.searchParams.get("size");
  const size = sizeParam ? Number(sizeParam) : 128;
  if (!Number.isFinite(size)) {
    return new NextResponse("Invalid size", { status: 400 });
  }

  const svg = renderAvatarSvg(style, decodedSeed, size);

  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml",
      // Seed + style + size fully determine the output, so this is safe to
      // cache forever — both at the edge/CDN and in the browser.
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
