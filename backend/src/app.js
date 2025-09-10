// app.js - CLEANED VERSION
const express = require("express");
const cors = require("cors");

// Import routes
const postRoutes = require("./routes/posts");

const app = express();

// ================== Middleware ==================
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  // Remove URL-encoded newlines and other whitespace characters
  req.url = req.url.replace(/%0A/g, '').replace(/%0D/g, '').trim();
  console.log('Cleaned URL:', req.url); // For debugging
  next();
});

// ================== Routes ==================
app.use("/api/posts", postRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🌍 Disaster Response API is working!",
    aiProvider: "Gemini", // explicitly show AI provider
  });
});

// ================== Error Handling ==================
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({ message: "Server error", error: error.message });
});

module.exports = app;
