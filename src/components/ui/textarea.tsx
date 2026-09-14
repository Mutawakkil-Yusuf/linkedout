import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} {...props}
      className={cn("w-full resize-none rounded-soft border border-line bg-card px-4 py-3 text-[0.95rem] leading-relaxed text-ink outline-none transition placeholder:text-muted focus:border-flame focus:ring-4 focus:ring-flame/10", className)}
    />
  )
);
Textarea.displayName = "Textarea";
