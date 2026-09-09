-- Keep the Fagstudio source of truth and the legacy commerce catalogue aligned.
-- The client also reads subject_pages directly, but this makes a new subject
-- immediately available to the admin catalogue, pricing and every frontend.
create or replace function public.sync_fagstudio_subject_to_catalog()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    if old.origin = 'custom' then
      update public.app_subjects
      set published = false,
          updated_at = now()
      where code = old.subject_code;
    end if;
    return old;
  end if;

  if new.origin = 'custom' then
    insert into public.app_subjects (
      code, name, description, category_id, accent, icon, path,
      flashcards_path, status, published, sort_order, updated_at, updated_by
    ) values (
      upper(trim(new.subject_code)),
      new.name,
      coalesce(nullif(new.lead, ''), nullif(new.kicker, ''), ''),
      coalesce(nullif(new.category_id, ''), 'electives'),
      coalesce(nullif(new.accent, ''), '#2563eb'),
      coalesce(nullif(new.icon, ''), '📚'),
      '../subject/?id=' || lower(trim(new.subject_code)),
      coalesce(nullif(new.flashcards_url, ''), '../flashcards/?subject=' || lower(trim(new.subject_code))),
      case
        when lower(coalesce(new.status_text, '')) like 'eksamen%' then 'exam'
        when lower(coalesce(new.status_text, '')) like 'kommer%' then 'coming'
        when lower(coalesce(new.status_text, '')) like 'arkiv%' then 'archived'
        else 'active'
      end,
      new.is_published,
      100,
      coalesce(new.updated_at, now()),
      new.updated_by
    )
    on conflict (code) do update set
      name = excluded.name,
      description = excluded.description,
      category_id = excluded.category_id,
      accent = excluded.accent,
      icon = excluded.icon,
      path = excluded.path,
      flashcards_path = excluded.flashcards_path,
      status = excluded.status,
      published = excluded.published,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by;

    insert into public.subject_prices (subject_code, price_nok_ore, updated_at)
    values (upper(trim(new.subject_code)), 4900, now())
    on conflict (subject_code) do nothing;
  elsif tg_op = 'UPDATE' and old.origin = 'custom' then
    update public.app_subjects
    set published = false,
        updated_at = now()
    where code = old.subject_code;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_fagstudio_subject_to_catalog on public.subject_pages;
create trigger trg_sync_fagstudio_subject_to_catalog
  after insert or update or delete on public.subject_pages
  for each row execute function public.sync_fagstudio_subject_to_catalog();
