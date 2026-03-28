import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import {
  Twitter as TwitterIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { textPostsAPI } from "../services/api";
import { handleError, formatDate, truncateText } from "../utils";

const TwitterFetch = () => {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(10);
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFetchTweets = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await textPostsAPI.fetchTwitterPosts(query, limit);
      setTweets(response.data);
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1 }}
      >
        <TwitterIcon color="primary" />
        Twitter Data Fetch
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Fetch Recent Tweets
          </Typography>

          <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "end" }}>
            <TextField
              fullWidth
              label="Search Query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., disaster, emergency, help needed"
              helperText="Enter keywords to search for relevant tweets"
            />
            <TextField
              label="Limit"
              type="number"
              value={limit}
              onChange={(e) =>
                setLimit(
                  Math.max(1, Math.min(100, parseInt(e.target.value) || 10))
                )
              }
              inputProps={{ min: 1, max: 100 }}
              sx={{ width: 120 }}
            />
            <Button
              variant="contained"
              startIcon={<SearchIcon />}
              onClick={handleFetchTweets}
              disabled={loading || !query.trim()}
              sx={{ whiteSpace: "nowrap" }}
            >
              Fetch Tweets
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
              <CircularProgress />
              <Typography sx={{ ml: 2 }}>Fetching tweets...</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {tweets.length > 0 && (
        <Box>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Fetched Tweets ({tweets.length})
          </Typography>

          <Grid container spacing={2}>
            {tweets.map((tweet) => (
              <Grid item xs={12} md={6} lg={4} key={tweet._id}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                      }}
                    >
                      <Chip
                        label={tweet.source.platform}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        label={tweet.processingStatus}
                        size="small"
                        color={
                          tweet.processingStatus === "Pending"
                            ? "warning"
                            : "success"
                        }
                      />
                    </Box>

                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {truncateText(tweet.rawText, 200)}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Author: {tweet.source.author || "Unknown"}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Tweet ID: {tweet.source.postId}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      Fetched: {formatDate(tweet.createdAt)}
                    </Typography>

                    {tweet.source.url && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          href={tweet.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Tweet
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {tweets.length === 0 && !loading && !error && (
        <Box sx={{ textAlign: "center", p: 4 }}>
          <TwitterIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No tweets fetched yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter a search query and click "Fetch Tweets" to get started
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TwitterFetch;
