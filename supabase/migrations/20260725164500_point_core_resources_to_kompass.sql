-- Core experiences now live directly in the new Kompass app.

update public.kompass_resources
set
  href = 'https://kompass-studieplan-2026.birkhaugnes.chatgpt.site/flashcards',
  source = 'kompass',
  updated_at = now()
where slug = 'all-flashcards';

update public.kompass_resources
set
  href = 'https://kompass-studieplan-2026.birkhaugnes.chatgpt.site/notes',
  source = 'kompass',
  updated_at = now()
where slug = 'notes';
