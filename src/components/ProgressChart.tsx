import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from 'react-native-paper';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProgressChartProps {
    data: any;
}

export default function ProgressChart({ data }: ProgressChartProps) {
    const theme = useTheme();

    const chartConfig = {
        backgroundGradientFrom: theme.colors.surface,
        backgroundGradientTo: theme.colors.surface,
        decimalPlaces: 0,
        color: (opacity = 1) => theme.colors.primary,
        labelColor: (opacity = 1) => theme.colors.onSurface,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: theme.colors.primary,
        },
    };

    return (
        <LineChart
            data={data}
            width={SCREEN_WIDTH - 64} // from react-native
            height={220}
            yAxisLabel=""
            yAxisSuffix=" lbs"
            chartConfig={chartConfig}
            bezier
            style={{
                marginVertical: 8,
                borderRadius: 16,
            }}
        />
    );
}
