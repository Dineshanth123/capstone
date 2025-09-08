// server.js - UPDATED FOR GEMINI
require("dotenv").config();
const app = require("./app"); // ← IMPORT FROM app.js
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

// Debugging: show which AI provider is active
if (process.env.GEMINI_API_KEY) {
  console.log("✅ Gemini API Key loaded:", process.env.GEMINI_API_KEY.slice(0, 6) + "****");
} else {
  console.warn("⚠️ GEMINI_API_KEY is missing! Check your .env file.");
}

// Connect to database
connectDB();

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
