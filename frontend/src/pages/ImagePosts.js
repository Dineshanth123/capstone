import React, { useState, useCallback, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  PlayArrow as ProcessIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from "@mui/icons-material";
import { imagePostsAPI } from "../services/api";
import {
  formatDate,
  handleError,
  truncateText,
  getProcessingStatusColor,
} from "../utils";

const ImagePosts = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewDialog, setViewDialog] = useState(false);

  useEffect(() => {
    fetchImages();

    const interval = setInterval(() => {
      fetchImages();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await imagePostsAPI.getImages();
      setImages(response.data);
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      const response = await imagePostsAPI.uploadImage(file);

      setImages((prev) => [response.data, ...prev]);

      event.target.value = "";
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setUploading(false);
    }
  }, []);

  const handleProcessImage = async (id) => {
    try {
      setProcessing(true);
      const response = await imagePostsAPI.processImage(id);

      setImages((prev) =>
        prev.map((img) => (img._id === id ? response.data : img)),
      );
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessAll = async () => {
    try {
      setProcessing(true);
      await imagePostsAPI.processAllImages();

      setImages((prev) =>
        prev.map((img) =>
          img.processingStatus === "Pending"
            ? { ...img, processingStatus: "Completed" }
            : img,
        ),
      );
    } catch (err) {
      setError(handleError(err).message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all images?")) {
      try {
        setProcessing(true);
        await imagePostsAPI.deleteAllImages();
        setImages([]);
      } catch (err) {
        setError(handleError(err).message);
      } finally {
        setProcessing(false);
      }
    }
  };

  const handleViewImage = (image) => {
    setSelectedImage(image);
    setViewDialog(true);
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
        <Typography variant="h4">Image Posts Management</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<UploadIcon />}
            disabled={uploading}
          >
            {uploading ? <CircularProgress size={20} /> : "Upload Image"}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
            />
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ProcessIcon />}
            onClick={handleProcessAll}
            disabled={
              processing ||
              images.filter((img) => img.processingStatus === "Pending")
                .length === 0
            }
          >
            Process All
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDeleteAll}
            disabled={processing || images.length === 0}
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
          {images.map((image) => (
            <Grid item xs={12} md={6} lg={4} key={image._id}>
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
                      label={image.processingStatus}
                      size="small"
                      sx={{
                        backgroundColor: getProcessingStatusColor(
                          image.processingStatus,
                        ),
                        color: "white",
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {image.mimeType}
                    </Typography>
                  </Box>

                  {image.rawText && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      <strong>Extracted Text:</strong>
                      <br />
                      {truncateText(image.rawText, 150)}
                    </Typography>
                  )}

                  {image.classification?.isHelpRequest && (
                    <Typography
                      variant="caption"
                      color="primary"
                      sx={{ display: "block", mb: 1 }}
                    >
                      🆘 Help Request Detected
                    </Typography>
                  )}

                  {image.extractedDetails?.helpType && (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 1 }}
                    >
                      Help Type: {image.extractedDetails.helpType}
                    </Typography>
                  )}

                  {image.classification?.urgency && (
                    <Chip
                      label={`Urgency: ${image.classification.urgency}`}
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  )}

                  <Typography variant="caption" color="text.secondary">
                    Uploaded: {formatDate(image.createdAt)}
                  </Typography>
                </CardContent>

                <Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => handleViewImage(image)}
                  >
                    View Details
                  </Button>
                  {image.processingStatus === "Pending" && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleProcessImage(image._id)}
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

      {images.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", p: 4 }}>
          <UploadIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No images uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload an image to get started with analysis
          </Typography>
        </Box>
      )}

      <Dialog
        open={viewDialog}
        onClose={() => setViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Image Analysis Details</DialogTitle>
        <DialogContent>
          {selectedImage && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Processing Status: {selectedImage.processingStatus}
              </Typography>

              {selectedImage.rawText && (
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Extracted Text:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      p: 2,
                      backgroundColor: "grey.100",
                      borderRadius: 1,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {selectedImage.rawText}
                  </Typography>
                </Box>
              )}

              {selectedImage.classification &&
                Object.keys(selectedImage.classification).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      Classification:
                    </Typography>
                    <pre
                      style={{
                        fontSize: "12px",
                        backgroundColor: "#f5f5f5",
                        padding: "10px",
                        borderRadius: "4px",
                      }}
                    >
                      {JSON.stringify(selectedImage.classification, null, 2)}
                    </pre>
                  </Box>
                )}

              {selectedImage.extractedDetails &&
                Object.keys(selectedImage.extractedDetails).length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: "bold", mb: 1 }}
                    >
                      Extracted Details:
                    </Typography>
                    <pre
                      style={{
                        fontSize: "12px",
                        backgroundColor: "#f5f5f5",
                        padding: "10px",
                        borderRadius: "4px",
                      }}
                    >
                      {JSON.stringify(selectedImage.extractedDetails, null, 2)}
                    </pre>
                  </Box>
                )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ImagePosts;
