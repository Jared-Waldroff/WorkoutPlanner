import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, useTheme } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function AddExerciseScreen() {
    const [name, setName] = useState('');
    const [muscleGroup, setMuscleGroup] = useState('');
    const [equipment, setEquipment] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation();
    const route = useRoute<any>();
    const theme = useTheme();
    const { exerciseId } = route.params || {};

    useEffect(() => {
        if (exerciseId) {
            fetchExerciseDetails();
        }
    }, [exerciseId]);

    async function fetchExerciseDetails() {
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', exerciseId)
            .single();

        if (error) {
            Alert.alert('Error', 'Failed to load exercise details');
            navigation.goBack();
            return;
        }

        if (data) {
            setName(data.name);
            setMuscleGroup(data.muscle_group || '');
            setEquipment(data.equipment || '');
        }
    }

    async function handleSave() {
        if (!name) {
            Alert.alert('Error', 'Name is required');
            return;
        }

        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            Alert.alert('Error', 'You must be logged in');
            setLoading(false);
            return;
        }

        let error;
        if (exerciseId) {
            const { error: updateError } = await supabase
                .from('exercises')
                .update({
                    name,
                    muscle_group: muscleGroup,
                    equipment,
                })
                .eq('id', exerciseId);
            error = updateError;
        } else {
            const { error: insertError } = await supabase.from('exercises').insert({
                name,
                muscle_group: muscleGroup,
                equipment,
                user_id: user.id,
            });
            error = insertError;
        }

        setLoading(false);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            navigation.goBack();
        }
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <TextInput
                label="Exercise Name"
                value={name}
                onChangeText={setName}
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />
            <TextInput
                label="Muscle Group (e.g., Chest, Back)"
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />
            <TextInput
                label="Equipment (e.g., Barbell, Dumbbell)"
                value={equipment}
                onChangeText={setEquipment}
                style={[styles.input, { backgroundColor: theme.colors.surface }]}
                textColor={theme.colors.onSurface}
            />
            <Button mode="contained" onPress={handleSave} loading={loading} style={styles.button}>
                {exerciseId ? 'Update Exercise' : 'Save Exercise'}
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
    },
});
