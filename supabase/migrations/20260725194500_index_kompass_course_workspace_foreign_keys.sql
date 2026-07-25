-- Cover workspace foreign keys used when folders and subjects are updated/deleted.

create index if not exists kompass_course_notes_folder_id_idx
  on public.kompass_course_notes (folder_id);
create index if not exists kompass_course_files_folder_id_idx
  on public.kompass_course_files (folder_id);
create index if not exists kompass_course_progress_subject_code_idx
  on public.kompass_course_progress (subject_code);
