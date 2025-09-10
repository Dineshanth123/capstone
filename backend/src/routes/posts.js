const express = require('express');
const {
  getPosts,
  createPost,
  processPost,
  processAllPosts,
  getUrgentPosts,
  getStats,
  fetchTwitterPosts,
  deleteTwitterPosts
} = require('../controllers/postController');

const router = express.Router();

router.get('/', getPosts);
router.post('/', createPost);
router.post('/process/:id', processPost);
router.post('/process-all', processAllPosts);
router.get('/urgent', getUrgentPosts);
router.get('/stats', getStats);
router.get('/twitter/fetch', fetchTwitterPosts);
router.delete('/twitter', deleteTwitterPosts);

module.exports = router;