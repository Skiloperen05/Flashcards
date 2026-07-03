create table if not exists public.app_private_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.app_private_config enable row level security;

revoke all on public.app_private_config from anon, authenticated;
