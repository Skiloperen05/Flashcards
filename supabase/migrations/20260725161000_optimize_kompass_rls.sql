-- Keep Kompass catalog reads in one permissive SELECT policy per table.
-- Admin writes use operation-specific policies to avoid overlapping SELECT rules.

drop policy if exists "Admins manage Kompass subjects"
  on public.kompass_subjects;
drop policy if exists "Admins create Kompass subjects"
  on public.kompass_subjects;
drop policy if exists "Admins update Kompass subjects"
  on public.kompass_subjects;
drop policy if exists "Admins delete Kompass subjects"
  on public.kompass_subjects;

create policy "Admins create Kompass subjects"
  on public.kompass_subjects
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins update Kompass subjects"
  on public.kompass_subjects
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins delete Kompass subjects"
  on public.kompass_subjects
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass resources"
  on public.kompass_resources;
drop policy if exists "Admins create Kompass resources"
  on public.kompass_resources;
drop policy if exists "Admins update Kompass resources"
  on public.kompass_resources;
drop policy if exists "Admins delete Kompass resources"
  on public.kompass_resources;

create policy "Admins create Kompass resources"
  on public.kompass_resources
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins update Kompass resources"
  on public.kompass_resources
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins delete Kompass resources"
  on public.kompass_resources
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass content"
  on public.kompass_content_blocks;
drop policy if exists "Admins create Kompass content"
  on public.kompass_content_blocks;
drop policy if exists "Admins update Kompass content"
  on public.kompass_content_blocks;
drop policy if exists "Admins delete Kompass content"
  on public.kompass_content_blocks;

create policy "Admins create Kompass content"
  on public.kompass_content_blocks
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins update Kompass content"
  on public.kompass_content_blocks
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins delete Kompass content"
  on public.kompass_content_blocks
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage Kompass files"
  on storage.objects;
drop policy if exists "Admins create Kompass files"
  on storage.objects;
drop policy if exists "Admins update Kompass files"
  on storage.objects;
drop policy if exists "Admins delete Kompass files"
  on storage.objects;

create policy "Admins create Kompass files"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins update Kompass files"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  )
  with check (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create policy "Admins delete Kompass files"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'kompass-resources'
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.is_admin = true
    )
  );

create index if not exists kompass_subjects_updated_by_idx
  on public.kompass_subjects (updated_by);
create index if not exists kompass_resources_subject_code_idx
  on public.kompass_resources (subject_code);
create index if not exists kompass_resources_updated_by_idx
  on public.kompass_resources (updated_by);
create index if not exists kompass_content_blocks_updated_by_idx
  on public.kompass_content_blocks (updated_by);
