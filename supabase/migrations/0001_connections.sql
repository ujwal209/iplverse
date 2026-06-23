create table if not exists connections_puzzles (
  id uuid primary key default gen_random_uuid(),
  puzzle_date date not null,
  puzzle_type text not null default 'daily', -- 'daily' or 'all_time'
  categories jsonb not null, -- Array of { id, title, items[], difficulty }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(puzzle_date, puzzle_type)
);

create table if not exists connections_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade not null,
  puzzle_id uuid references connections_puzzles(id) on delete cascade not null,
  mistakes int default 0,
  won boolean default false,
  time_taken int default 0, -- in seconds
  history jsonb default '[]'::jsonb, -- Array of guesses (arrays of item IDs)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, puzzle_id)
);
