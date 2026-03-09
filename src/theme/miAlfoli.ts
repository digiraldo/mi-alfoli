'use client';
import { createTheme } from '@mui/material/styles';

// Paleta "Cosecha y Providencia" — Mi Alfolí
export const miAlfoli = {
  primary: '#006064',
  primaryLight: '#00838F',
  primaryDark: '#00363A',
  secondary: '#FFB300',
  secondaryLight: '#FFD54F',
  secondaryDark: '#FF8F00',
  tertiary: '#BF360C',
  tertiaryLight: '#E64A19',
  tertiaryDark: '#7F0000',
  surfaceLight: '#F5F5F0',
  surfaceDark: '#21211F',
  incomeColors: ['#FFB300', '#FFC107', '#FFD54F'],
  expenseColors: ['#BF360C', '#E64A19', '#FF8A65'],
  savingsColors: ['#006064', '#00838F', '#4DD0E1'],
};

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: miAlfoli.primary,
        light: miAlfoli.primaryLight,
        dark: miAlfoli.primaryDark,
      },
      secondary: {
        main: miAlfoli.secondary,
        light: miAlfoli.secondaryLight,
        dark: miAlfoli.secondaryDark,
      },
      error: {
        main: miAlfoli.tertiary,
      },
      background: {
        default: mode === 'light' ? miAlfoli.surfaceLight : miAlfoli.surfaceDark,
        paper: mode === 'light' ? '#FFFFFF' : '#2C2C2A',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 16,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow:
              mode === 'light'
                ? '0 2px 12px rgba(0,96,100,0.08)'
                : '0 2px 12px rgba(0,0,0,0.4)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiFab: {
        styleOverrides: {
          root: {
            borderRadius: 16,
          },
        },
      },
    },
  });
