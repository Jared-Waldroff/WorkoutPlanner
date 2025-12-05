-- Seed Data: 1 Month of History (3 workouts/week)
-- Assumes 'Pull Day', 'Push Day', 'Leg Day' exist or will be created if not.
-- Adjusts weights to show progress.

-- 1. Get User ID (assuming single user for simplicity, or use the first one found)
DO $$
DECLARE
    v_user_id UUID;
    v_pull_workout_id UUID;
    v_push_workout_id UUID;
    v_leg_workout_id UUID;
    v_date DATE;
    v_base_weight INT;
BEGIN
    -- Get a user ID (replace with specific ID if known, otherwise picks first)
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;

    -- If no user, just exit (or handle error)
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found to seed data for.';
        RETURN;
    END IF;

    -- Loop back 4 weeks
    FOR i IN 1..4 LOOP
        -- Calculate base date for this week (going backwards)
        v_date := CURRENT_DATE - (i * 7);
        
        -- PULL DAY (Monday-ish)
        INSERT INTO workouts (user_id, name, date, status)
        VALUES (v_user_id, 'Pull Day', v_date, 'completed')
        RETURNING id INTO v_pull_workout_id;

        -- Deadlift (Progressive Overload: +5lbs each week)
        v_base_weight := 225 + ((4-i) * 5); 
        INSERT INTO workout_exercises (workout_id, exercise_id, "order")
        SELECT v_pull_workout_id, id, 1 FROM exercises WHERE name = 'Deadlift';
        
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Deadlift');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Deadlift');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Deadlift');

        -- Pull Up
        INSERT INTO workout_exercises (workout_id, exercise_id, "order")
        SELECT v_pull_workout_id, id, 2 FROM exercises WHERE name = 'Pull Up';
        
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, 0, 10, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Pull Up');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, 0, 9, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Pull Up');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, 0, 8, true FROM workout_exercises WHERE workout_id = v_pull_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Pull Up');


        -- PUSH DAY (Wednesday-ish)
        INSERT INTO workouts (user_id, name, date, status)
        VALUES (v_user_id, 'Push Day', v_date + 2, 'completed')
        RETURNING id INTO v_push_workout_id;

        -- Bench Press (Progressive Overload: +5lbs each week)
        v_base_weight := 135 + ((4-i) * 5);
        INSERT INTO workout_exercises (workout_id, exercise_id, "order")
        SELECT v_push_workout_id, id, 1 FROM exercises WHERE name = 'Bench Press';

        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 8, true FROM workout_exercises WHERE workout_id = v_push_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Bench Press');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 8, true FROM workout_exercises WHERE workout_id = v_push_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Bench Press');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 8, true FROM workout_exercises WHERE workout_id = v_push_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Bench Press');

        -- Overhead Press
        v_base_weight := 95 + ((4-i) * 2.5);
        INSERT INTO workout_exercises (workout_id, exercise_id, "order")
        SELECT v_push_workout_id, id, 2 FROM exercises WHERE name = 'Overhead Press';

        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 10, true FROM workout_exercises WHERE workout_id = v_push_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Overhead Press');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 10, true FROM workout_exercises WHERE workout_id = v_push_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Overhead Press');


        -- LEG DAY (Friday-ish)
        INSERT INTO workouts (user_id, name, date, status)
        VALUES (v_user_id, 'Leg Day', v_date + 4, 'completed')
        RETURNING id INTO v_leg_workout_id;

        -- Squat (Progressive Overload: +10lbs each week)
        v_base_weight := 185 + ((4-i) * 10);
        INSERT INTO workout_exercises (workout_id, exercise_id, "order")
        SELECT v_leg_workout_id, id, 1 FROM exercises WHERE name = 'Squat';

        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_leg_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Squat');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_leg_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Squat');
        INSERT INTO sets (workout_exercise_id, weight, reps, completed)
        SELECT id, v_base_weight, 5, true FROM workout_exercises WHERE workout_id = v_leg_workout_id AND exercise_id = (SELECT id FROM exercises WHERE name = 'Squat');

    END LOOP;
END $$;
