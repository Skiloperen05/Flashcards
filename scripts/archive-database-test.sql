-- Run inside a transaction; all fixtures and auth data must be rolled back.
do $$ declare test_user uuid; begin
  select id into test_user from public.profiles where not is_admin and not coalesce(is_friend,false) limit 1;
  assert test_user is not null, 'Requires an existing ordinary test user';
  perform set_config('request.jwt.claims', jsonb_build_object('sub',test_user,'role','authenticated')::text,true);
end $$;
insert into public.subject_pages(subject_code,name,is_published) values('ARCHIVETEST','Archive regression test',true);
insert into public.subject_files(id,subject_code,kind,term,title,storage_bucket,storage_path,meta) values
 ('00000000-0000-4000-8000-00000000f111','ARCHIVETEST','answer','H2025','Model answer','subject-files','test/model.pdf','{"resource_kind":"A-besvarelse"}'),
 ('00000000-0000-4000-8000-00000000f112','ARCHIVETEST','answer','H25','Exam','subject-files','test/exam.pdf','{"resource_kind":"Eksamen"}'),
 ('00000000-0000-4000-8000-00000000f113','ARCHIVETEST','memo','','Private lecture note','subject-files','test/note.pdf','{}'),
 ('00000000-0000-4000-8000-00000000f114','ARCHIVETEST','answer','V26','Other exam','subject-files','test/other.pdf','{}');
do $$ begin
  assert (select count(*)=2 from public.answer_resources where package_id='archivetest-h25'), 'One package per normalized term';
  assert (select resource_count=2 and not sale_active from public.answer_packages where id='archivetest-h25'), 'Counts and explicit sale opt-in';
end $$;
-- Admin writes also work through authenticated RLS and invoker triggers.
do $$ begin
  perform set_config('bh_archive.student_claims',current_setting('request.jwt.claims'),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',(select id from public.profiles where is_admin limit 1),'role','authenticated')::text,true);
end $$;
set local role authenticated;
insert into public.subject_files(id,subject_code,kind,term,title,storage_bucket,storage_path)
values('00000000-0000-4000-8000-00000000f115','ARCHIVETEST','answer','H26','Admin upload','subject-files','test/admin.pdf');
-- Add an exam text later through the same metadata used by Fagstudio's add action.
-- Existing pricing/publication and the original answer must survive the append.
update public.answer_packages set price_nok_ore=9900,sale_active=true where id='archivetest-h26';
insert into public.subject_files(id,subject_code,kind,term,title,storage_bucket,storage_path,meta)
values('00000000-0000-4000-8000-00000000f116','ARCHIVETEST','answer','H2026','Exam text added later','subject-files','test/appended-exam.pdf',
  '{"answer_package_id":"archivetest-h26","package_title":"Different file label","resource_kind":"Eksamen"}');
do $$ begin
  assert (select resource_count=2 and price_nok_ore=9900 and sale_active from public.answer_packages where id='archivetest-h26'), 'Appending keeps the same package and sale settings';
  assert (select count(*)=1 from public.answer_packages where subject_code='ARCHIVETEST' and term='H26'), 'Appending does not create another normalized package';
  assert (select storage_path='test/admin.pdf' and title='Admin upload' from public.subject_files where id='00000000-0000-4000-8000-00000000f115'), 'Appending preserves the existing answer';
  assert (select kind='Eksamen' and package_id='archivetest-h26' from public.answer_resources where subject_file_id='00000000-0000-4000-8000-00000000f116'), 'Exam text appears beside the answer in the archive';
end $$;
reset role;
do $$ begin perform set_config('request.jwt.claims',current_setting('bh_archive.student_claims'),true); end $$;
insert into public.answer_package_entitlements(user_id,package_id,source) values((auth.jwt()->>'sub')::uuid,'archivetest-h25','stripe_package');
set local role authenticated;
do $$ begin
  assert (select count(*)=2 from public.subject_files where subject_code='ARCHIVETEST'), 'Package buyer sees only the two purchased documents';
  assert (select count(*)=2 from public.answer_resources where package_id like 'archivetest-%'), 'Other package resources remain private';
  assert not public.has_subject_entitlement('ARCHIVETEST'), 'Package purchase does not grant subject ownership';
end $$;
reset role;
update public.answer_packages set published=false where id='archivetest-h25';
set local role authenticated;
do $$ begin
  assert (select count(*)=0 from public.subject_files where subject_code='ARCHIVETEST'), 'Unpublishing blocks standalone document access';
end $$;
reset role;
update public.answer_packages set published=true where id='archivetest-h25';
update public.subject_files set title='Updated model',term='V26' where id='00000000-0000-4000-8000-00000000f111';
do $$ begin
  assert (select package_id='archivetest-v26' and title='Updated model' from public.answer_resources where subject_file_id='00000000-0000-4000-8000-00000000f111'), 'Edits move and update the shared document';
  assert (select resource_count=1 from public.answer_packages where id='archivetest-h25'), 'Old package count updates';
end $$;
delete from public.subject_files where id='00000000-0000-4000-8000-00000000f112';
do $$ begin
  assert (select count(*)=0 from public.answer_resources where subject_file_id='00000000-0000-4000-8000-00000000f112'), 'Deleting a source removes the archive entry';
  assert (select resource_count=0 from public.answer_packages where id='archivetest-h25'), 'Empty package count updates';
end $$;
