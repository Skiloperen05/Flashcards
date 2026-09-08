-- Cover foreign keys introduced by the paid exam-package/catalog migration.
create index if not exists answer_package_entitlements_package_id_idx
  on public.answer_package_entitlements (package_id);

create index if not exists app_subjects_updated_by_idx
  on public.app_subjects (updated_by);
