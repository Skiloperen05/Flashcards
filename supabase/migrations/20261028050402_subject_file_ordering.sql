-- One transaction per reorder; keep the existing file RLS and document/archive links.
create or replace function public.reorder_subject_files(
  p_subject_code text, p_kind text, p_ordered_ids uuid[], p_expected_ids uuid[]
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  subject_key text := upper(trim(p_subject_code));
  current_ids uuid[];
  affected integer;
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = (select auth.uid()) and is_admin = true
  ) then
    raise exception 'Bare administratorer kan endre dokumentrekkefølgen' using errcode = '42501';
  end if;
  if subject_key is null or subject_key = '' or p_kind is null or p_kind not in ('memo','answer','task','attachment')
    or p_ordered_ids is null or p_expected_ids is null then
    raise exception 'Ugyldig dokumentrekkefølge' using errcode = '22023';
  end if;
  -- Inserts take the same lock, so a new upload cannot slip into a reorder.
  perform 1 from public.subject_pages where subject_code = subject_key for update;
  if not found then raise exception 'Faget ble ikke funnet' using errcode = '22023'; end if;
  select coalesce(array_agg(id order by sort_order, uploaded_at, id), '{}'::uuid[]) into current_ids
    from public.subject_files where subject_code = subject_key and kind = p_kind;
  if current_ids is distinct from p_expected_ids then
    raise exception 'Dokumentlisten er endret. Last inn listen på nytt og prøv igjen.' using errcode = '40001';
  end if;
  if (select array_agg(id order by id) from unnest(p_ordered_ids) as ids(id)) is distinct from
     (select array_agg(id order by id) from unnest(current_ids) as ids(id)) then
    raise exception 'Rekkefølgen må inneholde alle dokumentene i denne seksjonen én gang' using errcode = '22023';
  end if;
  update public.subject_files as f set sort_order = (ordered.position - 1)::integer
    from unnest(p_ordered_ids) with ordinality as ordered(id, position)
    where f.id = ordered.id and f.subject_code = subject_key and f.kind = p_kind;
  get diagnostics affected = row_count;
  if affected <> cardinality(current_ids) then
    raise exception 'Dokumentlisten er endret. Last inn listen på nytt og prøv igjen.' using errcode = '40001';
  end if;
end;
$$;
revoke all on function public.reorder_subject_files(text,text,uuid[],uuid[]) from public, anon;
grant execute on function public.reorder_subject_files(text,text,uuid[],uuid[]) to authenticated;

-- Always append new documents. Old clients also used sort_order=0 on every upload.
create or replace function public.append_subject_file_position()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.subject_pages where subject_code = NEW.subject_code for update;
  select coalesce(max(sort_order), -1) + 1 into NEW.sort_order
    from public.subject_files where subject_code = NEW.subject_code and kind = NEW.kind;
  return NEW;
end;
$$;
revoke all on function public.append_subject_file_position() from public, anon, authenticated;
drop trigger if exists subject_file_append_position on public.subject_files;
create trigger subject_file_append_position before insert on public.subject_files
  for each row execute function public.append_subject_file_position();
