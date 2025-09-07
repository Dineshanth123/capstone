// server.js - UPDATED VERSION
require('dotenv').config();
const app = require('./app'); // ← IMPORT FROM app.js
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB();

// Use the app from app.js (which has all your routes)
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});