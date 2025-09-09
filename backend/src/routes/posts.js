const express = require('express');
const {
  getPosts,
  createPost,
  processPost,
  getUrgentPosts,
  getStats,
  fetchTwitterPosts
} = require('../controllers/postController');

const router = express.Router();

// GET /api/posts - Get all posts
router.get('/', getPosts);

// POST /api/posts - Create a new post
router.post('/', createPost);

// POST /api/posts/:id/process - Process a specific post
router.post('/:id/process', processPost);

// GET /api/posts/urgent - Get all urgent posts
router.get('/urgent', getUrgentPosts);

// GET /api/posts/stats - Get statistics
router.get('/stats', getStats);

// GET /api/posts/twitter - Fetch posts from Twitter API
router.get('/twitter', fetchTwitterPosts);

module.exports = router;
