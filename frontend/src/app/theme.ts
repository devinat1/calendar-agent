'use client';

import { createTheme } from '@mui/material/styles';

// Material Design 3 (Material You) theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0D47A1', // Deep Blue
      light: '#5472D3',
      dark: '#002171',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#00695C', // Teal
      light: '#439889',
      dark: '#003D33',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#AD1457', // Pink accent
      light: '#F48FB1',
      dark: '#78002E',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#FF6659',
      dark: '#9A0007',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFA000',
      light: '#FFC046',
      dark: '#C67100',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#0288D1',
      light: '#5EB8FF',
      dark: '#005B9F',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#2E7D32',
      light: '#60AD5E',
      dark: '#005005',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#E3F2FD', // Light blue background
      paper: '#FFFFFF',
    },
    surface: {
      main: '#E3F2FD',
      variant: '#BBDEFB',
    },
    outline: {
      main: '#90CAF9',
      variant: '#64B5F6',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    // Material Design 3 typography scale
    h1: {
      fontSize: '3.5rem', // Display Large
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '-0.015625em',
    },
    h2: {
      fontSize: '2.8125rem', // Display Medium
      fontWeight: 400,
      lineHeight: 1.2,
      letterSpacing: '0em',
    },
    h3: {
      fontSize: '2.25rem', // Display Small
      fontWeight: 400,
      lineHeight: 1.167,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '2rem', // Headline Large
      fontWeight: 400,
      lineHeight: 1.235,
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '1.75rem', // Headline Medium
      fontWeight: 400,
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '1.5rem', // Headline Small
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0em',
    },
    subtitle1: {
      fontSize: '1.375rem', // Title Large
      fontWeight: 400,
      lineHeight: 1.75,
      letterSpacing: '0em',
    },
    subtitle2: {
      fontSize: '1.125rem', // Title Medium
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.00735em',
    },
    body1: {
      fontSize: '1rem', // Body Large
      fontWeight: 400,
      lineHeight: 1.5,
      letterSpacing: '0.00938em',
    },
    body2: {
      fontSize: '0.875rem', // Body Medium
      fontWeight: 400,
      lineHeight: 1.43,
      letterSpacing: '0.01071em',
    },
    caption: {
      fontSize: '0.75rem', // Body Small
      fontWeight: 400,
      lineHeight: 1.33,
      letterSpacing: '0.03333em',
    },
    overline: {
      fontSize: '0.6875rem', // Label Small
      fontWeight: 500,
      lineHeight: 2.66,
      letterSpacing: '0.08333em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 12, // Material Design 3 uses more rounded corners
  },
  components: {
    // Material Design 3 component customizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20, // Fully rounded buttons
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          height: 40,
          paddingLeft: 24,
          paddingRight: 24,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
          },
        },
        outlined: {
          borderWidth: 1,
          '&:hover': {
            borderWidth: 1,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 4, // Less rounded for text fields
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#79747E',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          height: 32,
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

// Dark theme variant
export const darkTheme = createTheme({
  ...theme,
  palette: {
    ...theme.palette,
    mode: 'dark',
    primary: {
      main: '#90CAF9',
      light: '#E3F2FD',
      dark: '#42A5F5',
      contrastText: '#0D47A1',
    },
    secondary: {
      main: '#80CBC4',
      light: '#B2FEF7',
      dark: '#4F9A94',
      contrastText: '#004D40',
    },
    background: {
      default: '#121212',
      paper: '#1D1D1D',
    },
    surface: {
      main: '#121212',
      variant: '#37474F',
    },
    outline: {
      main: '#B0BEC5',
      variant: '#90A4AE',
    },
    text: {
      primary: '#ECEFF1',
      secondary: '#B0BEC5',
    },
  },
});

// Extend the theme interface to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: Palette['primary'];
    surface: {
      main: string;
      variant: string;
    };
    outline: {
      main: string;
      variant: string;
    };
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions['primary'];
    surface?: {
      main?: string;
      variant?: string;
    };
    outline?: {
      main?: string;
      variant?: string;
    };
  }
} 