alter table public.subject_prices
  add column if not exists updated_by uuid references auth.users(id);

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'subject_prices_price_nok_ore_check'
      and conrelid = 'public.subject_prices'::regclass
  ) then
    alter table public.subject_prices drop constraint subject_prices_price_nok_ore_check;
  end if;

  alter table public.subject_prices
    add constraint subject_prices_price_nok_ore_check
    check (price_nok_ore >= 0);
end $$;

alter table public.subject_prices enable row level security;

grant select on public.subject_prices to anon;
grant select, insert, update, delete on public.subject_prices to authenticated;

drop policy if exists "subject_prices_read" on public.subject_prices;
drop policy if exists "Read subject prices" on public.subject_prices;
create policy "subject_prices_read"
  on public.subject_prices
  for select
  to anon, authenticated
  using (true);

drop policy if exists "subject_prices_admin_write" on public.subject_prices;
drop policy if exists "Admins manage subject prices" on public.subject_prices;
create policy "subject_prices_admin_write"
  on public.subject_prices
  for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and is_admin = true
  ));
