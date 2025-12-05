import React, { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { List, FAB, Searchbar, ActivityIndicator, useTheme, IconButton } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { Exercise } from '../types/database';
import { useNavigation } from '@react-navigation/native';

export default function ExercisesScreen() {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigation = useNavigation<any>();

    useEffect(() => {
        fetchExercises();
    }, []);

    async function fetchExercises() {
        setLoading(true);
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .order('name');

        if (error) {
            console.error(error);
        } else {
            setExercises(data || []);
        }
        setLoading(false);
    }

    const filteredExercises = exercises.filter((ex) =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const theme = useTheme();

    async function deleteExercise(exerciseId: string) {
        Alert.alert(
            'Delete Exercise',
            'Are you sure you want to delete this exercise? This will remove it from all workout history.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await supabase.from('exercises').delete().eq('id', exerciseId);
                        if (error) {
                            Alert.alert('Error', error.message);
                        } else {
                            fetchExercises();
                        }
                    },
                },
            ]
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Searchbar
                placeholder="Search exercises"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}
                inputStyle={{ color: theme.colors.onSurface }}
                iconColor={theme.colors.onSurface}
                placeholderTextColor={theme.colors.onSurfaceVariant}
            />
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <FlatList
                    data={filteredExercises}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <List.Item
                            title={item.name}
                            titleStyle={{ color: theme.colors.onSurface }}
                            description={`${item.muscle_group || ''} • ${item.equipment || ''}`}
                            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                            left={(props) => <List.Icon {...props} icon="dumbbell" color={theme.colors.primary} />}
                            onPress={() => navigation.navigate('ExerciseDetail', { exerciseId: item.id, exerciseName: item.name })}
                            right={(props) => (
                                <View style={{ flexDirection: 'row' }}>
                                    <IconButton icon="pencil" size={20} onPress={() => navigation.navigate('AddExercise', { exerciseId: item.id })} />
                                    <IconButton icon="delete" iconColor={theme.colors.error} size={20} onPress={() => deleteExercise(item.id)} />
                                </View>
                            )}
                        />
                    )}
                />
            )}
            <FAB
                style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                icon="plus"
                color="white"
                onPress={() => navigation.navigate('AddExercise')}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        margin: 10,
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
});
