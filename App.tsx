import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import { adaptNavigationTheme, PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { ModernTheme, ModernDarkTheme } from './src/theme';
import { ThemeProvider, useThemeContext } from './src/context/ThemeContext';

const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavigationDefaultTheme,
  reactNavigationDark: NavigationDarkTheme,
  materialLight: ModernTheme,
  materialDark: ModernDarkTheme,
});

function Main() {
  const { isDark } = useThemeContext();
  const paperTheme = isDark ? ModernDarkTheme : ModernTheme;
  const navigationTheme = isDark ? DarkTheme : LightTheme;

  return (
    <PaperProvider theme={paperTheme}>
      <AppNavigator navigationTheme={navigationTheme} />
    </PaperProvider>
  );
}

export default function App() {
  console.log('App mounting...');
  return (
    <ThemeProvider>
      <Main />
    </ThemeProvider>
  );
}
