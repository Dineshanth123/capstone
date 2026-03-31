import React, { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import axios from "axios";
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  Button,
} from "@mui/material";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const HeatMap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [locationStats, setLocationStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [urgencyFilter, setUrgencyFilter] = useState("");
  const [helpTypeFilter, setHelpTypeFilter] = useState("All");
  const [timeRangeFilter, setTimeRangeFilter] = useState("24");

  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]);
  const [mapZoom, setMapZoom] = useState(5);

  const fetchHeatmapData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (helpTypeFilter !== "All") params.helpType = helpTypeFilter;
      if (timeRangeFilter) params.timeRange = timeRangeFilter;

      const response = await axios.get("/api/heatmap/data", { params });
      setHeatmapData(response.data.points);
      setError(null);
    } catch (err) {
      setError("Failed to fetch heatmap data: " + err.message);
      console.error("Heatmap fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [urgencyFilter, helpTypeFilter, timeRangeFilter]);

  const fetchLocationStats = useCallback(async () => {
    try {
      const params = {};
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (helpTypeFilter !== "All") params.helpType = helpTypeFilter;
      if (timeRangeFilter) params.timeRange = timeRangeFilter;

      const response = await axios.get("/api/heatmap/locations", { params });
      setLocationStats(response.data.slice(0, 10));
    } catch (err) {
      console.error("Location stats error:", err);
    }
  }, [urgencyFilter, helpTypeFilter, timeRangeFilter]);

  useEffect(() => {
    fetchHeatmapData();
    fetchLocationStats();

    const interval = setInterval(() => {
      fetchHeatmapData();
      fetchLocationStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchHeatmapData, fetchLocationStats]);

  const getMarkerColor = (urgency) => {
    switch (urgency) {
      case "High":
        return "#d32f2f";
      case "Medium":
        return "#f57c00";
      case "Low":
        return "#fbc02d";
      default:
        return "#757575";
    }
  };

  const getMarkerSize = (urgency) => {
    switch (urgency) {
      case "High":
        return 15;
      case "Medium":
        return 10;
      case "Low":
        return 7;
      default:
        return 5;
    }
  };

  const focusOnLocation = (lat, lng) => {
    setMapCenter([lat, lng]);
    setMapZoom(12);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🗺️ Urgency Heat Map
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Geographic visualization of emergency requests based on urgency levels
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

     
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Urgency Level</InputLabel>
              <Select
                value={urgencyFilter}
                label="Urgency Level"
                onChange={(e) => setUrgencyFilter(e.target.value)}
              >
                <MenuItem value="">All Levels</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Help Type</InputLabel>
              <Select
                value={helpTypeFilter}
                label="Help Type"
                onChange={(e) => setHelpTypeFilter(e.target.value)}
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Medical">Medical</MenuItem>
                <MenuItem value="Food">Food</MenuItem>
                <MenuItem value="Rescue">Rescue</MenuItem>
                <MenuItem value="Shelter">Shelter</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRangeFilter}
                label="Time Range"
                onChange={(e) => setTimeRangeFilter(e.target.value)}
              >
                <MenuItem value="6">Last 6 hours</MenuItem>
                <MenuItem value="12">Last 12 hours</MenuItem>
                <MenuItem value="24">Last 24 hours</MenuItem>
                <MenuItem value="48">Last 48 hours</MenuItem>
                <MenuItem value="168">Last week</MenuItem>
                <MenuItem value="">All time</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <Button
              variant="contained"
              fullWidth
              onClick={fetchHeatmapData}
              disabled={loading}
            >
              Refresh Data
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 2, height: "600px", position: "relative" }}>
            {loading && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 1000,
                }}
              >
                <CircularProgress />
              </Box>
            )}

            <Typography variant="h6" gutterBottom>
              Map View ({heatmapData.length} points)
            </Typography>

            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: "520px", width: "100%" }}
              scrollWheelZoom={true}
            >
              <ChangeView center={mapCenter} zoom={mapZoom} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {heatmapData.map((point, index) => (
                <CircleMarker
                  key={index}
                  center={[point.lat, point.lng]}
                  radius={getMarkerSize(point.urgency)}
                  fillColor={getMarkerColor(point.urgency)}
                  color={getMarkerColor(point.urgency)}
                  weight={1}
                  opacity={0.8}
                  fillOpacity={0.6}
                >
                  <Popup>
                    <Box sx={{ minWidth: 200 }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {point.location}
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ mb: 1 }}
                      >
                        {point.formattedAddress}
                      </Typography>

                      <Stack spacing={0.5} sx={{ mt: 1 }}>
                        <Chip
                          label={point.urgency}
                          size="small"
                          color={
                            point.urgency === "High"
                              ? "error"
                              : point.urgency === "Medium"
                                ? "warning"
                                : "default"
                          }
                        />
                        <Typography variant="caption">
                          <strong>Type:</strong> {point.helpType}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Time:</strong>{" "}
                          {new Date(point.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption">
                          <strong>Confidence:</strong>{" "}
                          {(point.confidence * 100).toFixed(0)}%
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ mt: 1, fontStyle: "italic" }}
                        >
                          {point.preview}...
                        </Typography>
                      </Stack>
                    </Box>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 2, height: "600px", overflow: "auto" }}>
            <Typography variant="h6" gutterBottom>
              Top Locations
            </Typography>

            {locationStats.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No location data available yet
              </Typography>
            ) : (
              <Stack spacing={2}>
                {locationStats.map((stat, index) => (
                  <Card
                    key={index}
                    variant="outlined"
                    sx={{
                      cursor: stat.coordinates ? "pointer" : "default",
                      "&:hover": stat.coordinates ? { boxShadow: 2 } : {},
                    }}
                    onClick={() =>
                      stat.coordinates &&
                      focusOnLocation(
                        stat.coordinates.latitude,
                        stat.coordinates.longitude,
                      )
                    }
                  >
                    <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        #{index + 1} {stat.location}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ mt: 1 }}
                        flexWrap="wrap"
                      >
                        <Chip
                          label={`High: ${stat.highUrgency}`}
                          size="small"
                          color="error"
                          variant="outlined"
                        />
                        <Chip
                          label={`Med: ${stat.mediumUrgency}`}
                          size="small"
                          color="warning"
                          variant="outlined"
                        />
                        <Chip
                          label={`Low: ${stat.lowUrgency}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>

                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: "block" }}
                      >
                        Total Incidents: {stat.count}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Legend
        </Typography>
        <Stack direction="row" spacing={3}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                bgcolor: "#d32f2f",
              }}
            />
            <Typography variant="caption">High Urgency</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                bgcolor: "#f57c00",
              }}
            />
            <Typography variant="caption">Medium Urgency</Typography>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#fbc02d",
              }}
            />
            <Typography variant="caption">Low Urgency</Typography>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
};

export default HeatMap;
