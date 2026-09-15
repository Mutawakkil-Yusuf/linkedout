// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost" | "quiet" | "danger";
type Size = "sm" | "md";

const styles: Record<Variant, string> = {
  primary: "bg-flame text-white border border-transparent hover:bg-flame-deep active:translate-y-px",
  ghost: "bg-card text-ink border border-line-2 hover:bg-paper-2",
  quiet: "bg-transparent text-ink border border-transparent hover:bg-paper-2",
  danger: "bg-card text-flame border border-flame/30 hover:bg-flame/5",
};

const sizes: Record<Size, string> = {
  sm: "text-[0.82rem] px-[0.85rem] py-[0.5rem] rounded-[10px]",
  md: "text-[0.9rem] px-[1.15rem] py-[0.65rem] rounded-full",
};

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size };

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button ref={ref} type={type} {...props}
      className={cn("inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40", styles[variant], sizes[size], className)}
    />
  )
);
Button.displayName = "Button";
