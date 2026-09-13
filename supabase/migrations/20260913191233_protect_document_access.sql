-- File metadata and file bytes must obey the same publication/access checks.
drop policy if exists "Read files if entitled" on public.subject_files;
create policy "Read files if entitled" on public.subject_files for select to authenticated
using (
  public.has_subject_entitlement(subject_code)
  and exists (select 1 from public.subject_pages p where p.subject_code = subject_files.subject_code and p.is_published)
);

drop policy if exists "Read subject files if entitled" on storage.objects;
create policy "Read subject files if entitled" on storage.objects for select to authenticated
using (
  bucket_id = 'subject-files'
  and exists (
    select 1 from public.subject_files f
    where f.storage_bucket = objects.bucket_id and f.storage_path = objects.name
  )
);

-- Existing direct links must be migrated by an admin, never newly published.
alter table public.subject_files add constraint subject_files_no_public_document_url
  check (coalesce(external_url, '') = '') not valid;

update storage.buckets set public = false where id in ('subject-files', 'answer-pdfs');
