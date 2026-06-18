import { createTheme, type PaletteMode, alpha } from '@mui/material'

const FONT_STACK = [
  'Inter',
  '"Noto Sans"',
  '"Noto Sans Devanagari"',
  '"Noto Sans Gujarati"',
  'system-ui',
  '-apple-system',
  'sans-serif',
].join(', ')

// Earthy agriculture palette: green primary, harvest-amber secondary.
export const buildTheme = (mode: PaletteMode) =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#2e7d32', light: '#60ad5e', dark: '#1b5e20', contrastText: '#fff' },
      secondary: { main: '#f9a825', light: '#ffd95a', dark: '#c17900', contrastText: '#1b1b1b' },
      success: { main: '#43a047' },
      warning: { main: '#fb8c00' },
      error: { main: '#e53935' },
      background:
        mode === 'light'
          ? { default: '#f1f6ee', paper: '#ffffff' }
          : { default: '#0f1511', paper: '#16201a' },
      text:
        mode === 'light'
          ? { primary: '#1b2a20', secondary: '#52685a' }
          : { primary: '#e8f0e9', secondary: '#a4b8aa' },
    },
    shape: { borderRadius: 14 },
    typography: {
      fontFamily: FONT_STACK,
      h1: { fontWeight: 800 },
      h2: { fontWeight: 800 },
      h3: { fontWeight: 800, letterSpacing: '-0.5px' },
      h4: { fontWeight: 700 },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 700 },
      button: { fontWeight: 600 },
    },
    components: {
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { textTransform: 'none', borderRadius: 10 } },
      },
      MuiPaper: {
        styleOverrides: {
          root: ({ theme }) => ({
            backgroundImage: 'none',
            border: `1px solid ${alpha(theme.palette.primary.main, mode === 'light' ? 0.08 : 0.18)}`,
          }),
        },
      },
      MuiCard: {
        styleOverrides: { root: { borderRadius: 18 } },
      },
      MuiChip: {
        styleOverrides: { root: { fontWeight: 600 } },
      },
    },
  })
