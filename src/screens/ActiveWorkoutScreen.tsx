import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, FlatList, Dimensions, TouchableOpacity, Modal, Platform } from 'react-native';
import { Text, Card, Button, ActivityIndicator, Checkbox, TextInput, IconButton, useTheme, Searchbar, List } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Workout, Set, Exercise } from '../types/database';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ExerciseHistory {
    date: string;
    sets: { weight: number; reps: number; rpe: number }[];
}

interface ActiveExercise {
    id: string; // workout_exercise_id
    exercise: Exercise;
    sets: Set[];
    history: ExerciseHistory[];
}

export default function ActiveWorkoutScreen() {
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [exercises, setExercises] = useState<ActiveExercise[]>([]);
    const [loading, setLoading] = useState(true);
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { workoutId, isEditing } = route.params;
    const theme = useTheme();

    const [modalVisible, setModalVisible] = useState(false);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchWorkoutDetails();
        fetchAllExercises();
    }, [workoutId]);

    async function fetchAllExercises() {
        const { data } = await supabase.from('exercises').select('*').order('name');
        if (data) setAllExercises(data);
    }

    async function fetchWorkoutDetails() {
        console.log('Fetching workout details for:', workoutId);
        setLoading(true);
        // 1. Fetch Workout
        const { data: workoutData, error: wError } = await supabase
            .from('workouts')
            .select('*')
            .eq('id', workoutId)
            .single();

        if (wError || !workoutData) {
            console.error('Error fetching workout:', wError);
            if (Platform.OS === 'web') {
                alert('Error: Could not load workout');
            } else {
                Alert.alert('Error', 'Could not load workout');
            }
            navigation.goBack();
            return;
        }
        setWorkout(workoutData);

        // 2. Fetch Exercises & Sets
        const { data: weData, error: weError } = await supabase
            .from('workout_exercises')
            .select(`
        id,
        exercise:exercises(*),
        sets(*)
      `)
            .eq('workout_id', workoutId)
            .order('order');

        if (weError) {
            console.error('Error fetching workout exercises:', weError);
        } else {
            const activeExercises: ActiveExercise[] = [];

            for (const item of weData || []) {
                // 3. Fetch History for each exercise
                const history = await fetchExerciseHistory(item.exercise.id, workoutData.date);

                // Auto-populate weight/reps from target if not already set
                const initializedSets = item.sets.map((s: Set) => ({
                    ...s,
                    weight: s.weight ?? s.target_weight,
                    reps: s.reps ?? s.target_reps,
                })).sort((a: Set, b: Set) => (a.created_at > b.created_at ? 1 : -1));

                activeExercises.push({
                    id: item.id,
                    exercise: item.exercise,
                    sets: initializedSets,
                    history,
                });
            }
            setExercises(activeExercises);
        }
        setLoading(false);
        console.log('Finished loading workout details');
    }

    async function fetchExerciseHistory(exerciseId: string, currentDate: string) {
        // Get last 5 workouts containing this exercise before current date
        const { data, error } = await supabase
            .from('workout_exercises')
            .select(`
        workout:workouts(date),
        sets(weight, reps, rpe)
      `)
            .eq('exercise_id', exerciseId)
            .lt('workout.date', currentDate)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error || !data) return [];

        return data
            .filter((item) => item.workout) // Filter out null workouts if any
            .map((item) => ({
                date: item.workout.date,
                sets: item.sets,
            }));
    }

    async function updateSet(setId: string, field: keyof Set, value: any) {
        // Optimistic update
        const newExercises = [...exercises];
        for (const ex of newExercises) {
            const setIndex = ex.sets.findIndex((s) => s.id === setId);
            if (setIndex !== -1) {
                ex.sets[setIndex] = { ...ex.sets[setIndex], [field]: value };
                setExercises(newExercises);

                // DB Update (debounce in real app, direct here for simplicity)
                if (!setId.startsWith('temp-')) {
                    await supabase.from('sets').update({ [field]: value }).eq('id', setId);
                }
                break;
            }
        }
    }

    async function removeSet(workoutExerciseId: string, setId: string) {
        // Optimistic UI update
        const newExercises = exercises.map(ex => {
            if (ex.id === workoutExerciseId) {
                return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
            }
            return ex;
        });
        setExercises(newExercises);

        // DB Delete
        if (!setId.startsWith('temp-')) {
            const { error } = await supabase.from('sets').delete().eq('id', setId);
            if (error) {
                console.error('Error deleting set:', error);
                // Revert if needed
            }
        }
    }

    async function addSet(workoutExerciseId: string, currentSets: Set[]) {
        const lastSet = currentSets[currentSets.length - 1];
        const newWeight = lastSet ? (lastSet.weight || lastSet.target_weight) : 0;
        const newReps = lastSet ? (lastSet.reps || lastSet.target_reps) : 0;

        // Optimistic UI update
        const tempId = `temp-${Date.now()}`;
        const newSet: Set = {
            id: tempId,
            workout_exercise_id: workoutExerciseId,
            weight: newWeight,
            reps: newReps,
            completed: false,
            created_at: new Date().toISOString(),
        } as any;

        const newExercises = exercises.map(ex => {
            if (ex.id === workoutExerciseId) {
                return { ...ex, sets: [...ex.sets, newSet] };
            }
            return ex;
        });
        setExercises(newExercises);

        // DB Insert
        const { data, error } = await supabase
            .from('sets')
            .insert({
                workout_exercise_id: workoutExerciseId,
                weight: newWeight,
                reps: newReps,
                completed: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding set:', error);
            // Revert optimistic update if needed
        } else if (data) {
            // Update temp ID with real ID
            setExercises(prev => prev.map(ex => {
                if (ex.id === workoutExerciseId) {
                    return {
                        ...ex,
                        sets: ex.sets.map(s => s.id === tempId ? data : s)
                    };
                }
                return ex;
            }));
        }
    }

    async function addExerciseToWorkout(exercise: Exercise) {
        setModalVisible(false);

        const newOrder = exercises.length;

        // Fetch last set stats for auto-populate
        let initialWeight = 0;
        let initialReps = 0;

        // Get the most recent workout for this exercise
        const { data: historyData } = await supabase
            .from('workout_exercises')
            .select(`
                sets(weight, reps)
            `)
            .eq('exercise_id', exercise.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (historyData && historyData.sets && historyData.sets.length > 0) {
            // Use the last set of the most recent workout
            const lastSet = historyData.sets[historyData.sets.length - 1];
            initialWeight = lastSet.weight || 0;
            initialReps = lastSet.reps || 0;
        }

        // DB Insert
        const { data: weData, error: weError } = await supabase
            .from('workout_exercises')
            .insert({
                workout_id: workoutId,
                exercise_id: exercise.id,
                order: newOrder,
            })
            .select()
            .single();

        if (weError || !weData) {
            if (Platform.OS === 'web') {
                alert('Error: Failed to add exercise');
            } else {
                Alert.alert('Error', 'Failed to add exercise');
            }
            return;
        }

        // Add initial set with auto-populated values
        const { data: setData, error: setError } = await supabase
            .from('sets')
            .insert({
                workout_exercise_id: weData.id,
                weight: initialWeight,
                reps: initialReps,
                completed: false,
            })
            .select()
            .single();

        if (setError || !setData) {
            console.error('Error adding initial set', setError);
        }

        // Update local state
        const newActiveExercise: ActiveExercise = {
            id: weData.id,
            exercise: exercise,
            sets: setData ? [setData] : [],
            history: [], // No history fetched yet for this new one, could fetch if needed
        };

        setExercises([...exercises, newActiveExercise]);

        // Fetch history in background
        const history = await fetchExerciseHistory(exercise.id, workout?.date || new Date().toISOString());
        setExercises(prev => prev.map(e => e.id === weData.id ? { ...e, history } : e));
    }

    async function removeExerciseFromWorkout(workoutExerciseId: string) {
        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to remove this exercise from the workout?')) {
                // Optimistic UI
                setExercises(exercises.filter(e => e.id !== workoutExerciseId));

                // DB Delete
                const { error } = await supabase
                    .from('workout_exercises')
                    .delete()
                    .eq('id', workoutExerciseId);

                if (error) {
                    alert('Error: Failed to remove exercise');
                    fetchWorkoutDetails(); // Revert
                }
            }
        } else {
            Alert.alert(
                'Remove Exercise',
                'Are you sure you want to remove this exercise from the workout?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: async () => {
                            // Optimistic UI
                            setExercises(exercises.filter(e => e.id !== workoutExerciseId));

                            // DB Delete
                            const { error } = await supabase
                                .from('workout_exercises')
                                .delete()
                                .eq('id', workoutExerciseId);

                            if (error) {
                                Alert.alert('Error', 'Failed to remove exercise');
                                fetchWorkoutDetails(); // Revert
                            }
                        }
                    }
                ]
            );
        }
    }

    async function completeWorkout() {
        // Check if all sets are completed
        const allCompleted = exercises.every(ex => ex.sets.every(s => s.completed));
        if (!allCompleted && !isEditing) {
            if (Platform.OS === 'web') {
                alert('YOU STILL GOT WORK TO DO: Please complete all sets before finishing the workout.');
            } else {
                Alert.alert('YOU STILL GOT WORK TO DO', 'Please complete all sets before finishing the workout.');
            }
            return;
        }

        if (isEditing) {
            if (Platform.OS === 'web') {
                if (window.confirm('You are editing a past workout. This cannot be undone. Are you sure?')) {
                    setLoading(true);
                    // Ensure status remains completed
                    await supabase
                        .from('workouts')
                        .update({ status: 'completed' })
                        .eq('id', workoutId);
                    setLoading(false);
                    navigation.goBack();
                }
            } else {
                Alert.alert(
                    'Save Changes',
                    'You are editing a past workout. This cannot be undone. Are you sure?',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Save',
                            onPress: async () => {
                                setLoading(true);
                                // Ensure status remains completed
                                await supabase
                                    .from('workouts')
                                    .update({ status: 'completed' })
                                    .eq('id', workoutId);
                                setLoading(false);
                                navigation.goBack();
                            }
                        }
                    ]
                );
            }
        } else {
            setLoading(true);
            await supabase
                .from('workouts')
                .update({ status: 'completed' })
                .eq('id', workoutId);
            setLoading(false);
            navigation.goBack();
        }
    }

    function renderHistoryItem({ item }: { item: ExerciseHistory }) {
        return (
            <Card style={[styles.historyCard, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Card.Content>
                    <Text style={[styles.historyDate, { color: theme.colors.secondary }]}>{format(parseISO(item.date), 'MMM d')}</Text>
                    {item.sets.map((s, i) => (
                        <Text key={i} style={[styles.historyText, { color: theme.colors.onSurfaceVariant }]}>
                            {s.weight}lbs x {s.reps}
                        </Text>
                    ))}
                </Card.Content>
            </Card>
        );
    }

    if (loading) return <ActivityIndicator style={styles.loader} />;

    const isCompleted = workout?.status === 'completed' && !isEditing;

    async function deleteWorkout() {
        const performDelete = async () => {
            setLoading(true);
            // 1. Get all workout_exercises
            const { data: weData, error: weError } = await supabase
                .from('workout_exercises')
                .select('id')
                .eq('workout_id', workoutId);

            if (weError) {
                console.error('Error fetching WE for delete:', weError);
                setLoading(false);
                return;
            }

            const weIds = weData.map(we => we.id);

            if (weIds.length > 0) {
                // 2. Delete sets
                const { error: setsError } = await supabase
                    .from('sets')
                    .delete()
                    .in('workout_exercise_id', weIds);

                if (setsError) console.error('Error deleting sets:', setsError);

                // 3. Delete workout_exercises
                const { error: weDeleteError } = await supabase
                    .from('workout_exercises')
                    .delete()
                    .eq('workout_id', workoutId);

                if (weDeleteError) console.error('Error deleting WE:', weDeleteError);
            }

            // 4. Delete workout
            const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
            if (error) {
                console.error('Error deleting workout:', error);
                if (Platform.OS === 'web') alert(error.message);
                else Alert.alert('Error', error.message);
            } else {
                navigation.goBack();
            }
            setLoading(false);
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this ENTIRE workout? This cannot be undone.')) {
                await performDelete();
            }
        } else {
            Alert.alert(
                'Delete Workout',
                'Are you sure you want to delete this ENTIRE workout? This cannot be undone.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: performDelete }
                ]
            );
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* ... existing content ... */}
                <View>
                    <Text style={[styles.headerTitle, { color: theme.colors.primary, marginBottom: 4 }]}>{workout?.name}</Text>
                    {workout?.date && (
                        <Text style={[styles.headerDate, { color: theme.colors.secondary }]}>
                            {format(parseISO(workout.date), 'EEEE, MMMM do, yyyy')}
                        </Text>
                    )}
                </View>

                {exercises.map((ex, i) => (
                    <Card key={ex.id} style={[styles.exerciseCard, { backgroundColor: theme.colors.surface }]}>
                        {/* ... existing card content ... */}
                        <TouchableOpacity onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: ex.exercise.id, exerciseName: ex.exercise.name })}>
                            <Card.Title
                                title={ex.exercise.name}
                                titleStyle={{ color: theme.colors.onSurface, textDecorationLine: 'underline' }}
                                right={(props) => (
                                    <View style={{ flexDirection: 'row' }}>
                                        <IconButton {...props} icon="chevron-right" iconColor={theme.colors.onSurfaceVariant} />
                                        {!isCompleted && (
                                            <IconButton {...props} icon="close" iconColor={theme.colors.error} onPress={() => removeExerciseFromWorkout(ex.id)} />
                                        )}
                                    </View>
                                )}
                            />
                        </TouchableOpacity>

                        {/* History Carousel */}
                        {ex.history.length > 0 && (
                            <View style={styles.historyContainer}>
                                <Text style={[styles.historyLabel, { color: theme.colors.onSurfaceVariant }]}>History</Text>
                                <FlatList
                                    horizontal
                                    data={ex.history}
                                    renderItem={renderHistoryItem}
                                    keyExtractor={(item, index) => index.toString()}
                                    showsHorizontalScrollIndicator={false}
                                />
                            </View>
                        )}

                        <Card.Content>
                            <View style={styles.setHeader}>
                                <Text style={[styles.col, styles.colSet, { color: theme.colors.onSurface }]}>Set</Text>
                                <Text style={[styles.col, styles.colInput, { color: theme.colors.onSurface }]}>lbs</Text>
                                <Text style={[styles.col, styles.colInput, { color: theme.colors.onSurface }]}>Reps</Text>
                                <Text style={[styles.col, styles.colCheck, { color: theme.colors.onSurface }]}>✓</Text>
                                <View style={{ width: 30 }} />
                            </View>

                            {ex.sets.map((set, index) => (
                                <View key={set.id} style={[styles.setRow, set.completed && styles.completedRow]}>
                                    <Text style={[styles.col, styles.colSet, { color: theme.colors.onSurface }]}>{index + 1}</Text>
                                    <TextInput
                                        style={[styles.input, styles.colInput, { backgroundColor: theme.colors.surface }]}
                                        value={set.weight?.toString() || ''}
                                        onChangeText={(v) => updateSet(set.id, 'weight', parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                        dense
                                        textColor={theme.colors.onSurface}
                                        editable={!isCompleted}
                                    />
                                    <TextInput
                                        style={[styles.input, styles.colInput, { backgroundColor: theme.colors.surface }]}
                                        value={set.reps?.toString() || ''}
                                        onChangeText={(v) => updateSet(set.id, 'reps', parseFloat(v) || 0)}
                                        keyboardType="numeric"
                                        dense
                                        textColor={theme.colors.onSurface}
                                        editable={!isCompleted}
                                    />
                                    <View style={[styles.col, styles.colCheck]}>
                                        <Checkbox
                                            status={set.completed ? 'checked' : 'unchecked'}
                                            onPress={() => !isCompleted && updateSet(set.id, 'completed', !set.completed)}
                                            color={theme.colors.primary}
                                            disabled={isCompleted}
                                        />
                                    </View>
                                    {!isCompleted && (
                                        <IconButton
                                            icon="trash-can-outline"
                                            size={20}
                                            iconColor={theme.colors.error}
                                            onPress={() => removeSet(ex.id, set.id)}
                                            style={{ margin: 0, width: 30 }}
                                        />
                                    )}
                                </View>
                            ))}

                            {!isCompleted && (
                                <Button
                                    mode="outlined"
                                    onPress={() => addSet(ex.id, ex.sets)}
                                    style={{ marginTop: 8, borderColor: theme.colors.outline }}
                                    textColor={theme.colors.primary}
                                >
                                    + Add Set
                                </Button>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </ScrollView>

            {!isCompleted && (
                <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
                    <Button mode="outlined" onPress={() => setModalVisible(true)} style={[styles.addButton, { borderColor: theme.colors.primary, marginBottom: 10 }]} textColor={theme.colors.primary}>
                        Add Exercise
                    </Button>
                    {isEditing && (
                        <Button
                            mode="outlined"
                            onPress={deleteWorkout}
                            style={[styles.addButton, { borderColor: theme.colors.error, marginBottom: 10 }]}
                            textColor={theme.colors.error}
                        >
                            Delete Workout
                        </Button>
                    )}
                    <Button mode="contained" onPress={completeWorkout} contentStyle={{ height: 50 }}>
                        {isEditing ? 'Save Changes' : 'Finish Workout'}
                    </Button>
                </View>
            )}


            <Modal visible={modalVisible} animationType="slide">
                <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    <Searchbar
                        placeholder="Search exercises"
                        onChangeText={setSearchQuery}
                        value={searchQuery}
                        style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                        inputStyle={{ color: theme.colors.onSurface }}
                        iconColor={theme.colors.onSurface}
                        placeholderTextColor={theme.colors.onSurfaceVariant}
                    />
                    <FlatList
                        data={allExercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.name}
                                titleStyle={{ color: theme.colors.onSurface }}
                                onPress={() => addExerciseToWorkout(item)}
                                right={(props) => <List.Icon {...props} icon="plus" color={theme.colors.secondary} />}
                            />
                        )}
                    />
                    <Button onPress={() => setModalVisible(false)} style={{ margin: 20 }} textColor={theme.colors.error}>
                        Cancel
                    </Button>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 100,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    headerDate: {
        fontSize: 14,
        marginBottom: 16,
    },
    exerciseCard: {
        marginBottom: 20,
    },
    historyContainer: {
        marginBottom: 10,
        paddingLeft: 16,
    },
    historyLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    historyCard: {
        marginRight: 8,
        width: 100,
    },
    historyDate: {
        fontSize: 10,
        fontWeight: 'bold',
        marginBottom: 2,
    },
    historyText: {
        fontSize: 10,
    },
    setHeader: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    setRow: {
        flexDirection: 'row',
        marginBottom: 8,
        alignItems: 'center',
    },
    completedRow: {
        opacity: 0.5,
    },
    col: {
        textAlign: 'center',
    },
    colSet: { width: 30 },
    colTarget: { flex: 1, fontSize: 12 },
    colInput: { flex: 1, marginHorizontal: 2 },
    colCheck: { width: 40, alignItems: 'center' },
    input: {
        height: 40,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        borderTopWidth: 1,
    },
    modalContainer: {
        flex: 1,
        paddingTop: 50,
    },
    searchBar: {
        margin: 16,
    },
    addButton: {
        marginBottom: 10,
    },
});
