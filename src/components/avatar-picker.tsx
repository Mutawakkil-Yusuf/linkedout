"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import {
  AVATAR_STYLES, AVATAR_STYLE_LABELS, buildAvatarGrid, dicebearUrl,
  type AvatarChoice, type AvatarStyle,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Category = AvatarStyle | "mix";
const CATEGORIES: { id: Category; label: string }[] = [
  { id: "mix", label: "Mix" },
  ...AVATAR_STYLES.map((s) => ({ id: s, label: AVATAR_STYLE_LABELS[s] })),
];
const GRID_SIZE = 9;

type Props = {
  initial?: AvatarChoice | null;
  onChange?: (choice: AvatarChoice) => void;
  /** When set, renders hidden <input>s with these names so a native <form> submits the pick. */
  fieldNames?: { style: string; seed: string };
};

export function AvatarPicker({ initial = null, onChange, fieldNames }: Props) {
  const [tab, setTab] = useState<Category>(initial?.style ?? "mix");
  const [grids, setGrids] = useState<Partial<Record<Category, AvatarChoice[]>>>({});
  const [selected, setSelected] = useState<AvatarChoice | null>(initial);

  // Generate grids client-side only, after mount, so SSR and first client
  // render match (no Math.random in the render path itself).
  useEffect(() => {
    setGrids((prev) => {
      const next = { ...prev };
      for (const c of CATEGORIES.map((c) => c.id)) {
        if (!next[c]) next[c] = buildAvatarGrid(c, GRID_SIZE);
      }
      // Make sure the currently-selected avatar always shows up in its tab.
      if (initial && next[initial.style] && !next[initial.style]!.some((a) => a.seed === initial.seed)) {
        next[initial.style] = [initial, ...next[initial.style]!.slice(0, GRID_SIZE - 1)];
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pick(choice: AvatarChoice) {
    setSelected(choice);
    onChange?.(choice);
  }

  function shuffle() {
    setGrids((prev) => ({ ...prev, [tab]: buildAvatarGrid(tab, GRID_SIZE) }));
  }

  const grid = grids[tab];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" onClick={() => setTab(c.id)}
              className={cn("rounded-[8px] px-2.5 py-1 font-mono text-[0.72rem] font-medium uppercase tracking-wide transition",
                tab === c.id ? "bg-flame/10 text-flame-deep" : "text-muted hover:bg-paper-2 hover:text-ink")}>
              {c.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={shuffle}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1 font-mono text-[0.72rem] font-medium text-muted transition hover:bg-paper-2 hover:text-ink">
          <RefreshCw className="h-3.5 w-3.5" />shuffle
        </button>
      </div>

      {!grid ? (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {Array.from({ length: GRID_SIZE }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-[12px] bg-paper-2" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
          {grid.map((choice, i) => {
            const active = selected?.style === choice.style && selected?.seed === choice.seed;
            return (
              <button key={`${choice.style}-${choice.seed}-${i}`} type="button" onClick={() => pick(choice)}
                aria-pressed={active}
                className={cn("aspect-square overflow-hidden rounded-[12px] border-2 bg-paper-2 transition",
                  active ? "border-flame ring-2 ring-flame/20" : "border-transparent hover:border-line-2")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dicebearUrl(choice.style, choice.seed, 128)} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {fieldNames && (
        <>
          <input type="hidden" name={fieldNames.style} value={selected?.style ?? ""} />
          <input type="hidden" name={fieldNames.seed} value={selected?.seed ?? ""} />
        </>
      )}
    </div>
  );
}
