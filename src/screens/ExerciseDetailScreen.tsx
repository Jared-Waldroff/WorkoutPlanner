import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { Text, ActivityIndicator, useTheme, Card, Button, IconButton } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format, parseISO } from 'date-fns';
import ProgressChart from '../components/ProgressChart';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function ExerciseDetailScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortAscending, setSortAscending] = useState(false);
    const route = useRoute<any>();
    const navigation = useNavigation();
    const theme = useTheme();
    const { exerciseId, exerciseName } = route.params || {};

    if (!exerciseId) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>Error: No exercise ID provided.</Text>
                <Button onPress={() => navigation.goBack()}>Go Back</Button>
            </View>
        );
    }

    useEffect(() => {
        if (exerciseName) navigation.setOptions({ title: exerciseName });
        fetchHistory();
    }, [exerciseId]);

    async function fetchHistory() {
        setLoading(true);
        const { data, error } = await supabase
            .from('workout_exercises')
            .select(`
        workout:workouts(date),
        sets(weight, reps, rpe)
      `)
            .eq('exercise_id', exerciseId)
            .order('created_at', { ascending: true }); // Oldest to newest for chart

        if (error) {
            console.error(error);
        } else {
            const processed = (data || [])
                .filter((item: any) => item.workout) // Filter null workouts
                .map((item: any) => {
                    // Calculate max weight for this session
                    const maxWeight = item.sets.reduce((max: number, s: any) => Math.max(max, parseFloat(s.weight) || 0), 0);
                    return {
                        date: item.workout.date,
                        weight: maxWeight,
                    };
                })
                .filter((item) => item.weight > 0); // Only show sessions with actual weight recorded

            setHistory(processed);
        }
        setLoading(false);
    }

    // Prepare Chart Data
    const chartData = {
        labels: history.map((h) => format(parseISO(h.date), 'MM/dd')),
        datasets: [
            {
                data: history.map((h) => h.weight),
                color: (opacity = 1) => theme.colors.primary, // optional
                strokeWidth: 2, // optional
            },
        ],
        legend: ['Max Weight (lbs)'], // optional
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : history.length < 2 ? (
                <View style={styles.emptyState}>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>Not enough data to show progress chart yet.</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>Log more workouts with this exercise!</Text>
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.content}>
                    <Card style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Title title="Strength Progress" titleStyle={{ color: theme.colors.onSurface }} />
                        <Card.Content>
                            <ProgressChart data={chartData} />
                        </Card.Content>
                    </Card>

                    <Card style={[styles.statsCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Title title="Statistics" titleStyle={{ color: theme.colors.onSurface }} />
                        <Card.Content>
                            <View style={styles.statRow}>
                                <Text style={{ color: theme.colors.onSurfaceVariant }}>Personal Record (PR) 🏆:</Text>
                                <Text style={[styles.statValue, { color: theme.colors.primary, fontSize: 20 }]}>
                                    {Math.max(...history.map(h => h.weight))} lbs
                                </Text>
                            </View>
                            <View style={styles.statRow}>
                                <Text style={{ color: theme.colors.onSurfaceVariant }}>Total Sessions:</Text>
                                <Text style={[styles.statValue, { color: theme.colors.onSurface }]}>
                                    {history.length}
                                </Text>
                            </View>
                        </Card.Content>
                    </Card>

                    <Card style={[styles.historyListCard, { backgroundColor: theme.colors.surface }]}>
                        <Card.Title
                            title="History"
                            titleStyle={{ color: theme.colors.onSurface }}
                            right={(props) => (
                                <IconButton
                                    {...props}
                                    icon={sortAscending ? "arrow-up" : "arrow-down"}
                                    onPress={() => setSortAscending(!sortAscending)}
                                    iconColor={theme.colors.onSurfaceVariant}
                                />
                            )}
                        />
                        <Card.Content>
                            {/* History is fetched ascending (oldest -> newest) */}
                            {/* If sortAscending is true, show as is. If false (default), reverse it. */}
                            {(sortAscending ? history : [...history].reverse()).map((item, index) => (
                                <View key={index} style={[styles.historyRow, { borderBottomColor: theme.colors.outline }]}>
                                    <Text style={{ color: theme.colors.onSurface }}>{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
                                    <Text style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{item.weight} lbs</Text>
                                </View>
                            ))}
                        </Card.Content>
                    </Card>
                </ScrollView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loader: {
        marginTop: 50,
    },
    content: {
        padding: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    chartCard: {
        marginBottom: 16,
        borderRadius: 16,
        elevation: 2,
    },
    statsCard: {
        borderRadius: 16,
        elevation: 2,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    statValue: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    historyListCard: {
        marginTop: 16,
        borderRadius: 16,
        elevation: 2,
        marginBottom: 32,
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 0.5,
    }
});
