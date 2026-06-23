-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table if not exists users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text,
  username text unique not null,
  favorite_team text,
  favorite_player text,
  experience_level text,
  games_played int default 0,
  wins int default 0,
  losses int default 0,
  arena_rating int default 1000,
  current_streak int default 0,
  longest_streak int default 0,
  last_played_date date,
  total_points int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- DAILY COMPLETIONS TABLE (Tracks if a user finished a specific game on a specific day)
create table if not exists daily_completions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  game_type text not null, -- 'guess_who', 'stat_smash', 'guess_match', 'career_path'
  played_date date not null default current_date,
  score int default 0,
  won boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, game_type, played_date)
);

-- USER ACHIEVEMENTS TABLE
create table if not exists user_achievements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  achievement_id text not null, -- e.g., 'first_win', 'streak_7', 'arena_champion'
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, achievement_id)
);

-- ARENA MATCHES TABLE
create table if not exists arena_matches (
  id uuid primary key default uuid_generate_v4(),
  room_code text not null,
  host_id uuid references users(id) on delete set null,
  guest_id uuid references users(id) on delete set null,
  winner_id uuid references users(id) on delete set null,
  host_score int default 0,
  guest_score int default 0,
  status text default 'waiting', -- waiting, playing, finished
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- COMMUNITY XIS TABLE
create table if not exists community_xis (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references users(id) on delete cascade not null,
  title text not null,
  players jsonb not null, -- Array of player names/IDs
  upvotes int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- XI VOTES TABLE
create table if not exists xi_votes (
  id uuid primary key default uuid_generate_v4(),
  xi_id uuid references community_xis(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  vote_type int not null, -- 1 for upvote, -1 for downvote
  unique(xi_id, user_id)
);

-- Row Level Security (RLS) setup (optional but good practice)
-- For this prototype, we'll allow public reads and authenticated writes.
-- Depending on how the API is structured (Service Role vs Anon Key), we can keep it open for now or strict.
