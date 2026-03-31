const express = require("express");
const cors = require("cors");
const path = require("path");

const textPostRoutes = require("./routes/textPosts");
const imagePostRoutes = require("./routes/imagePosts");
const heatmapRoutes = require("./routes/heatmap");

const app = express();

app.use(cors());

app.use(express.json());

app.use((req, res, next) => {
  req.url = req.url.replace(/%0A/g, "").replace(/%0D/g, "").trim();
  next();
});

app.use("/api/text-posts", textPostRoutes);
app.use("/api/image-posts", imagePostRoutes);
app.use("/api/heatmap", heatmapRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Disaster Response API is working!",
    aiProvider: "Gemini",
  });
});

app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ message: "Server error", error: error.message });
});

module.exports = app;
