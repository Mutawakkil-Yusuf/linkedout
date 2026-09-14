import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} {...props}
      className={cn("w-full rounded-soft border border-line bg-card px-4 py-3 text-[0.95rem] text-ink outline-none transition placeholder:text-muted focus:border-flame focus:ring-4 focus:ring-flame/10", className)}
    />
  )
);
Input.displayName = "Input";
