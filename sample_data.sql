-- Insert Exercises
INSERT INTO public.exercises (id, name, muscle_group, equipment) VALUES
('e1000000-0000-0000-0000-000000000001', 'Deadlift', 'Back', 'Barbell'),
('e1000000-0000-0000-0000-000000000002', 'Pull Up', 'Back', 'Bodyweight'),
('e1000000-0000-0000-0000-000000000003', 'Barbell Row', 'Back', 'Barbell'),
('e1000000-0000-0000-0000-000000000004', 'Bench Press', 'Chest', 'Barbell'),
('e1000000-0000-0000-0000-000000000005', 'Incline Dumbbell Press', 'Chest', 'Dumbbell'),
('e1000000-0000-0000-0000-000000000006', 'Chest Fly', 'Chest', 'Cable'),
('e1000000-0000-0000-0000-000000000007', 'Squat', 'Legs', 'Barbell'),
('e1000000-0000-0000-0000-000000000008', 'Leg Press', 'Legs', 'Machine'),
('e1000000-0000-0000-0000-000000000009', 'Calf Raise', 'Legs', 'Machine')
ON CONFLICT (id) DO NOTHING;

-- Insert Workouts (Dynamic Dates: Today, Tomorrow, Day After)
-- NOTE: You need to replace 'YOUR_USER_ID' with your actual Supabase User ID
-- We will use a placeholder and ask the user to replace it or we can try to fetch it if we were running this via code, but SQL is safer.

-- Workout 1: Pull Day (Today)
INSERT INTO public.workouts (id, user_id, name, date, status) VALUES
('w1000000-0000-0000-0000-000000000001', auth.uid(), 'Pull Day (Back)', now(), 'scheduled');

-- Workout 2: Push Day (Tomorrow)
INSERT INTO public.workouts (id, user_id, name, date, status) VALUES
('w1000000-0000-0000-0000-000000000002', auth.uid(), 'Push Day (Chest)', now() + interval '1 day', 'scheduled');

-- Workout 3: Leg Day (Day After)
INSERT INTO public.workouts (id, user_id, name, date, status) VALUES
('w1000000-0000-0000-0000-000000000003', auth.uid(), 'Leg Day', now() + interval '2 days', 'scheduled');


-- Link Exercises to Workouts
-- Pull Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('we100000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 1), -- Deadlift
('we100000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000002', 2), -- Pull Up
('we100000-0000-0000-0000-000000000003', 'w1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000003', 3); -- Row

-- Push Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('we200000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000004', 1), -- Bench
('we200000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000005', 2), -- Incline
('we200000-0000-0000-0000-000000000003', 'w1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000006', 3); -- Fly

-- Leg Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('we300000-0000-0000-0000-000000000001', 'w1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000007', 1), -- Squat
('we300000-0000-0000-0000-000000000002', 'w1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000008', 2), -- Leg Press
('we300000-0000-0000-0000-000000000003', 'w1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000009', 3); -- Calf Raise


-- Add Sets (Targets)
-- Pull Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('we100000-0000-0000-0000-000000000001', 225, 5, false), -- Deadlift
('we100000-0000-0000-0000-000000000001', 225, 5, false),
('we100000-0000-0000-0000-000000000001', 225, 5, false),
('we100000-0000-0000-0000-000000000002', 0, 10, false), -- Pull Up
('we100000-0000-0000-0000-000000000002', 0, 10, false),
('we100000-0000-0000-0000-000000000003', 135, 12, false), -- Row
('we100000-0000-0000-0000-000000000003', 135, 12, false);

-- Push Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('we200000-0000-0000-0000-000000000001', 185, 8, false), -- Bench
('we200000-0000-0000-0000-000000000001', 185, 8, false),
('we200000-0000-0000-0000-000000000001', 185, 8, false),
('we200000-0000-0000-0000-000000000002', 60, 10, false), -- Incline
('we200000-0000-0000-0000-000000000002', 60, 10, false);

-- Leg Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('we300000-0000-0000-0000-000000000001', 275, 5, false), -- Squat
('we300000-0000-0000-0000-000000000001', 275, 5, false),
('we300000-0000-0000-0000-000000000001', 275, 5, false),
('we300000-0000-0000-0000-000000000002', 400, 12, false), -- Leg Press
('we300000-0000-0000-0000-000000000002', 400, 12, false);
