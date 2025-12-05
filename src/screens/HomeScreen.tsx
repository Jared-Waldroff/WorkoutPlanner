import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SectionList, Alert, Platform } from 'react-native';
import { Text, Card, Button, ActivityIndicator, useTheme, Divider, FAB, IconButton } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Workout } from '../types/database';
import { useNavigation } from '@react-navigation/native';
import { format, isToday, isTomorrow, parseISO, compareAsc } from 'date-fns';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function HomeScreen() {
    const [sections, setSections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();
    const theme = useTheme();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchWorkouts();
        });
        return unsubscribe;
    }, [navigation]);

    async function fetchWorkouts() {
        setLoading(true);
        const { data, error } = await supabase
            .from('workouts')
            .select(`
        *,
        workout_exercises (
          id,
          order,
          exercise:exercises (name),
          sets (target_weight, target_reps)
        )
      `)
            .order('date', { ascending: true });

        if (error) {
            console.error(error);
        } else {
            const workouts = data || [];
            // Sort workout_exercises by order
            workouts.forEach((w: any) => {
                if (w.workout_exercises) {
                    w.workout_exercises.sort((a: any, b: any) => a.order - b.order);
                }
            });
            const grouped = groupWorkouts(workouts);
            setSections(grouped);
        }
        setLoading(false);
    }

    function groupWorkouts(workouts: Workout[]) {
        const today: Workout[] = [];
        const tomorrow: Workout[] = [];
        const upcoming: Workout[] = [];
        const history: Workout[] = [];

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        workouts.forEach((workout) => {
            const date = parseISO(workout.date);
            if (workout.status === 'completed') {
                history.push(workout);
            } else if (isToday(date)) {
                today.push(workout);
            } else if (isTomorrow(date)) {
                tomorrow.push(workout);
            } else if (compareAsc(date, now) > 0) {
                upcoming.push(workout);
            } else {
                // Missed/Past scheduled workouts
                today.push(workout);
            }
        });

        const sections = [];
        if (today.length > 0) sections.push({ title: 'Today', data: today });
        if (tomorrow.length > 0) sections.push({ title: 'Tomorrow', data: tomorrow });
        if (upcoming.length > 0) sections.push({ title: 'Upcoming', data: upcoming });

        return sections;
    }

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

    function confirmDeleteWorkout(workoutId: string) {
        setWorkoutToDelete(workoutId);
        setDeleteDialogVisible(true);
    }

    async function handleDeleteConfirm() {
        if (!workoutToDelete) return;

        const workoutId = workoutToDelete;
        setDeleteDialogVisible(false); // Close immediately for better UX
        setLoading(true);

        // 1. Get all workout_exercises
        const { data: weData, error: weError } = await supabase
            .from('workout_exercises')
            .select('id')
            .eq('workout_id', workoutId);

        if (weError) {
            console.error('Error fetching workout details:', weError);
            Alert.alert('Error', 'Failed to fetch workout details for deletion');
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

            if (setsError) {
                console.error('Error deleting sets:', setsError);
                Alert.alert('Error', 'Failed to delete associated sets');
                setLoading(false);
                return;
            }

            // 3. Delete workout_exercises
            const { error: weDeleteError } = await supabase
                .from('workout_exercises')
                .delete()
                .eq('workout_id', workoutId);

            if (weDeleteError) {
                console.error('Error deleting workout exercises:', weDeleteError);
                Alert.alert('Error', 'Failed to delete workout exercises');
                setLoading(false);
                return;
            }
        }

        // 4. Delete workout
        const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
        if (error) {
            console.error('Error deleting workout:', error);
            Alert.alert('Error', error.message);
        } else {
            fetchWorkouts();
        }
        setLoading(false);
        setWorkoutToDelete(null);
    }

    function renderWorkoutItem({ item }: { item: any }) {
        return (
            <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} onPress={() => navigation.navigate('ActiveWorkout', { workoutId: item.id })}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.workoutTitle, { color: theme.colors.onSurface }]}>{item.name || 'Untitled Workout'}</Text>
                            <Text style={[styles.workoutDate, { color: theme.colors.onSurfaceVariant }]}>{format(parseISO(item.date), 'EEEE, MMM do')}</Text>
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            <IconButton icon="pencil" size={20} onPress={() => navigation.navigate('LogWorkout', { workoutId: item.id })} />
                            <IconButton
                                icon="delete"
                                iconColor={theme.colors.error}
                                size={20}
                                onPress={(e) => {
                                    e?.stopPropagation?.();
                                    confirmDeleteWorkout(item.id);
                                }}
                            />
                        </View>
                    </View>

                    <Button mode="contained" compact onPress={() => navigation.navigate('ActiveWorkout', { workoutId: item.id })} style={{ marginBottom: 12 }}>
                        Start Workout
                    </Button>

                    <Divider style={styles.divider} />

                    <View style={styles.exerciseList}>
                        {item.workout_exercises?.map((we: any, index: number) => {
                            // Get max target weight to show
                            const maxWeight = we.sets?.reduce((max: number, s: any) => Math.max(max, s.target_weight || 0), 0);
                            return (
                                <View key={we.id} style={styles.exerciseRow}>
                                    <Text style={[styles.exerciseName, { color: theme.colors.onSurface }]}>
                                        {index + 1}. {we.exercise?.name}
                                    </Text>
                                    {maxWeight > 0 && (
                                        <Text style={[styles.exerciseTarget, { color: theme.colors.secondary }]}>
                                            {maxWeight} lbs
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                        {(!item.workout_exercises || item.workout_exercises.length === 0) && (
                            <Text style={{ color: theme.colors.onSurfaceVariant, fontStyle: 'italic' }}>No exercises added yet.</Text>
                        )}
                    </View>
                </Card.Content>
            </Card>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : sections.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No upcoming workouts scheduled.</Text>
                    <Button mode="contained" onPress={() => navigation.navigate('LogWorkout')}>
                        Create Workout Plan
                    </Button>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWorkoutItem}
                    renderSectionHeader={({ section: { title } }) => (
                        <Text style={[styles.sectionHeader, { color: theme.colors.onSurfaceVariant }]}>{title.toUpperCase()}</Text>
                    )}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
                />
            )}

            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color="white"
                label="Create Workout"
                onPress={() => navigation.navigate('LogWorkout')}
            />

            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="Delete Workout"
                message="Are you sure you want to delete this workout plan? This action cannot be undone."
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteDialogVisible(false)}
                confirmLabel="Delete"
                isDestructive
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        marginTop: 20,
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 8,
        marginBottom: 8,
        marginLeft: 4,
        letterSpacing: 0.5,
    },
    card: {
        marginBottom: 12,
        borderRadius: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    workoutTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    workoutDate: {
        fontSize: 14,
        marginTop: 2,
    },
    divider: {
        marginBottom: 12,
    },
    exerciseList: {
        gap: 8,
    },
    exerciseRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    exerciseName: {
        fontSize: 15,
        flex: 1,
    },
    exerciseTarget: {
        fontSize: 14,
        fontWeight: '600',
    },
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
        borderRadius: 30,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginBottom: 20,
        fontSize: 16,
    }
});
