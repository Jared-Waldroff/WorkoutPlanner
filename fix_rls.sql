-- Add missing RLS policies for Deleting and Updating

-- Workout Exercises
create policy "Workout Exercises updatable by user" on public.workout_exercises for update using ( exists ( select 1 from public.workouts where id = workout_exercises.workout_id and user_id = auth.uid() ) );

create policy "Workout Exercises deletable by user" on public.workout_exercises for delete using ( exists ( select 1 from public.workouts where id = workout_exercises.workout_id and user_id = auth.uid() ) );

-- Sets
create policy "Sets updatable by user" on public.sets for update using ( exists ( select 1 from public.workout_exercises join public.workouts on public.workout_exercises.workout_id = public.workouts.id where public.workout_exercises.id = sets.workout_exercise_id and public.workouts.user_id = auth.uid() ) );

create policy "Sets deletable by user" on public.sets for delete using ( exists ( select 1 from public.workout_exercises join public.workouts on public.workout_exercises.workout_id = public.workouts.id where public.workout_exercises.id = sets.workout_exercise_id and public.workouts.user_id = auth.uid() ) );
