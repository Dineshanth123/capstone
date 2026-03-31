import React from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import {
  TextSnippet as TextIcon,
  Image as ImageIcon,
  Dashboard as DashboardIcon,
  Twitter as TwitterIcon,
  Map as MapIcon,
} from "@mui/icons-material";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Urgency Help Aggegrator
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            color="inherit"
            component={Link}
            to="/"
            startIcon={<DashboardIcon />}
            sx={{
              backgroundColor: isActive("/")
                ? "rgba(255,255,255,0.2)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/text-posts"
            startIcon={<TextIcon />}
            sx={{
              backgroundColor: isActive("/text-posts")
                ? "rgba(255,255,255,0.2)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Text Posts
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/image-posts"
            startIcon={<ImageIcon />}
            sx={{
              backgroundColor: isActive("/image-posts")
                ? "rgba(255,255,255,0.2)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Image Posts
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/twitter"
            startIcon={<TwitterIcon />}
            sx={{
              backgroundColor: isActive("/twitter")
                ? "rgba(255,255,255,0.2)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Twitter
          </Button>
          <Button
            color="inherit"
            component={Link}
            to="/heatmap"
            startIcon={<MapIcon />}
            sx={{
              backgroundColor: isActive("/heatmap")
                ? "rgba(255,255,255,0.2)"
                : "transparent",
              "&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
            }}
          >
            Heat Map
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
