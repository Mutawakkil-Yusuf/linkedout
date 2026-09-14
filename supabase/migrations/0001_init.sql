-- LinkedOut v1 schema
create extension if not exists "pgcrypto";
create extension if not exists "citext";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  handle citext unique not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name text,
  bio text,
  now text check (char_length(now) <= 140),
  created_at timestamptz not null default now()
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  slug citext unique not null check (slug ~ '^[a-z0-9-]{3,40}$'),
  name text not null,
  description text,
  visibility text not null default 'public' check (visibility in ('public','unlisted')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid references public.rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member','mod','owner')),
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index posts_room_created_idx on public.posts (room_id, created_at desc);
create index posts_author_created_idx on public.posts (author_id, created_at desc);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index replies_post_created_idx on public.replies (post_id, created_at asc);

create table public.reactions (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  kind text not null default 'ack',
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create table public.blocks (
  blocker_id uuid references public.profiles(id) on delete cascade,
  blocked_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table public.dm_threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.dm_members (
  thread_id uuid references public.dm_threads(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (thread_id, user_id)
);

create table public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) between 1 and 5000),
  created_at timestamptz not null default now()
);
create index dm_messages_thread_created_idx on public.dm_messages (thread_id, created_at asc);

create or replace function public.is_room_member(p_room uuid, p_user uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (select 1 from room_members where room_id = p_room and user_id = p_user);
$$;

create or replace function public.shares_context_with(p_other uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from room_members a join room_members b on a.room_id = b.room_id
    where a.user_id = auth.uid() and b.user_id = p_other
  ) or exists (
    select 1 from dm_members a join dm_members b on a.thread_id = b.thread_id
    where a.user_id = auth.uid() and b.user_id = p_other
  ) or exists (
    select 1 from posts p join room_members rm on rm.room_id = p.room_id
    where p.author_id = p_other and rm.user_id = auth.uid() and p.deleted_at is null
  );
$$;

create or replace function public.is_blocked_pair(p_a uuid, p_b uuid)
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from blocks where (blocker_id = p_a and blocked_id = p_b) or (blocker_id = p_b and blocked_id = p_a)
  );
$$;

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.posts enable row level security;
alter table public.replies enable row level security;
alter table public.reactions enable row level security;
alter table public.blocks enable row level security;
alter table public.dm_threads enable row level security;
alter table public.dm_members enable row level security;
alter table public.dm_messages enable row level security;

create policy "profiles_self_read" on public.profiles for select using (id = auth.uid());
create policy "profiles_shared_read" on public.profiles for select using (public.shares_context_with(id));
create policy "profiles_insert_self" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update using (id = auth.uid());

create policy "rooms_public_read" on public.rooms for select using (visibility = 'public' or public.is_room_member(id, auth.uid()));
create policy "rooms_auth_create" on public.rooms for insert with check (auth.uid() = created_by);

create policy "room_members_read" on public.room_members for select using (public.is_room_member(room_id, auth.uid()));
create policy "room_members_self_join" on public.room_members for insert with check (user_id = auth.uid());
create policy "room_members_self_leave" on public.room_members for delete using (user_id = auth.uid());

create policy "posts_read" on public.posts for select using (
  deleted_at is null and not public.is_blocked_pair(auth.uid(), author_id) and
  ((room_id is null and public.shares_context_with(author_id)) or (room_id is not null and public.is_room_member(room_id, auth.uid())))
);
create policy "posts_insert" on public.posts for insert with check (
  author_id = auth.uid() and (room_id is null or public.is_room_member(room_id, auth.uid()))
);
create policy "posts_update_self" on public.posts for update using (author_id = auth.uid());

create policy "replies_read" on public.replies for select using (
  deleted_at is null and exists (select 1 from public.posts p where p.id = post_id)
);
create policy "replies_insert" on public.replies for insert with check (author_id = auth.uid());

create policy "reactions_read" on public.reactions for select using (
  user_id = auth.uid() or exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid())
);
create policy "reactions_insert" on public.reactions for insert with check (user_id = auth.uid());
create policy "reactions_delete" on public.reactions for delete using (user_id = auth.uid());

create policy "blocks_self" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

create policy "dm_threads_read" on public.dm_threads for select using (
  exists (select 1 from dm_members where thread_id = id and user_id = auth.uid())
);
create policy "dm_members_read" on public.dm_members for select using (
  exists (select 1 from dm_members m where m.thread_id = thread_id and m.user_id = auth.uid())
);
create policy "dm_messages_read" on public.dm_messages for select using (
  exists (select 1 from dm_members where thread_id = dm_messages.thread_id and user_id = auth.uid())
);
create policy "dm_messages_insert" on public.dm_messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from dm_members where thread_id = dm_messages.thread_id and user_id = auth.uid())
);
