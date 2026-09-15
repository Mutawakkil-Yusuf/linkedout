// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { avatarGradient, initials, dicebearUrl, type AvatarStyle } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  handle: string;
  avatarStyle?: AvatarStyle | null;
  avatarSeed?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "w-8 h-8 text-[0.7rem] rounded-[8px]",
  md: "w-9 h-9 text-[0.82rem] rounded-[10px]",
  lg: "w-14 h-14 text-[1.1rem] rounded-[14px]",
};

const pixelSizes = { sm: 64, md: 72, lg: 112 };

export function Avatar({ handle, avatarStyle, avatarSeed, size = "md", className }: Props) {
  if (avatarStyle && avatarSeed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={dicebearUrl(avatarStyle, avatarSeed, pixelSizes[size])}
        alt=""
        aria-hidden="true"
        className={cn("inline-block flex-none bg-paper-2 object-cover", sizes[size], className)}
      />
    );
  }
  return (
    <span className={cn("inline-flex flex-none items-center justify-center font-display font-bold tracking-[-0.03em] text-white", sizes[size], className)}
      style={{ background: avatarGradient(handle) }} aria-hidden="true">
      {initials(handle)}
    </span>
  );
}
