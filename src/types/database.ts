export interface Exercise {
    id: string;
    name: string;
    muscle_group: string | null;
    equipment: string | null;
    user_id: string | null;
    created_at: string;
}

export interface Workout {
    id: string;
    user_id: string;
    name: string | null;
    date: string;
    notes: string | null;
    status: 'scheduled' | 'completed' | 'skipped';
    created_at: string;
}

export interface Set {
    id: string;
    workout_exercise_id: string;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    target_weight: number | null;
    target_reps: number | null;
    target_rpe: number | null;
    completed: boolean;
    created_at: string;
}
