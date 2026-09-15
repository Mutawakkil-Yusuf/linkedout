import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fmtDate } from "@/lib/utils";

const VERBS: Record<string, string> = {
  hide_post: "hid a post",
  unhide_post: "unhid a post",
  remove_post: "removed a post",
  hide_reply: "hid a reply",
  unhide_reply: "unhid a reply",
  remove_reply: "removed a reply",
  ban_user: "banned a member",
  unban_user: "unbanned a member",
  appoint_mod: "appointed a moderator",
  remove_mod: "removed a moderator",
  dismiss_report: "dismissed a report",
  resolve_report: "resolved a report",
};

export default async function ModLogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms").select("id, slug, name").eq("slug", slug).maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("room_members").select("role")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();
  if (!member) notFound();

  const { data: actions } = await supabase
    .from("mod_actions")
    .select(`
      id, action, reason, created_at,
      mod:profiles!mod_actions_mod_id_fkey(handle, display_name),
      target_user:profiles!mod_actions_target_user_id_fkey(handle, display_name)
    `)
    .eq("room_id", room.id)
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="pt-8">
      <header className="mb-6">
        <Link
          href={`/rooms/${slug}`}
          className="font-mono text-[0.75rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
        >
          ← back to #{room.slug}
        </Link>
        <h1 className="mt-3 font-display text-[1.6rem] font-bold tracking-[-0.025em]">
          Public mod log
        </h1>
        <p className="mt-1 max-w-[34rem] text-[0.9rem] leading-relaxed text-muted">
          Every moderation action taken in this room. Reasons are written by the moderator.
          Removed content is not shown here.
        </p>
      </header>

      {actions?.length ? (
        <ul className="divide-y divide-line rounded-card border border-line bg-card">
          {actions.map((a: any) => (
            <li key={a.id} className="flex gap-3 px-5 py-3.5">
              <span className="flex-none font-mono text-[0.72rem] text-muted">
                {fmtDate(a.created_at)}
              </span>
              <span className="text-[0.9rem] leading-relaxed">
                <span className="font-mono text-[0.78rem] text-ink">
                  @{a.mod?.handle ?? "?"}
                </span>{" "}
                {VERBS[a.action] ?? a.action}
                {a.target_user && (
                  <>
                    {" "}
                    <span className="font-mono text-[0.78rem] text-ink">
                      @{a.target_user.handle}
                    </span>
                  </>
                )}
                {" · "}
                <span className="text-muted">{a.reason}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-card border border-line bg-card p-8 text-center text-[0.95rem] text-muted">
          No mod actions yet.
        </div>
      )}
    </div>
  );
}
