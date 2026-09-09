-- Older Fagstudio courses were stored only in subject_pages. Backfill them
-- into the commercial catalogue so they appear in the menu and shop too.
insert into public.app_subjects (
  code, name, description, category_id, accent, icon, path, flashcards_path,
  status, published, sort_order, updated_at, updated_by
)
select
  upper(trim(page.subject_code)),
  page.name,
  coalesce(nullif(page.lead, ''), nullif(page.kicker, ''), ''),
  coalesce(nullif(page.category_id, ''), 'electives'),
  coalesce(nullif(page.accent, ''), '#2563eb'),
  coalesce(nullif(page.icon, ''), '📚'),
  '../subject/?id=' || lower(trim(page.subject_code)),
  coalesce(nullif(page.flashcards_url, ''), '../flashcards/?subject=' || lower(trim(page.subject_code))),
  case
    when lower(coalesce(page.status_text, '')) like 'eksamen%' then 'exam'
    when lower(coalesce(page.status_text, '')) like 'kommer%' then 'coming'
    when lower(coalesce(page.status_text, '')) like 'arkiv%' then 'archived'
    else 'active'
  end,
  page.is_published,
  100,
  coalesce(page.updated_at, now()),
  page.updated_by
from public.subject_pages as page
where page.origin = 'custom'
on conflict (code) do nothing;

insert into public.subject_prices (subject_code, price_nok_ore, updated_at)
select page.subject_code, 4900, now()
from public.subject_pages as page
left join public.subject_prices as price on price.subject_code = page.subject_code
where page.origin = 'custom'
  and price.subject_code is null
on conflict (subject_code) do nothing;
