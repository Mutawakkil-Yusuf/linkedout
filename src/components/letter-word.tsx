"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text?: string;
  /** index where the flame-colored letters begin. "LinkedOut" → 6 (the "O") */
  flameFrom?: number;
  /** ms after mount before the arrival starts */
  startDelay?: number;
  /** keep swaying after the arrival */
  idle?: boolean;
  className?: string;
};

export function LetterWord({
  text = "LinkedOut",
  flameFrom = 6,
  startDelay = 0,
  idle = true,
  className,
}: Props) {
  const [playing, setPlaying] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay === 0) return;
    const t = window.setTimeout(() => setPlaying(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  return (
    <span
      className={cn(
        "lo-letter-word",
        playing && "is-playing",
        !idle && "no-idle",
        className
      )}
      aria-label={text}
    >
      {[...text].map((ch, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={cn(
            "lo-letter",
            i >= flameFrom ? "lo-letter-flame" : "lo-letter-ink"
          )}
          style={{ ["--i" as string]: i } as React.CSSProperties}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
