-- Create Users table (managed by Supabase Auth usually, but we might need a public profiles table)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Create Exercises table
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  muscle_group text,
  equipment text,
  user_id uuid references auth.users, -- null means global/default exercise
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Workouts table
create table public.workouts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  name text,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Workout Exercises table (Join table)
create table public.workout_exercises (
  id uuid default uuid_generate_v4() primary key,
  workout_id uuid references public.workouts not null,
  exercise_id uuid references public.exercises not null,
  "order" integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Sets table
create table public.sets (
  id uuid default uuid_generate_v4() primary key,
  workout_exercise_id uuid references public.workout_exercises not null,
  weight numeric,
  reps integer,
  rpe numeric,
  completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone." on public.profiles for select using ( true );
create policy "Users can insert their own profile." on public.profiles for insert with check ( auth.uid() = id );
create policy "Users can update own profile." on public.profiles for update using ( auth.uid() = id );

-- Exercises: Users can see their own + global (user_id is null)
create policy "Exercises viewable by user" on public.exercises for select using ( auth.uid() = user_id or user_id is null );
create policy "Exercises insertable by user" on public.exercises for insert with check ( auth.uid() = user_id );

-- Workouts: Users can only see their own
create policy "Workouts viewable by user" on public.workouts for select using ( auth.uid() = user_id );
create policy "Workouts insertable by user" on public.workouts for insert with check ( auth.uid() = user_id );
create policy "Workouts updatable by user" on public.workouts for update using ( auth.uid() = user_id );
create policy "Workouts deletable by user" on public.workouts for delete using ( auth.uid() = user_id );

-- Workout Exercises: Inherit from workout
create policy "Workout Exercises viewable by user" on public.workout_exercises for select using ( exists ( select 1 from public.workouts where id = workout_exercises.workout_id and user_id = auth.uid() ) );
create policy "Workout Exercises insertable by user" on public.workout_exercises for insert with check ( exists ( select 1 from public.workouts where id = workout_exercises.workout_id and user_id = auth.uid() ) );

-- Sets: Inherit from workout_exercise -> workout
create policy "Sets viewable by user" on public.sets for select using ( exists ( select 1 from public.workout_exercises join public.workouts on public.workout_exercises.workout_id = public.workouts.id where public.workout_exercises.id = sets.workout_exercise_id and public.workouts.user_id = auth.uid() ) );
create policy "Sets insertable by user" on public.sets for insert with check ( exists ( select 1 from public.workout_exercises join public.workouts on public.workout_exercises.workout_id = public.workouts.id where public.workout_exercises.id = sets.workout_exercise_id and public.workouts.user_id = auth.uid() ) );
