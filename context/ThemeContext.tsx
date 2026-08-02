import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type Colors } from '../constants/theme';
import { useSettings, type ThemeMode } from '../hooks/useSettings';
import { useAuth } from './AuthContext';

export type { ThemeMode };

type ThemeContextValue = {
  colors: Colors;
  mode: ThemeMode;
  /** 'system' resolved against the OS setting — what actually picks the palette and the status bar style. */
  resolvedScheme: 'dark' | 'light';
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const systemScheme = useColorScheme();
  const { settings, update } = useSettings(user?.id);

  const mode = settings.themeMode;
  const resolvedScheme: 'dark' | 'light' = mode === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : mode;
  const colors = resolvedScheme === 'light' ? lightColors : darkColors;

  const setMode = async (next: ThemeMode) => {
    await update({ themeMode: next });
  };

  const value: ThemeContextValue = { colors, mode, resolvedScheme, setMode };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
