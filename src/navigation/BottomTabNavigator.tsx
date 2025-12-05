import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ExercisesScreen from '../screens/ExercisesScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import LogWorkoutScreen from '../screens/LogWorkoutScreen';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import ExerciseDetailScreen from '../screens/ExerciseDetailScreen';
import AddExerciseScreen from '../screens/AddExerciseScreen';

// Components
import CustomHeader from '../components/CustomHeader';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ExercisesStack = createNativeStackNavigator();

function HomeStackNavigator() {
    return (
        <HomeStack.Navigator
            screenOptions={{
                header: (props) => <CustomHeader {...props} />,
            }}
        >
            <HomeStack.Screen name="Home" component={HomeScreen} />
            <HomeStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
            <HomeStack.Screen name="LogWorkout" component={LogWorkoutScreen} />
            <HomeStack.Screen name="Workouts" component={WorkoutsScreen} />
            {/* ExerciseDetail can be accessed from Home via ActiveWorkout history too */}
            <HomeStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        </HomeStack.Navigator>
    );
}

function ExercisesStackNavigator() {
    return (
        <ExercisesStack.Navigator
            screenOptions={{
                header: (props) => <CustomHeader {...props} />,
            }}
        >
            <ExercisesStack.Screen name="Exercises" component={ExercisesScreen} />
            <ExercisesStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
            <ExercisesStack.Screen name="AddExercise" component={AddExerciseScreen} />
        </ExercisesStack.Navigator>
    );
}

const HistoryStack = createNativeStackNavigator();

function HistoryStackNavigator() {
    return (
        <HistoryStack.Navigator
            screenOptions={{
                header: (props) => <CustomHeader {...props} />,
            }}
        >
            <HistoryStack.Screen name="Workouts" component={WorkoutsScreen} />
            <HistoryStack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
            <HistoryStack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        </HistoryStack.Navigator>
    );
}

export default function BottomTabNavigator() {
    const theme = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false, // We use the Stack header instead
                tabBarStyle: {
                    backgroundColor: theme.colors.surface,
                    borderTopColor: theme.colors.outline,
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{
                    tabBarLabel: 'Workout',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="dumbbell" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="ExercisesTab"
                component={ExercisesStackNavigator}
                options={{
                    tabBarLabel: 'Exercises',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="format-list-bulleted" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="HistoryTab"
                component={HistoryStackNavigator}
                options={{
                    tabBarLabel: 'History',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="history" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
