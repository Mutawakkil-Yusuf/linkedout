import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Composer } from "@/components/composer";
import { PostCard } from "@/components/post-card";

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: room } = await supabase
    .from("rooms").select("id, slug, name, description").eq("slug", slug).maybeSingle();
  if (!room) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: ban } = await supabase
    .from("room_bans").select("reason, created_at")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

  if (ban) {
    return (
      <div className="pt-8">
        <Header room={room} />
        <div className="rounded-card border border-flame/20 bg-flame/5 p-5">
          <p className="mb-1 font-display text-[1.05rem] font-bold tracking-[-0.02em] text-flame-deep">
            You're banned from this room
          </p>
          <p className="text-[0.95rem] text-ink-2">Reason: {ban.reason}</p>
        </div>
      </div>
    );
  }

  const { data: membership } = await supabase
    .from("room_members").select("role")
    .eq("room_id", room.id).eq("user_id", user.id).maybeSingle();

  const isMod = membership?.role === "mod" || membership?.role === "owner";

  let openReports = 0;
  if (isMod) {
    const { count } = await supabase
      .from("reports").select("id", { count: "exact", head: true })
      .eq("room_id", room.id).eq("status", "open");
    openReports = count ?? 0;
  }

  if (!membership) {
    return (
      <div className="pt-8">
        <Header room={room} />
        <form
          action={async () => {
            "use server";
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase.from("room_members").insert({ room_id: room.id, user_id: user.id });
          }}
        >
          <button className="rounded-full bg-flame px-5 py-2.5 text-[0.9rem] font-semibold text-white transition hover:bg-flame-deep">
            Join room
          </button>
        </form>
      </div>
    );
  }

  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, created_at, hidden_at, author_id, room_id, author:profiles!posts_author_id_fkey(handle, display_name, avatar_style, avatar_seed)")
    .eq("room_id", room.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const postIds = (posts ?? []).map((p) => p.id);
  const { data: warmRows } = postIds.length
    ? await supabase.from("reactions").select("post_id").in("post_id", postIds).eq("user_id", user.id)
    : { data: [] };
  const warmed = new Set((warmRows ?? []).map((r) => r.post_id));

  return (
    <div className="pt-8">
      <Header room={room} isMod={isMod} openReports={openReports} />
      <Composer roomId={room.id} />
      <ul>
        {posts?.length ? posts.map((p: any) => (
          <li key={p.id}>
            <PostCard
              post={p}
              author={p.author}
              warmed={warmed.has(p.id)}
              currentUserId={user.id}
            />
          </li>
        )) : (
          <li className="rounded-card border border-line bg-card p-6 text-center text-[0.95rem] text-muted">
            This room is quiet.
          </li>
        )}
      </ul>
    </div>
  );
}

function Header({
  room, isMod, openReports,
}: {
  room: { slug: string; name: string; description: string | null };
  isMod?: boolean;
  openReports?: number;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 className="break-words font-display text-[1.6rem] font-bold tracking-[-0.025em]">
          <span className="font-mono text-flame">#</span>{room.slug}
        </h1>
        <p className="mt-1 text-[0.9rem] text-muted">{room.name}</p>
        {room.description && (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-2">{room.description}</p>
        )}
      </div>

      {isMod && (
        <div className="flex flex-none items-center gap-3 pt-1">
          <Link
            href={`/rooms/${room.slug}/mod/log`}
            className="font-mono text-[0.72rem] text-muted underline decoration-line underline-offset-4 hover:text-ink"
          >
            log
          </Link>
          <Link
            href={`/rooms/${room.slug}/mod`}
            className="inline-flex items-center gap-1.5 rounded-full bg-flame/10 px-3 py-1.5 font-mono text-[0.72rem] font-medium text-flame transition hover:bg-flame/15"
          >
            mod
            {openReports ? (
              <span className="rounded-full bg-flame px-1.5 text-[0.65rem] font-bold text-white">
                {openReports}
              </span>
            ) : null}
          </Link>
        </div>
      )}
    </header>
  );
}
