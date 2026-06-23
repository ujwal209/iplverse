-- Add total_points column to public.users if it does not already exist
alter table public.users add column if not exists total_points int default 0;
