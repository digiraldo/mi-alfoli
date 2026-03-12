'use client';
import React, { useState, createContext, useContext, useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { getTheme } from '@/theme/miAlfoli';
import type { ThemeMode } from '@/types';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleTheme: () => {},
});

export const useThemeMode = () => useContext(ThemeContext);

export default function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  // Cargar tema inicial
  React.useEffect(() => {
    const savedMode = localStorage.getItem('mi-alfoli-theme') as ThemeMode;
    if (savedMode) {
      setMode(savedMode);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('mi-alfoli-theme', newMode);
      return newMode;
    });
  };

  const theme = useMemo(() => getTheme(mode), [mode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
