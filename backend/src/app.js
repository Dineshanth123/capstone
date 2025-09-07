const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const postRoutes = require('./routes/posts');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Mount the posts routes
app.use('/api/posts', postRoutes);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Disaster Response API is working!' });
});



// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ message: 'Server error', error: error.message });
});

module.exports = app;