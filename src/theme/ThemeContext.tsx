import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'light';

export type ThemeColors = {
  background: string;
  backgroundRaised: string;
  surface: string;
  surfaceStrong: string;
  input: string;
  text: string;
  onAccent: string;
  muted: string;
  subtle: string;
  border: string;
  accent: string;
  accentSoft: string;
  blue: string;
  success: string;
  danger: string;
  nav: string;
  shadow: string;
};

const THEME_STORAGE_KEY = 'secondmeet.theme.v1';

const COLORS: Record<ThemeMode, ThemeColors> = {
  dark: {
    background: '#080B16', backgroundRaised: '#101426', surface: 'rgba(55,44,63,0.40)',
    surfaceStrong: 'rgba(71,66,83,0.38)', input: 'rgba(45,44,61,0.45)', text: '#F7F7FC', onAccent: '#FFFFFF', muted: '#A5AAC0',
    subtle: '#A0A7C4', border: 'rgba(226,192,219,0.17)', accent: '#FF3F87', accentSoft: 'rgba(231,52,129,0.16)',
    blue: '#30B9FF', success: '#53D6A6', danger: '#FF667D', nav: 'rgba(12,15,28,0.65)',
    shadow: '#C62E9F',
  },
  light: {
    background: '#FFF5F5', backgroundRaised: '#F8EAFE', surface: 'rgba(255,255,255,0.32)',
    surfaceStrong: 'rgba(255,255,255,0.42)', input: 'rgba(255,255,255,0.35)', text: '#251049', onAccent: '#FFFFFF', muted: '#654879',
    subtle: '#796187', border: 'rgba(255,255,255,0.48)', accent: '#AF286B', accentSoft: 'rgba(237,96,188,0.13)',
    blue: '#588AF3', success: '#319A79', danger: '#D94E6B', nav: 'rgba(255,250,255,0.67)',
    shadow: '#9B5B9C',
  },
};

type ThemeContextValue = { mode: ThemeMode; colors: ThemeColors; setMode: (mode: ThemeMode) => Promise<void> };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem(THEME_STORAGE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark') setModeState(stored);
    }).catch(() => undefined);
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Keep the current selection for this app session if storage is unavailable.
    }
  }, []);

  const value = useMemo(() => ({ mode, colors: COLORS[mode], setMode }), [mode, setMode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used within ThemeProvider');
  return value;
}
