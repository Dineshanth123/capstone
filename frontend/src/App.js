import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
} from "@mui/material";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import TextPosts from "./pages/TextPosts";
import ImagePosts from "./pages/ImagePosts";
import TwitterFetch from "./pages/TwitterFetch";
import HeatMap from "./pages/HeatMap";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Navbar />
        <Container maxWidth="xl" sx={{ pb: 4 }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/text-posts" element={<TextPosts />} />
            <Route path="/image-posts" element={<ImagePosts />} />
            <Route path="/twitter" element={<TwitterFetch />} />
            <Route path="/heatmap" element={<HeatMap />} />
          </Routes>
        </Container>
      </Router>
    </ThemeProvider>
  );
}

export default App;
