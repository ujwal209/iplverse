alter table arena_matches
  add column if not exists round_number int default 1,
  add column if not exists max_rounds int default 7,
  add column if not exists match_history jsonb default '[]'::jsonb,
  add column if not exists round_expires_at timestamp with time zone,
  add column if not exists round_type text,
  add column if not exists current_round_data jsonb;
