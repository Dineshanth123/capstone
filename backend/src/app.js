const express = require("express");
const cors = require("cors");
const postRoutes = require("./routes/posts");

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.url = req.url.replace(/%0A/g, '').replace(/%0D/g, '').trim();
  console.log('Cleaned URL:', req.url); 
  next();
});

app.use("/api/posts", postRoutes);

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
