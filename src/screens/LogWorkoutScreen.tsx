import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Modal, FlatList, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Card, IconButton, Portal, Dialog, List, Searchbar, useTheme } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Exercise } from '../types/database';
import { useNavigation, useRoute } from '@react-navigation/native';

interface WorkoutSet {
    weight: string;
    reps: string;
}

interface WorkoutExercise {
    exerciseId: string;
    name: string;
    sets: WorkoutSet[];
}

export default function LogWorkoutScreen() {
    const [workoutName, setWorkoutName] = useState('');
    const [workoutExercises, setWorkoutExercises] = useState<WorkoutExercise[]>([]);
    const [loading, setLoading] = useState(false);

    // Exercise Selection Modal State
    const [modalVisible, setModalVisible] = useState(false);
    const [allExercises, setAllExercises] = useState<Exercise[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const navigation = useNavigation();
    const route = useRoute<any>();
    const theme = useTheme();
    const { workoutId } = route.params || {};

    useEffect(() => {
        fetchExercises();
        if (workoutId) {
            fetchWorkoutDetails();
        }
    }, [workoutId]);

    async function fetchExercises() {
        const { data } = await supabase.from('exercises').select('*').order('name');
        if (data) setAllExercises(data);
    }

    async function fetchWorkoutDetails() {
        setLoading(true);
        const { data, error } = await supabase
            .from('workouts')
            .select(`
                name,
                workout_exercises (
                    exercise_id,
                    order,
                    exercise:exercises (name),
                    sets (weight, reps)
                )
            `)
            .eq('id', workoutId)
            .single();

        if (error) {
            Alert.alert('Error', 'Failed to load workout details');
            navigation.goBack();
            return;
        }

        if (data) {
            setWorkoutName(data.name);
            const exercises = (data.workout_exercises || [])
                .sort((a: any, b: any) => a.order - b.order)
                .map((we: any) => ({
                    exerciseId: we.exercise_id,
                    name: we.exercise.name,
                    sets: we.sets.map((s: any) => ({
                        weight: s.weight?.toString() || '',
                        reps: s.reps?.toString() || '',
                    })),
                }));
            setWorkoutExercises(exercises);
        }
        setLoading(false);
    }

    function addExercise(exercise: Exercise) {
        setWorkoutExercises([
            ...workoutExercises,
            { exerciseId: exercise.id, name: exercise.name, sets: [{ weight: '', reps: '' }] },
        ]);
        setModalVisible(false);
    }

    function addSet(exerciseIndex: number) {
        const newExercises = [...workoutExercises];
        const currentSets = newExercises[exerciseIndex].sets;
        const lastSet = currentSets[currentSets.length - 1];

        const newWeight = lastSet ? lastSet.weight : '';
        const newReps = lastSet ? lastSet.reps : '';

        newExercises[exerciseIndex].sets.push({ weight: newWeight, reps: newReps });
        setWorkoutExercises(newExercises);
    }

    function updateSet(exerciseIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) {
        const newExercises = [...workoutExercises];
        newExercises[exerciseIndex].sets[setIndex][field] = value;
        setWorkoutExercises(newExercises);
    }

    function removeSet(exerciseIndex: number, setIndex: number) {
        const newExercises = [...workoutExercises];
        newExercises[exerciseIndex].sets.splice(setIndex, 1);
        setWorkoutExercises(newExercises);
    }

    function removeExercise(index: number) {
        const newExercises = [...workoutExercises];
        newExercises.splice(index, 1);
        setWorkoutExercises(newExercises);
    }

    function moveExercise(index: number, direction: 'up' | 'down') {
        const newExercises = [...workoutExercises];
        if (direction === 'up' && index > 0) {
            [newExercises[index], newExercises[index - 1]] = [newExercises[index - 1], newExercises[index]];
        } else if (direction === 'down' && index < newExercises.length - 1) {
            [newExercises[index], newExercises[index + 1]] = [newExercises[index + 1], newExercises[index]];
        }
        setWorkoutExercises(newExercises);
    }

    async function saveWorkout() {
        if (workoutExercises.length === 0) {
            Alert.alert('Error', 'Add at least one exercise');
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let currentWorkoutId = workoutId;

        if (currentWorkoutId) {
            // Update existing workout
            const { error: updateError } = await supabase
                .from('workouts')
                .update({ name: workoutName || 'Untitled Workout' })
                .eq('id', currentWorkoutId);

            if (updateError) {
                Alert.alert('Error', updateError.message);
                setLoading(false);
                return;
            }

            // Delete existing exercises (and sets via cascade) to replace them
            await supabase.from('workout_exercises').delete().eq('workout_id', currentWorkoutId);
        } else {
            // Create new workout
            const { data: workoutData, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    name: workoutName || 'Untitled Workout',
                    date: new Date().toISOString(),
                })
                .select()
                .single();

            if (workoutError || !workoutData) {
                Alert.alert('Error', workoutError?.message || 'Failed to create workout');
                setLoading(false);
                return;
            }
            currentWorkoutId = workoutData.id;
        }

        // Create Workout Exercises and Sets
        for (let i = 0; i < workoutExercises.length; i++) {
            const we = workoutExercises[i];
            const { data: weData, error: weError } = await supabase
                .from('workout_exercises')
                .insert({
                    workout_id: currentWorkoutId,
                    exercise_id: we.exerciseId,
                    order: i,
                })
                .select()
                .single();

            if (weError || !weData) continue;

            const setsToInsert = we.sets.map((s) => ({
                workout_exercise_id: weData.id,
                weight: parseFloat(s.weight) || 0,
                reps: parseInt(s.reps) || 0,
                // rpe removed
                completed: true,
            }));

            await supabase.from('sets').insert(setsToInsert);
        }

        setLoading(false);
        navigation.goBack();
    }

    const filteredExercises = allExercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <TextInput
                    label="Workout Name (Optional)"
                    value={workoutName}
                    onChangeText={setWorkoutName}
                    style={[styles.input, { backgroundColor: theme.colors.surface }]}
                    textColor={theme.colors.onSurface}
                    theme={{ colors: { onSurfaceVariant: theme.colors.onSurfaceVariant } }}
                />

                {workoutExercises.map((we, exIndex) => (
                    <Card key={exIndex} style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                        <Card.Title
                            title={we.name}
                            titleStyle={{ color: theme.colors.onSurface }}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton {...props} icon="arrow-up" disabled={exIndex === 0} onPress={() => moveExercise(exIndex, 'up')} />
                                    <IconButton {...props} icon="arrow-down" disabled={exIndex === workoutExercises.length - 1} onPress={() => moveExercise(exIndex, 'down')} />
                                    <IconButton {...props} icon="close" iconColor={theme.colors.error} onPress={() => removeExercise(exIndex)} />
                                </View>
                            )}
                        />
                        <Card.Content>
                            {we.sets.map((set, setIndex) => (
                                <View key={setIndex} style={styles.setRow}>
                                    <Text style={[styles.setLabel, { color: theme.colors.onSurface }]}>{setIndex + 1}</Text>
                                    <TextInput
                                        placeholder="lbs"
                                        placeholderTextColor={theme.colors.onSurfaceVariant}
                                        value={set.weight}
                                        onChangeText={(v) => updateSet(exIndex, setIndex, 'weight', v)}
                                        keyboardType="numeric"
                                        style={[styles.setInput, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
                                        textColor={theme.colors.onSurface}
                                        dense
                                    />
                                    <TextInput
                                        placeholder="Reps"
                                        placeholderTextColor={theme.colors.onSurfaceVariant}
                                        value={set.reps}
                                        onChangeText={(v) => updateSet(exIndex, setIndex, 'reps', v)}
                                        keyboardType="numeric"
                                        style={[styles.setInput, { backgroundColor: theme.colors.surface, color: theme.colors.onSurface }]}
                                        textColor={theme.colors.onSurface}
                                        dense
                                    />
                                    <IconButton icon="delete-outline" iconColor={theme.colors.error} size={20} onPress={() => removeSet(exIndex, setIndex)} />
                                </View>
                            ))}
                            <Button onPress={() => addSet(exIndex)} textColor={theme.colors.secondary}>Add Set</Button>
                        </Card.Content>
                    </Card>
                ))}

                <Button mode="outlined" onPress={() => setModalVisible(true)} style={[styles.addButton, { borderColor: theme.colors.primary }]} textColor={theme.colors.primary}>
                    Add Exercise
                </Button>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.outline }]}>
                <Button mode="contained" onPress={saveWorkout} loading={loading}>
                    {workoutId ? 'Update Workout' : 'Create Workout'}
                </Button>
            </View>

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
                        data={filteredExercises}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <List.Item
                                title={item.name}
                                titleStyle={{ color: theme.colors.onSurface }}
                                onPress={() => addExercise(item)}
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
    scrollContent: {
        padding: 16,
        paddingBottom: 80,
    },
    input: {
        marginBottom: 16,
    },
    card: {
        marginBottom: 16,
    },
    setRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    setLabel: {
        width: 20,
        fontWeight: 'bold',
    },
    setInput: {
        flex: 1,
        marginHorizontal: 4,
        height: 40,
    },
    addButton: {
        marginTop: 8,
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
});
