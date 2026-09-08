-- Keep identical authorization while avoiding duplicate permissive SELECT policies.
drop policy if exists "Admins read answer package entitlements" on public.answer_package_entitlements;
drop policy if exists "Users read own answer package entitlements" on public.answer_package_entitlements;
create policy "Users or admins read answer package entitlements"
  on public.answer_package_entitlements for select to authenticated
  using (
    (select auth.uid()) = user_id
    or exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid()) and profiles.is_admin = true
    )
  );

drop policy if exists "Admins manage app subjects" on public.app_subjects;
create policy "Admins insert app subjects"
  on public.app_subjects for insert to authenticated
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));
create policy "Admins update app subjects"
  on public.app_subjects for update to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));
create policy "Admins delete app subjects"
  on public.app_subjects for delete to authenticated
  using (exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid()) and profiles.is_admin = true
  ));
