-- Create Friendships Table
create table if not exists public.friendships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  friend_id uuid references public.users(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, friend_id)
);

-- Create Direct Messages Table
create table if not exists public.direct_messages (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  message_text text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Game Challenges Table
create table if not exists public.game_challenges (
  id uuid primary key default uuid_generate_v4(),
  challenger_id uuid references public.users(id) on delete cascade not null,
  challenged_id uuid references public.users(id) on delete cascade not null,
  game_type text not null,
  room_code text,
  status text not null check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Realtime Replication for Social Tables
alter publication supabase_realtime add table public.friendships;
alter publication supabase_realtime add table public.direct_messages;
alter publication supabase_realtime add table public.game_challenges;
