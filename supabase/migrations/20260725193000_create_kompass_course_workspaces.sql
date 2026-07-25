-- Cloud workspaces for Kompass subjects.
-- Shared items are authored by admins; each student can also keep private folders,
-- notes, files and progress in the same subject room.

create table if not exists public.kompass_course_folders (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.kompass_subjects(code) on update cascade on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  kind text not null default 'general'
    check (kind in ('general', 'lectures', 'notes', 'resources', 'assignments')),
  visibility text not null default 'private'
    check (visibility in ('private', 'shared')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kompass_course_notes (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.kompass_subjects(code) on update cascade on delete cascade,
  folder_id uuid references public.kompass_course_folders(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null default '',
  visibility text not null default 'private'
    check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kompass_course_files (
  id uuid primary key default gen_random_uuid(),
  subject_code text not null references public.kompass_subjects(code) on update cascade on delete cascade,
  folder_id uuid references public.kompass_course_folders(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  storage_bucket text not null default 'kompass-resources',
  storage_path text not null,
  content_type text,
  visibility text not null default 'private'
    check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table if not exists public.kompass_course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_code text not null references public.kompass_subjects(code) on update cascade on delete cascade,
  completed_lecture_ids text[] not null default '{}',
  completed_task_ids text[] not null default '{}',
  weekly_target integer not null default 5 check (weekly_target between 1 and 50),
  target_date date,
  tasks jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_code)
);

create index if not exists kompass_course_folders_subject_idx
  on public.kompass_course_folders (subject_code, visibility, sort_order);
create index if not exists kompass_course_folders_owner_idx
  on public.kompass_course_folders (owner_id);
create index if not exists kompass_course_notes_subject_idx
  on public.kompass_course_notes (subject_code, visibility, updated_at desc);
create index if not exists kompass_course_notes_owner_idx
  on public.kompass_course_notes (owner_id);
create index if not exists kompass_course_files_subject_idx
  on public.kompass_course_files (subject_code, visibility, updated_at desc);
create index if not exists kompass_course_files_owner_idx
  on public.kompass_course_files (owner_id);

alter table public.kompass_course_folders enable row level security;
alter table public.kompass_course_notes enable row level security;
alter table public.kompass_course_files enable row level security;
alter table public.kompass_course_progress enable row level security;

create policy "Users read visible Kompass course folders"
  on public.kompass_course_folders
  for select to authenticated
  using (visibility = 'shared' or owner_id = (select auth.uid()));
create policy "Users create own Kompass course folders"
  on public.kompass_course_folders
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users update own Kompass course folders"
  on public.kompass_course_folders
  for update to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  )
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users delete own Kompass course folders"
  on public.kompass_course_folders
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "Users read visible Kompass course notes"
  on public.kompass_course_notes
  for select to authenticated
  using (visibility = 'shared' or owner_id = (select auth.uid()));
create policy "Users create own Kompass course notes"
  on public.kompass_course_notes
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users update own Kompass course notes"
  on public.kompass_course_notes
  for update to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  )
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users delete own Kompass course notes"
  on public.kompass_course_notes
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "Users read visible Kompass course files"
  on public.kompass_course_files
  for select to authenticated
  using (visibility = 'shared' or owner_id = (select auth.uid()));
create policy "Users create own Kompass course files"
  on public.kompass_course_files
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users update own Kompass course files"
  on public.kompass_course_files
  for update to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  )
  with check (
    owner_id = (select auth.uid())
    and (
      visibility = 'private'
      or exists (
        select 1 from public.profiles
        where profiles.id = (select auth.uid()) and profiles.is_admin = true
      )
    )
  );
create policy "Users delete own Kompass course files"
  on public.kompass_course_files
  for delete to authenticated
  using (
    owner_id = (select auth.uid())
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

create policy "Users read own Kompass course progress"
  on public.kompass_course_progress
  for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users create own Kompass course progress"
  on public.kompass_course_progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users update own Kompass course progress"
  on public.kompass_course_progress
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete own Kompass course progress"
  on public.kompass_course_progress
  for delete to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on table public.kompass_course_folders to authenticated;
grant select, insert, update, delete on table public.kompass_course_notes to authenticated;
grant select, insert, update, delete on table public.kompass_course_files to authenticated;
grant select, insert, update, delete on table public.kompass_course_progress to authenticated;

drop policy if exists "Authenticated users read published Kompass files"
  on storage.objects;
create policy "Authenticated users read visible Kompass files"
  on storage.objects
  for select to authenticated
  using (
    bucket_id = 'kompass-resources'
    and (
      exists (
        select 1 from public.kompass_resources
        where kompass_resources.storage_bucket = storage.objects.bucket_id
          and kompass_resources.storage_path = storage.objects.name
          and kompass_resources.published = true
      )
      or exists (
        select 1 from public.kompass_course_files
        where kompass_course_files.storage_bucket = storage.objects.bucket_id
          and kompass_course_files.storage_path = storage.objects.name
          and (
            kompass_course_files.visibility = 'shared'
            or kompass_course_files.owner_id = (select auth.uid())
          )
      )
    )
  );

drop policy if exists "Users upload own Kompass course files"
  on storage.objects;
create policy "Users upload own Kompass course files"
  on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kompass-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update own Kompass course files"
  on storage.objects;
create policy "Users update own Kompass course files"
  on storage.objects
  for update to authenticated
  using (
    bucket_id = 'kompass-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'kompass-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete own Kompass course files"
  on storage.objects;
create policy "Users delete own Kompass course files"
  on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kompass-resources'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

update public.kompass_subjects
set status = 'archived', featured = false, updated_at = now()
where code not in ('BED2', 'SOL2', 'MET3', 'SOL3');

insert into public.kompass_subjects
  (code, name, category, description, icon, accent, status, featured, published, sort_order)
values
  ('BED2', 'Finansregnskap og regnskapsanalyse', 'Høst 2026', 'Regnskapsarkitektur, analyse, vurdering, konsern og en komplett læringsreise med 41 forelesningsnotater.', 'building.columns', '#176b55', 'active', true, true, 10),
  ('SOL2', 'Strategi og ledelse', 'Høst 2026', 'Forelesninger, egne notater, filer og fremdrift samlet i ett fagrom.', 'compass.drawing', '#7759a6', 'active', true, true, 20),
  ('MET3', 'Metode og analyse', 'Høst 2026', 'Forelesninger, arbeidsfiler, analyseverktøy og faglig fremdrift.', 'chart.xyaxis.line', '#3273a8', 'active', true, true, 30),
  ('SOL3', 'Organisasjon og samfunn', 'Høst 2026', 'Forelesninger, notater, fagressurser og en fleksibel fremgangsplan.', 'person.3', '#bd6b3c', 'active', true, true, 40)
on conflict (code) do update set
  name = excluded.name,
  category = excluded.category,
  description = excluded.description,
  icon = excluded.icon,
  accent = excluded.accent,
  status = excluded.status,
  featured = excluded.featured,
  published = excluded.published,
  sort_order = excluded.sort_order,
  updated_at = now();
