create table if not exists public.subject_haugnes_ratings (
  subject_id text primary key,
  workload integer check (workload between 1 and 5),
  relevance integer check (relevance between 1 and 5),
  exam_difficulty integer check (exam_difficulty between 1 and 5),
  curriculum integer check (curriculum between 1 and 5),
  lecture_value integer check (lecture_value between 1 and 5),
  verdict text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.subject_haugnes_ratings enable row level security;

drop policy if exists "subject_haugnes_ratings_select_authenticated" on public.subject_haugnes_ratings;
create policy "subject_haugnes_ratings_select_authenticated"
  on public.subject_haugnes_ratings
  for select
  to authenticated
  using (true);

drop policy if exists "subject_haugnes_ratings_insert_admin" on public.subject_haugnes_ratings;
create policy "subject_haugnes_ratings_insert_admin"
  on public.subject_haugnes_ratings
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

drop policy if exists "subject_haugnes_ratings_update_admin" on public.subject_haugnes_ratings;
create policy "subject_haugnes_ratings_update_admin"
  on public.subject_haugnes_ratings
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1
      from public.profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

create index if not exists subject_haugnes_ratings_updated_at_idx
  on public.subject_haugnes_ratings (updated_at desc);
