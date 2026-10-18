-- Enable COSO study in the existing RRR11 subject after deploying the matching frontend.
-- Preserve all other Fagstudio settings, publication state, access rules and content.
update public.subject_pages
set visibility = coalesce(visibility, '{}'::jsonb) || '{"flashcards":true}'::jsonb,
    flashcards_url = '../flashcards/?subject=rrr11',
    flashcards_kicker = 'COSO · 30 flashcards og quizspørsmål'
where subject_code = 'RRR11';
