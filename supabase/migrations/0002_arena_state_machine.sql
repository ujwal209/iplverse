alter table arena_matches
  add column if not exists current_state text default 'waiting',
  add column if not exists current_question jsonb,
  add column if not exists host_answer jsonb,
  add column if not exists guest_answer jsonb,
  add column if not exists countdown_expires_at timestamp with time zone;
