import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "flame" };

export function Chip({ className, variant = "default", ...props }: Props) {
  return (
    <span {...props} className={cn("inline-flex items-center rounded-[8px] px-[0.65rem] py-[0.3rem] font-mono text-[0.73rem]",
      variant === "default" && "bg-paper-2 text-ink-2",
      variant === "flame" && "bg-flame/10 text-flame-deep", className)} />
  );
}
