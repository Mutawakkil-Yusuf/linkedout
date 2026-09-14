import { avatarGradient, initials } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = { handle: string; size?: "sm" | "md" | "lg"; className?: string };

const sizes = {
  sm: "w-8 h-8 text-[0.7rem] rounded-[8px]",
  md: "w-9 h-9 text-[0.82rem] rounded-[10px]",
  lg: "w-14 h-14 text-[1.1rem] rounded-[14px]",
};

export function Avatar({ handle, size = "md", className }: Props) {
  return (
    <span className={cn("inline-flex flex-none items-center justify-center font-display font-bold tracking-[-0.03em] text-white", sizes[size], className)}
      style={{ background: avatarGradient(handle) }} aria-hidden="true">
      {initials(handle)}
    </span>
  );
}
