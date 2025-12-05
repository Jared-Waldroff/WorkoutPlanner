-- 1. SCHEMA FIXES
-- Add status to workouts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workouts' AND column_name = 'status') THEN
        ALTER TABLE public.workouts ADD COLUMN status text CHECK (status IN ('scheduled', 'completed', 'skipped')) DEFAULT 'scheduled';
    END IF;
END $$;

-- Add target fields to sets if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sets' AND column_name = 'target_weight') THEN
        ALTER TABLE public.sets ADD COLUMN target_weight numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sets' AND column_name = 'target_reps') THEN
        ALTER TABLE public.sets ADD COLUMN target_reps integer;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sets' AND column_name = 'target_rpe') THEN
        ALTER TABLE public.sets ADD COLUMN target_rpe numeric;
    END IF;
END $$;

-- 2. SAMPLE DATA INSERTION
-- Insert Exercises (IDs starting with e0...)
INSERT INTO public.exercises (id, name, muscle_group, equipment) VALUES
('e0000000-0000-0000-0000-000000000001', 'Deadlift', 'Back', 'Barbell'),
('e0000000-0000-0000-0000-000000000002', 'Pull Up', 'Back', 'Bodyweight'),
('e0000000-0000-0000-0000-000000000003', 'Barbell Row', 'Back', 'Barbell'),
('e0000000-0000-0000-0000-000000000004', 'Bench Press', 'Chest', 'Barbell'),
('e0000000-0000-0000-0000-000000000005', 'Incline Dumbbell Press', 'Chest', 'Dumbbell'),
('e0000000-0000-0000-0000-000000000006', 'Chest Fly', 'Chest', 'Cable'),
('e0000000-0000-0000-0000-000000000007', 'Squat', 'Legs', 'Barbell'),
('e0000000-0000-0000-0000-000000000008', 'Leg Press', 'Legs', 'Machine'),
('e0000000-0000-0000-0000-000000000009', 'Calf Raise', 'Legs', 'Machine')
ON CONFLICT (id) DO NOTHING;

-- Insert Workouts (IDs starting with a0...)
-- Uses the most recently created user ID to avoid null auth.uid()
INSERT INTO public.workouts (id, user_id, name, date, status) VALUES
('a0000000-0000-0000-0000-000000000001', (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1), 'Pull Day (Back)', now(), 'scheduled'),
('a0000000-0000-0000-0000-000000000002', (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1), 'Push Day (Chest)', now() + interval '1 day', 'scheduled'),
('a0000000-0000-0000-0000-000000000003', (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1), 'Leg Day', now() + interval '2 days', 'scheduled')
ON CONFLICT (id) DO NOTHING;


-- Link Exercises to Workouts (IDs starting with b0...)
-- Pull Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 1), -- Deadlift
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 2), -- Pull Up
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003', 3) -- Row
ON CONFLICT (id) DO NOTHING;

-- Push Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000004', 1), -- Bench
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000005', 2), -- Incline
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000006', 3) -- Fly
ON CONFLICT (id) DO NOTHING;

-- Leg Day
INSERT INTO public.workout_exercises (id, workout_id, exercise_id, "order") VALUES
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000007', 1), -- Squat
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000008', 2), -- Leg Press
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000009', 3) -- Calf Raise
ON CONFLICT (id) DO NOTHING;


-- Add Sets (Targets)
-- Pull Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('b0000000-0000-0000-0000-000000000001', 225, 5, false), -- Deadlift
('b0000000-0000-0000-0000-000000000001', 225, 5, false),
('b0000000-0000-0000-0000-000000000001', 225, 5, false),
('b0000000-0000-0000-0000-000000000002', 0, 10, false), -- Pull Up
('b0000000-0000-0000-0000-000000000002', 0, 10, false),
('b0000000-0000-0000-0000-000000000003', 135, 12, false), -- Row
('b0000000-0000-0000-0000-000000000003', 135, 12, false);

-- Push Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('b0000000-0000-0000-0000-000000000004', 185, 8, false), -- Bench
('b0000000-0000-0000-0000-000000000004', 185, 8, false),
('b0000000-0000-0000-0000-000000000004', 185, 8, false),
('b0000000-0000-0000-0000-000000000005', 60, 10, false), -- Incline
('b0000000-0000-0000-0000-000000000005', 60, 10, false);

-- Leg Day Sets
INSERT INTO public.sets (workout_exercise_id, target_weight, target_reps, completed) VALUES
('b0000000-0000-0000-0000-000000000007', 275, 5, false), -- Squat
('b0000000-0000-0000-0000-000000000007', 275, 5, false),
('b0000000-0000-0000-0000-000000000007', 275, 5, false),
('b0000000-0000-0000-0000-000000000008', 400, 12, false), -- Leg Press
('b0000000-0000-0000-0000-000000000008', 400, 12, false);
