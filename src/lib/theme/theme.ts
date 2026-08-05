import { createTheme } from "@mui/material/styles";

/**
 * Surface tokens for the chat UI. Kept outside the MUI theme (rather than via
 * palette module augmentation) since only the chat feature needs them.
 */
export const chatSurfaces = {
  page: "#0f1013",
  sidebar: "#1a1b1f",
  main: "#17181c",
  header: "#1e1f24",
  bubbleIncoming: "#2b2c34",
  raised: "#2f303a",
  border: "rgba(255,255,255,0.06)",
};

const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: "dark",
    primary: { main: "#5b6ef5", contrastText: "#ffffff" },
    success: { main: "#3ba55d" },
    error: { main: "#f87171" },
    background: { default: chatSurfaces.page, paper: chatSurfaces.sidebar },
    text: {
      primary: "#e7e8ec",
      secondary: "#96979f",
      disabled: "#6b6d76",
    },
    divider: chatSurfaces.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: false },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export default theme;
