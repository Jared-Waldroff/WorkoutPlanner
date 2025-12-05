import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert, Platform } from 'react-native';
import { List, ActivityIndicator, Text, IconButton, useTheme } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Workout } from '../types/database';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import ConfirmationDialog from '../components/ConfirmationDialog';

export default function WorkoutsScreen() {
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation<any>();

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
            .select('*')
            .eq('status', 'completed')
            .order('date', { ascending: false });

        if (error) {
            console.error(error);
        } else {
            setWorkouts(data || []);
        }
        setLoading(false);
    }

    const theme = useTheme();

    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);

    function confirmDeleteWorkout(workoutId: string) {
        setWorkoutToDelete(workoutId);
        setDeleteDialogVisible(true);
    }

    async function handleDeleteConfirm() {
        if (!workoutToDelete) return;

        const workoutId = workoutToDelete;
        setDeleteDialogVisible(false);
        setLoading(true);

        // 1. Get all workout_exercises to delete their sets
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

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : workouts.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text>No workouts logged yet.</Text>
                </View>
            ) : (
                <FlatList
                    data={workouts}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <List.Item
                            title={item.name || 'Untitled Workout'}
                            description={format(new Date(item.date), 'PPP')}
                            left={(props) => <List.Icon {...props} icon="calendar" />}
                            right={(props) => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <IconButton
                                        icon="pencil"
                                        size={20}
                                        onPress={() => navigation.navigate('ActiveWorkout', { workoutId: item.id, isEditing: true })}
                                    />
                                    <IconButton
                                        icon="delete"
                                        size={20}
                                        iconColor={theme.colors.error}
                                        onPress={(e) => {
                                            console.log('Delete button pressed for:', item.id);
                                            e?.stopPropagation?.();
                                            confirmDeleteWorkout(item.id);
                                        }}
                                    />
                                </View>
                            )}
                            onPress={() => navigation.navigate('ActiveWorkout', { workoutId: item.id })}
                        />
                    )}
                />
            )}
            <ConfirmationDialog
                visible={deleteDialogVisible}
                title="Delete Workout"
                message="Are you sure you want to delete this workout? This action cannot be undone."
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
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 0,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
