import { createTheme } from '@mui/material/styles';

const palette = {
  ink: '#15161A', // headings
  slate: '#6B7280', // body / helper copy
  slateLight: '#9CA3AF', // placeholders, icons
  border: '#E2E1E8',
  borderFocus: '#8B87F5',
  surface: '#FFFFFF',
  backdrop: '#F5F4FB',
  backdropDot: '#E6E4F3',
  charcoal: '#5B5D68', // primary button
  charcoalHover: '#46474F',
  danger: '#DC3545',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: palette.charcoal,
      dark: palette.charcoalHover,
      contrastText: '#FFFFFF',
    },
    error: {
      main: palette.danger,
    },
    text: {
      primary: palette.ink,
      secondary: palette.slate,
    },
    background: {
      default: palette.backdrop,
      paper: palette.surface,
    },
    divider: palette.border,
  },
  shape: {
    borderRadius: 10,
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.9rem',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      color: palette.ink,
    },
    body2: {
      color: palette.slate,
    },
  },
  components: {
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
        size: 'medium',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: palette.border,
            },
            '&:hover fieldset': {
              borderColor: palette.slateLight,
            },
            '&.Mui-focused fieldset': {
              borderColor: palette.borderFocus,
              borderWidth: 1.5,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          paddingTop: 12,
          paddingBottom: 12,
          boxShadow: 'none',
        },
      },

      variants: [
        {
          props: { variant: 'contained', color: 'primary' },
          style: {
            '&:hover': {
              boxShadow: 'none',
            },
          },
        },
      ],
    },
  },
});

export { palette };
export default theme;
