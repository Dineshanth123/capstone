const express = require("express");
const cors = require("cors");
const path = require("path");

const textPostRoutes = require("./routes/textPosts");
const imagePostRoutes = require("./routes/imagePosts");

const app = express();

// Enable CORS
app.use(cors());

// Parse JSON requests
app.use(express.json());


// Clean URL middleware
app.use((req, res, next) => {
  req.url = req.url.replace(/%0A/g, '').replace(/%0D/g, '').trim();
  console.log('Cleaned URL:', req.url);
  next();
});

// API routes
app.use("/api/text-posts", textPostRoutes);
app.use("/api/image-posts", imagePostRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Disaster Response API is working!",
    aiProvider: "Gemini"
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ message: "Server error", error: error.message });
});

module.exports = app;
