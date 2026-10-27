-- One protected document source, shared by subject pages and the exam archive.
alter table public.answer_resources
  add column if not exists subject_file_id uuid references public.subject_files(id) on delete cascade;
create unique index if not exists answer_resources_subject_file_id_idx
  on public.answer_resources(subject_file_id) where subject_file_id is not null;
alter table public.answer_packages add column if not exists resource_count integer not null default 0;

create or replace function public.refresh_answer_resource_count()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    update public.answer_packages set resource_count=greatest(0,resource_count-1) where id=OLD.package_id;
  elsif TG_OP = 'INSERT' then
    update public.answer_packages set resource_count=resource_count+1 where id=NEW.package_id;
  elsif OLD.package_id <> NEW.package_id then
    update public.answer_packages set resource_count=greatest(0,resource_count-1) where id=OLD.package_id;
    update public.answer_packages set resource_count=resource_count+1 where id=NEW.package_id;
  end if;
  return null;
end;
$$;
drop trigger if exists answer_resource_count_changed on public.answer_resources;
create trigger answer_resource_count_changed after insert or update or delete on public.answer_resources
  for each row execute function public.refresh_answer_resource_count();

create or replace function public.sync_subject_answer_to_archive()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  package_key text;
  exam_term text;
  resource_kind text;
  page_name text;
begin
  if NEW.kind <> 'answer' or coalesce(NEW.storage_bucket,'') not in ('subject-files','google_drive') or coalesce(NEW.storage_path, '') = '' then
    delete from public.answer_resources where subject_file_id = NEW.id;
    return NEW;
  end if;
  exam_term := upper(regexp_replace(coalesce(NEW.term,''), '\s+', '', 'g'));
  exam_term := regexp_replace(exam_term, '^([VH])20([0-9]{2})$', '\1\2');
  package_key := coalesce(nullif(NEW.meta->>'answer_package_id',''), lower(NEW.subject_code) || '-' || coalesce(nullif(regexp_replace(lower(exam_term),'[^a-z0-9]+','-','g'),''),'besvarelser'));
  select name into page_name from public.subject_pages where subject_code = NEW.subject_code;
  insert into public.answer_packages(id,subject_code,term,title,subtitle,description,published,sale_active)
    values(package_key,NEW.subject_code,exam_term,coalesce(nullif(NEW.meta->>'package_title',''),NEW.subject_code || case when exam_term <> '' then ' ' || exam_term else ' · Besvarelser' end),coalesce(page_name,NEW.subject_code),'Eksamensdokumenter publisert i faget.',true,false)
    on conflict(id) do nothing;
  if not exists(select 1 from public.answer_packages where id=package_key and subject_code=NEW.subject_code) then
    raise exception 'Pakken tilhører et annet fag';
  end if;
  resource_kind := coalesce(nullif(NEW.meta->>'resource_kind',''), case
    when (NEW.grade || ' ' || NEW.title || ' ' || coalesce(NEW.meta->>'original_name','')) ~* 'sensor|rettlei' then 'Sensorveiledning'
    when (NEW.grade || ' ' || NEW.title || ' ' || coalesce(NEW.meta->>'original_name','')) ~* 'oppgave|eksamen|exam' and (NEW.grade || ' ' || NEW.title || ' ' || coalesce(NEW.meta->>'original_name','')) !~* 'besvarelse|modell|løsning|losning|solution' then 'Eksamen'
    else 'A-besvarelse' end);
  insert into public.answer_resources(id,package_id,subject_file_id,kind,title,description,icon,url,download_url,order_index)
    values('subject-file-' || NEW.id,package_key,NEW.id,resource_kind,NEW.title,NEW.description,
      case resource_kind when 'Eksamen' then 'E' when 'Sensorveiledning' then 'S' else 'A' end,
      '/user/document.html?file=' || NEW.id,'/user/document.html?file=' || NEW.id || '&download=1',NEW.sort_order)
    on conflict(id) do update set package_id=excluded.package_id,kind=excluded.kind,title=excluded.title,
      description=excluded.description,icon=excluded.icon,url=excluded.url,download_url=excluded.download_url,order_index=excluded.order_index;
  return NEW;
end;
$$;
drop trigger if exists subject_answer_archive_changed on public.subject_files;
create trigger subject_answer_archive_changed after insert or update on public.subject_files
  for each row execute function public.sync_subject_answer_to_archive();
-- Trigger functions are not callable Data API endpoints; they run as the caller.
revoke all on function public.sync_subject_answer_to_archive() from public, anon, authenticated;
revoke all on function public.refresh_answer_resource_count() from public, anon, authenticated;

-- Package ownership grants only files actually linked to that published package.
drop policy if exists "Read files if entitled" on public.subject_files;
create policy "Read files if entitled" on public.subject_files for select to authenticated
using (
  exists(select 1 from public.subject_pages p where p.subject_code=subject_files.subject_code and p.is_published)
  and (public.has_subject_entitlement(subject_code) or (kind='answer' and exists(
    select 1 from public.answer_resources r join public.answer_packages p on p.id=r.package_id
    join public.answer_package_entitlements e on e.package_id=p.id
    where r.subject_file_id=subject_files.id and p.published and e.user_id=(select auth.uid())
  )))
);

-- Backfill uploaded answers (including RRR11); retain all files, pricing and purchases.
update public.subject_files set title=title where kind='answer';
update public.answer_packages p set resource_count=(select count(*) from public.answer_resources r where r.package_id=p.id);
