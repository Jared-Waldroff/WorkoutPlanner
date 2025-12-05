import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, IconButton } from 'react-native-paper';
import { getHeaderTitle } from '@react-navigation/elements';
import { useThemeContext } from '../context/ThemeContext';

export default function CustomHeader({ navigation, route, options, back }: any) {
    const theme = useTheme();
    const { isDark, toggleTheme } = useThemeContext();
    const title = getHeaderTitle(options, route.name);

    return (
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
            <View style={styles.leftContainer}>
                {back ? (
                    <IconButton
                        icon="arrow-left"
                        iconColor={theme.colors.onSurface}
                        onPress={navigation.goBack}
                    />
                ) : null}
            </View>

            <View style={styles.centerContainer}>
                <Image
                    source={require('../assets/snatch_logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.rightContainer}>
                <IconButton
                    icon={isDark ? "weather-sunny" : "weather-night"}
                    iconColor={theme.colors.onSurface}
                    onPress={toggleTheme}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        elevation: 4, // Shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    leftContainer: {
        flex: 1,
        alignItems: 'flex-start',
        paddingLeft: 8,
    },
    centerContainer: {
        flex: 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightContainer: {
        flex: 1,
        alignItems: 'flex-end',
        paddingRight: 8,
    },
    logo: {
        width: 40,
        height: 40,
    },
});
