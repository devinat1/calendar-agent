'use client';

import { createTheme } from '@mui/material/styles';

// Material Design 3 (Material You) theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6750A4', // Primary color from Material You
      light: '#9A82DB',
      dark: '#4F378B',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#625B71', // Secondary color
      light: '#8E8599',
      dark: '#463F54',
      contrastText: '#FFFFFF',
    },
    tertiary: {
      main: '#7E5260',
      light: '#A87C8A',
      dark: '#633B48',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#BA1A1A',
      light: '#FFDAD6',
      dark: '#93000A',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#8C5E00',
      light: '#FFDF9C',
      dark: '#6A4700',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#006780',
      light: '#B8E8F5',
      dark: '#004E62',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#006E26',
      light: '#9BF67C',
      dark: '#00531C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FEF7FF', // Surface color from Material You
      paper: '#FFFFFF',
    },
    surface: {
      main: '#FEF7FF',
      variant: '#E7E0EC',
    },
    outline: {
      main: '#79747E',
      variant: '#CAC4D0',
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
      main: '#D0BCFF',
      light: '#EADDFF',
      dark: '#4F378B',
      contrastText: '#381E72',
    },
    secondary: {
      main: '#CCC2DC',
      light: '#E8DEF8',
      dark: '#4A4458',
      contrastText: '#332D41',
    },
    background: {
      default: '#141218',
      paper: '#1D1B20',
    },
    surface: {
      main: '#141218',
      variant: '#49454F',
    },
    outline: {
      main: '#938F99',
      variant: '#49454F',
    },
    text: {
      primary: '#E6E0E9',
      secondary: '#CAC4D0',
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