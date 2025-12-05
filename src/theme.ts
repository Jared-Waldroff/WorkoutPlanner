import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const ModernTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#FF3B30', // Apple System Red
        onPrimary: '#ffffff',
        primaryContainer: '#FFEBEE',
        onPrimaryContainer: '#990000',

        secondary: '#FF3B30', // Apple System Red (was Blue)
        onSecondary: '#ffffff',
        secondaryContainer: '#FFEBEE',
        onSecondaryContainer: '#990000',

        tertiary: '#5856D6', // Apple System Indigo
        onTertiary: '#ffffff',

        background: '#ffffff', // User requested White background
        onBackground: '#000000',

        surface: '#F2F2F7', // Light Gray for cards to stand out against white bg
        onSurface: '#000000',
        surfaceVariant: '#E5E5EA', // iOS Separator/Fill
        onSurfaceVariant: '#3C3C43', // iOS Secondary Label

        outline: '#C7C7CC', // iOS Separator
        elevation: {
            level0: 'transparent',
            level1: '#ffffff',
            level2: '#ffffff',
            level3: '#ffffff',
            level4: '#ffffff',
            level5: '#ffffff',
        },
    },
    roundness: 12, // More rounded corners
};

export const ModernDarkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#FF453A', // Apple System Red Dark Mode
        onPrimary: '#000000',
        primaryContainer: '#3E0000',
        onPrimaryContainer: '#FFEBEE',

        secondary: '#FF453A',
        onSecondary: '#000000',
        secondaryContainer: '#3E0000',
        onSecondaryContainer: '#FFEBEE',

        tertiary: '#5E5CE6', // Apple System Indigo Dark Mode
        onTertiary: '#ffffff',

        background: '#1C1C1E', // Lighter Dark Grey (was #121212)
        onBackground: '#ffffff',

        surface: '#2C2C2E', // Lighter Grey for cards
        onSurface: '#ffffff',
        surfaceVariant: '#3A3A3C', // iOS Dark Secondary Surface
        onSurfaceVariant: '#EBEBF5',

        outline: '#38383A',
        elevation: {
            level0: 'transparent',
            level1: '#1C1C1E',
            level2: '#1C1C1E',
            level3: '#1C1C1E',
            level4: '#1C1C1E',
            level5: '#1C1C1E',
        },
    },
    roundness: 12,
};
