import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary:   { main: '#2563EB', dark: '#0F3B7E', light: '#3B82F6' },
    secondary: { main: '#6B7280' },
    success:   { main: '#10B981' },
    error:     { main: '#EF4444' },
    warning:   { main: '#F59E0B' },
    background: { default: '#F3F4F6', paper: '#FFFFFF' },
    text: { primary: '#1F2937', secondary: '#6B7280' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 8, textTransform: 'none', fontWeight: 600 },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 12, border: '1px solid #E5E7EB' },
      },
    },
  },
});
