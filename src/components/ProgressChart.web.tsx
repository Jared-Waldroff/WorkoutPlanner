import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressChartProps {
    data: {
        labels: string[];
        datasets: {
            data: number[];
        }[];
        legend?: string[];
    };
}

export default function ProgressChart({ data }: ProgressChartProps) {
    // Transform data for Recharts
    // react-native-chart-kit format: { labels: ['Jan', 'Feb'], datasets: [{ data: [20, 45] }] }
    // Recharts format: [{ name: 'Jan', value: 20 }, { name: 'Feb', value: 45 }]

    if (!data || !data.labels || data.labels.length === 0 || !data.datasets || data.datasets.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>No data available</Text>
            </View>
        );
    }

    const chartData = data.labels.map((label, index) => ({
        name: label,
        Weight: data.datasets[0].data[index],
    }));

    return (
        <View style={styles.container}>
            <View style={{ width: '100%', height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                        <XAxis dataKey="name" stroke="#666" fontSize={12} tickMargin={10} />
                        <YAxis stroke="#666" fontSize={12} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: 8, border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
                            itemStyle={{ color: '#E53935' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="Weight"
                            stroke="#E53935"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#E53935', strokeWidth: 2, stroke: '#fff' }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'transparent',
    },
    text: {
        color: '#666',
        fontSize: 14,
    },
});
