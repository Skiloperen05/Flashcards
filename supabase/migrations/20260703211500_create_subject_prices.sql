create table if not exists public.subject_prices (
  subject_code text primary key,
  price_nok_ore integer not null check (price_nok_ore >= 300),
  updated_at timestamptz not null default now()
);

alter table public.subject_prices enable row level security;

drop policy if exists "subject_prices_read" on public.subject_prices;
create policy "subject_prices_read" on public.subject_prices
  for select to anon, authenticated using (true);

insert into public.subject_prices (subject_code, price_nok_ore) values
  ('RET14', 4900),
  ('SOL1', 4900),
  ('SAM2', 4900),
  ('SAM3', 4900),
  ('MET2', 4900),
  ('MAT10', 4900),
  ('SAM1A', 4900),
  ('MET1', 4900),
  ('KOM1', 4900),
  ('RET1A', 4900),
  ('BED1', 4900)
on conflict (subject_code) do nothing;
