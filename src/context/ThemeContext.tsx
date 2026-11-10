import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../constants/config';
import { DARK_THEME, LIGHT_THEME, ThemeColors } from '../constants/theme';

interface ThemeContextValue {
  theme: ThemeColors;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: LIGHT_THEME,
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME_MODE).then((saved) => {
      if (saved === 'dark') setIsDark(true);
    });
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      AsyncStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.THEME_MODE,
        next ? 'dark' : 'light'
      );
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: isDark ? DARK_THEME : LIGHT_THEME,
        isDark,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

