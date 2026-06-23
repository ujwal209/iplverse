-- Alter arena_matches to add custom configurations
alter table public.arena_matches
  add column if not exists time_limit int default 30, -- in seconds, e.g. 15, 30, 60, 0 (unlimited)
  add column if not exists game_format text default 'mixed', -- mixed, guess_who, stat_smash, guess_match, career_path, connections, arena_quiz
  add column if not exists difficulty text default 'medium'; -- easy, medium, hard

-- Create Arena Chat Messages Table
create table if not exists public.arena_chat_messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references public.arena_matches(id) on delete cascade not null,
  sender_id uuid references public.users(id) on delete cascade not null,
  message_text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime Replication for Arena Chat Messages
alter publication supabase_realtime add table public.arena_chat_messages;
