create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  caption text,
  taken_at timestamptz,
  is_public boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now()
);

create table if not exists public.post_assets (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  storage_path text not null unique,
  width integer,
  height integer,
  dominant_color text,
  camera_make text,
  camera_model text,
  focal_length text,
  aperture text,
  shutter_speed text,
  iso integer,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_post_assets_post_id_position
  on public.post_assets(post_id, position);

alter table public.posts enable row level security;
alter table public.post_assets enable row level security;

drop policy if exists "Public read posts" on public.posts;
create policy "Public read posts"
  on public.posts
  for select
  to anon, authenticated
  using (is_public = true);

drop policy if exists "Public read post assets" on public.post_assets;
create policy "Public read post assets"
  on public.post_assets
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.posts
      where posts.id = post_assets.post_id
      and posts.is_public = true
    )
  );
