-- Add status to workouts
alter table public.workouts 
add column status text check (status in ('scheduled', 'completed', 'skipped')) default 'scheduled';

-- Add target fields to sets
alter table public.sets
add column target_weight numeric,
add column target_reps integer,
add column target_rpe numeric;
