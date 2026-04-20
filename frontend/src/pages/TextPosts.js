import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Add as AddIcon,
  PlayArrow as ProcessIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { textPostsAPI } from "../services/api";
import {
  formatDate,
  formatUrgency,
  handleError,
  truncateText,
  getProcessingStatusColor,
} from "../utils";

const TextPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [newPost, setNewPost] = useState({
    rawText: "",
    source: {
      platform: "Web",
      author: "",
      url: "",
    },
  });

  useEffect(() => {
    fetchPosts();

    const interval = setInterval(() => {
      fetchPosts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await textPostsAPI.getPosts();
      setPosts(response.data);
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      setProcessing(true);
      await textPostsAPI.createPost(newPost);
      setOpenDialog(false);
      setNewPost({
        rawText: "",
        source: { platform: "Web", author: "", url: "" },
      });
      await fetchPosts();
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessPost = async (id) => {
    try {
      setProcessing(true);
      await textPostsAPI.processPost(id);
      await fetchPosts();
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    try {
      setProcessing(true);
      await textPostsAPI.processAllPosts();
      await fetchPosts();
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure that you want to delete all text posts?")) {
      try {
        setProcessing(true);
        await textPostsAPI.deleteAllPosts();
        await fetchPosts();
      } catch (err) {
        setError(handleError(err).message);
      } finally {
        setProcessing(false);
      }
    }
  };

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
        <Typography variant="h4">Text Posts Management</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchPosts}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Post
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ProcessIcon />}
            onClick={handleProcessAll}
            disabled={processing}
          >
            Process All
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAll}
            disabled={processing}
          >
            Delete All
          </Button>
        </Box>
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
        <Grid container spacing={3}>
          {posts.map((post) => (
            <Grid item xs={12} md={6} lg={4} key={post._id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={post.processingStatus}
                      size="small"
                      sx={{
                        backgroundColor: getProcessingStatusColor(
                          post.processingStatus,
                        ),
                        color: "white",
                      }}
                    />
                    {post.classification?.urgency && (
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
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {truncateText(post.rawText, 150)}
                  </Typography>

                  {post.source?.platform && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Source: {post.source.platform}
                    </Typography>
                  )}

                  {post.classification?.isHelpRequest && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      🆘 Help Request Detected
                    </Typography>
                  )}

                  {post.extractedDetails?.helpType && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Help Type: {post.extractedDetails.helpType}
                    </Typography>
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Created: {formatDate(post.createdAt)}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0 }}>
                  {post.processingStatus === "Pending" && (
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleProcessPost(post._id)}
                      disabled={processing}
                    >
                      Process
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Text Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Post Text"
            value={newPost.rawText}
            onChange={(e) =>
              setNewPost({ ...newPost, rawText: e.target.value })
            }
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Platform</InputLabel>
            <Select
              value={newPost.source.platform}
              label="Platform"
              onChange={(e) =>
                setNewPost({
                  ...newPost,
                  source: { ...newPost.source, platform: e.target.value },
                })
              }
            >
              <MenuItem value="Web">Web</MenuItem>
              <MenuItem value="Twitter">Twitter</MenuItem>
              <MenuItem value="Facebook">Facebook</MenuItem>
              <MenuItem value="Instagram">Instagram</MenuItem>
              <MenuItem value="Reddit">Reddit</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Author (Optional)"
            value={newPost.source.author}
            onChange={(e) =>
              setNewPost({
                ...newPost,
                source: { ...newPost.source, author: e.target.value },
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="URL (Optional)"
            value={newPost.source.url}
            onChange={(e) =>
              setNewPost({
                ...newPost,
                source: { ...newPost.source, url: e.target.value },
              })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreatePost}
            variant="contained"
            disabled={!newPost.rawText.trim() || processing}
          >
            {processing ? <CircularProgress size={20} /> : "Create Post"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TextPosts;
