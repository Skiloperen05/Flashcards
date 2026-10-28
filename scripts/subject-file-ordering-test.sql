-- Run against the applied migration. All fixtures and mutations are rolled back.
begin;
do $$
declare admin_id uuid;
begin
  select id into admin_id from public.profiles where is_admin = true limit 1;
  if admin_id is null then raise exception 'Testen krever en eksisterende administrator'; end if;
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',admin_id,'role','authenticated')::text, true);
end;
$$;
set local role authenticated;
do $$
declare
  a uuid; b uuid; c uuid; other_kind uuid; other_subject uuid;
  expected uuid[]; actual uuid[]; exam_a uuid; exam_b uuid;
begin
  insert into public.subject_pages(subject_code,name,is_published) values ('ORDERTEST','Ordering regression',false),('ORDEROTHER','Other subject',false);
  insert into public.subject_files(subject_code,kind,title,sort_order) values ('ORDERTEST','memo','Note A',0) returning id into a;
  insert into public.subject_files(subject_code,kind,title,sort_order) values ('ORDERTEST','memo','Note B',0) returning id into b;
  insert into public.subject_files(subject_code,kind,title,sort_order) values ('ORDERTEST','memo','Note C',0) returning id into c;
  insert into public.subject_files(subject_code,kind,title,sort_order) values ('ORDERTEST','task','Task',0) returning id into other_kind;
  insert into public.subject_files(subject_code,kind,title,sort_order) values ('ORDEROTHER','memo','Other',0) returning id into other_subject;
  assert (select array_agg(sort_order order by sort_order) from public.subject_files where subject_code='ORDERTEST' and kind='memo') = array[0,1,2], 'Uploads must append even when an old client sends 0';
  expected := array[a,b,c];
  perform public.reorder_subject_files('ORDERTEST','memo',array[c,a,b],expected);
  select array_agg(id order by sort_order,uploaded_at,id) into actual from public.subject_files where subject_code='ORDERTEST' and kind='memo';
  assert actual=array[c,a,b], 'Saved order must survive a fresh database read';
  assert (select sort_order from public.subject_files where id=other_kind)=0, 'Do not reorder other kinds';
  begin
    perform public.reorder_subject_files('ORDERTEST','memo',array[a,b,c],expected);
    assert false, 'Reject a stale view of the list';
  exception when serialization_failure then null;
  end;
  expected := actual;
  begin
    perform public.reorder_subject_files('ORDERTEST','memo',array[c,a,a],expected);
    assert false, 'Reject duplicated/missing IDs';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.reorder_subject_files('ORDERTEST','memo',array[c,a,other_kind],expected);
    assert false, 'Reject IDs from another section';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.reorder_subject_files('ORDERTEST','memo',array[c,a,other_subject],expected);
    assert false, 'Reject IDs from another subject';
  exception when invalid_parameter_value then null;
  end;
  insert into public.subject_files(subject_code,kind,title) values ('ORDERTEST','memo','Note D');
  assert (select sort_order from public.subject_files where subject_code='ORDERTEST' and title='Note D')=3, 'New uploads belong after the manually ordered list';
  begin
    perform public.reorder_subject_files('ORDERTEST','memo',expected,expected);
    assert false, 'Reject a reorder after another upload';
  exception when serialization_failure then null;
  end;
  assert (select array_agg(id order by sort_order) from public.subject_files where id=any(expected))=expected, 'Failed calls must leave the order unchanged';
  insert into public.subject_files(subject_code,kind,title,term,storage_bucket,storage_path) values ('ORDERTEST','answer','Exam A','H99','subject-files','ordering-test-a.pdf') returning id into exam_a;
  insert into public.subject_files(subject_code,kind,title,term,storage_bucket,storage_path) values ('ORDERTEST','answer','Exam B','H99','subject-files','ordering-test-b.pdf') returning id into exam_b;
  perform public.reorder_subject_files('ORDERTEST','answer',array[exam_b,exam_a],array[exam_a,exam_b]);
  assert (select order_index from public.answer_resources where subject_file_id=exam_b)=0, 'The exam archive must follow the source order';
  assert (select order_index from public.answer_resources where subject_file_id=exam_a)=1, 'The archive retains both documents';
end;
$$;
-- An authenticated non-admin cannot reorder any subject.
do $$
begin
  perform set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
  perform set_config('request.jwt.claims', jsonb_build_object('sub',current_setting('request.jwt.claim.sub'),'role','authenticated')::text, true);
  begin
    perform public.reorder_subject_files('ORDERTEST','memo','{}'::uuid[],'{}'::uuid[]);
    assert false, 'Non-admin calls must fail';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
set local role anon;
do $$
begin
  begin
    perform public.reorder_subject_files('ORDERTEST','memo','{}'::uuid[],'{}'::uuid[]);
    assert false, 'Anonymous calls must fail';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'Subject ordering passed: append, reload, complete lists, stale changes, subject/kind boundaries and admin-only RLS.' as result;
