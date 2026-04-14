import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getColors, type Colors, type ColorScheme } from '../theme/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  colors: Colors;
  scheme: ColorScheme;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
}

const THEME_STORAGE_KEY = '@tourneo_theme_preference';

const ThemeContext = createContext<ThemeContextType>({
  colors: getColors('dark'),
  scheme: 'dark',
  preference: 'dark',
  isDark: true,
  setPreference: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  // Night Court is dark-mode-first — default preference is `dark`
  const [preference, setPreferenceState] = useState<ThemePreference>('dark');
  const [loaded, setLoaded] = useState(false);

  // Load stored preference on mount
  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    AsyncStorage.setItem(THEME_STORAGE_KEY, pref);
  }, []);

  // Resolve actual scheme – Night Court (dark) is the default
  const scheme: ColorScheme = preference === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : preference;

  const colors = getColors(scheme);
  const isDark = scheme === 'dark';

  if (!loaded) return null; // Prevent flash

  return (
    <ThemeContext.Provider value={{ colors, scheme, preference, isDark, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
export const useAppColors = () => useContext(ThemeContext).colors;