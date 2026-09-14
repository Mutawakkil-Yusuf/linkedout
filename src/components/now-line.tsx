export function NowLine({ text }: { text: string | null }) {
  if (!text) return null;
  return <div className="relative my-6 overflow-hidden rounded-soft border border-[#f5d9c7] bg-gradient-to-br from-[#fff4ea] to-[#ffeae0] p-5 pl-6 text-[1.2rem] font-medium leading-snug tracking-[-0.015em] text-ink"><span className="absolute inset-y-0 left-0 w-1 bg-flame" aria-hidden /><small className="mb-2 block font-mono text-[0.68rem] font-medium uppercase tracking-[0.1em] text-flame-deep">right now</small><span className="break-words">{text}</span></div>;
}
