import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Verified as VerifiedIcon,
  ReportProblem as ReportProblemIcon,
} from "@mui/icons-material";
import { textPostsAPI } from "../services/api";
import { formatDate, formatUrgency, handleError, truncateText } from "../utils";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [urgentPosts, setUrgentPosts] = useState([]);
  const [recentPosts, setRecentPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const VERACITY_THRESHOLD = 0.6; 

  const getVeracityScore = (post) => {
    const s = post?.classification?.confidence;
    return typeof s === "number" ? s : null;
  };

  const veracityLabel = (post) => {
    const s = getVeracityScore(post);
    if (s == null) return "Unverified";
    const pct = Math.round(s * 100);
    if (s >= 0.8) return `High • ${pct}%`;
    if (s >= 0.6) return `Medium • ${pct}%`;
    return `Low • ${pct}%`;
  };

  const veracityColor = (post) => {
    const s = getVeracityScore(post);
    if (s == null) return "default";
    if (s >= 0.8) return "success";
    if (s >= 0.6) return "warning";
    return "error";
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsResponse, urgentResponse, postsResponse] = await Promise.all([
        textPostsAPI.getStats(),
        textPostsAPI.getUrgentPosts(),
        textPostsAPI.getPosts(),
      ]);

      setStats(statsResponse.data);
      setUrgentPosts(urgentResponse.data);

      const allPosts = postsResponse.data;
      setRecentPosts(allPosts.slice(0, 10));
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const urgentPostsFiltered = urgentPosts.filter((p) => {
    const s = getVeracityScore(p);
    return s == null ? true : s >= VERACITY_THRESHOLD;
  });

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography variant="h4" color={color}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
          <Box sx={{ color: `${color}.main` }}>{icon}</Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4">Dashboard</Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Posts"
                value={stats?.total || 0}
                icon={<InfoIcon sx={{ fontSize: 40 }} />}
                color="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Urgent Posts"
                value={stats?.urgent || 0}
                icon={<WarningIcon sx={{ fontSize: 40 }} />}
                color="error"
              />
            </Grid>
        
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Help Requests"
                value={
                  urgentPosts.filter((p) => p.classification?.isHelpRequest)
                    .length
                }
                icon={<WarningIcon sx={{ fontSize: 40 }} />}
                color="warning"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Verified Urgent (≥60%)"
                value={
                  urgentPosts.filter((p) => {
                    const s = getVeracityScore(p);
                    return s != null && s >= VERACITY_THRESHOLD;
                  }).length
                }
                icon={<VerifiedIcon sx={{ fontSize: 40 }} />}
                color="success"
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <WarningIcon color="error" />
                    Urgent Posts ({urgentPostsFiltered.length})
                  </Typography>

                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    {urgentPostsFiltered.length === 0 ? (
                      <Typography
                        color="text.secondary"
                        sx={{ textAlign: "center", p: 2 }}
                      >
                        No urgent posts found (after veracity filter)
                      </Typography>
                    ) : (
                      urgentPostsFiltered.map((post) => (
                        <Card key={post._id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 1,
                                  alignItems: "center",
                                }}
                              >
                                <Chip
                                  label={post.classification.urgency}
                                  size="small"
                                  sx={{
                                    backgroundColor: formatUrgency(
                                      post.classification.urgency,
                                    ),
                                    color: "white",
                                  }}
                                />
                                <Chip
                                  label={veracityLabel(post)}
                                  size="small"
                                  color={veracityColor(post)}
                                  icon={
                                    veracityColor(post) === "error" ? (
                                      <ReportProblemIcon />
                                    ) : (
                                      <VerifiedIcon />
                                    )
                                  }
                                  variant={
                                    getVeracityScore(post) == null
                                      ? "outlined"
                                      : "filled"
                                  }
                                />
                                {post.classification?.isHelpRequest && (
                                  <Chip
                                    label="Help Request"
                                    size="small"
                                    color="error"
                                  />
                                )}
                              </Box>

                              {post.source?.platform && (
                                <Chip
                                  label={post.source.platform}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {truncateText(post.rawText, 100)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(post.createdAt)}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            
            <Grid item xs={12} lg={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <TimelineIcon color="primary" />
                    Recent Posts ({recentPosts.length})
                  </Typography>

                  <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                    {recentPosts.length === 0 ? (
                      <Typography
                        color="text.secondary"
                        sx={{ textAlign: "center", p: 2 }}
                      >
                        No recent posts found
                      </Typography>
                    ) : (
                      recentPosts.map((post) => (
                        <Card key={post._id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent sx={{ p: 2 }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                mb: 1,
                              }}
                            >
                              <Chip
                                label={post.processingStatus}
                                size="small"
                                color={
                                  post.processingStatus === "Completed"
                                    ? "success"
                                    : "warning"
                                }
                              />
                              {post.source?.platform && (
                                <Chip
                                  label={post.source.platform}
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {truncateText(post.rawText, 100)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDate(post.createdAt)}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default Dashboard;
