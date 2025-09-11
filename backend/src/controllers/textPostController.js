const TextPost = require("../models/TextPost");
const { extractDetails } = require("../services/extractors");
const axios = require("axios");

// Fetch all text posts
const getPosts = async (req, res) => {
  try {
    const posts = await TextPost.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
};

const deleteAllPosts = async (req, res) => {
  try {
    const result = await TextPost.deleteMany({});
    res.json({ 
      message: `All text posts deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ message: "Error deleting posts", error: err.message });
  }
};
// Create new text post manually
const createPost = async (req, res) => {
  try {
    const post = new TextPost(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: "Error creating post", error: err.message });
  }
};

// Fetch Twitter posts
const fetchTwitterPosts = async (req, res) => {
  try {
    let query = req.query.query || "news";
    query = `${query} lang:en`; 
    const max_results = Math.min(Math.max(parseInt(req.query.limit) || 10, 10), 100); 

    const response = await axios.get("https://api.twitter.com/2/tweets/search/recent", {
      params: { query, max_results, "tweet.fields": "author_id,created_at" },
      headers: { Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}` }
    });

    const tweets = response.data.data || [];
    if (!tweets.length) return res.json({ message: "No tweets found", tweets: [] });

    const posts = await TextPost.insertMany(
      tweets.map((t) => ({
        rawText: t.text,
        source: { platform: "Twitter", postId: t.id, author: t.author_id, url: `https://twitter.com/i/web/status/${t.id}` },
        classification: {},
        processingStatus: "Pending"
      })),
      { ordered: false }
    );

    res.json(posts);
  } catch (err) {
    console.error("Twitter fetch error:", err.response?.data || err.message);
    res.status(500).json({ message: "Error fetching from Twitter", error: err.message });
  }
};

// Process single post
const processPost = async (req, res) => {
  try {
    const post = await TextPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const extracted = await extractDetails(post.rawText);
    post.processedText = post.rawText;
    post.classification = extracted.classification;
    post.extractedDetails = { ...extracted, rawNlpResponse: extracted.rawNlpResponse };
    post.processingStatus = "Completed";

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Error processing post", error: err.message });
  }
};

// Process all pending posts
const processAllPosts = async (req, res) => {
  try {
    const posts = await TextPost.find({ processingStatus: "Pending" });
    await Promise.all(posts.map(async (post) => {
      try {
        const extracted = await extractDetails(post.rawText);
        post.processedText = post.rawText;
        post.classification = extracted.classification;
        post.extractedDetails = { ...extracted, rawNlpResponse: extracted.rawNlpResponse };
        post.processingStatus = "Completed";
        await post.save();
      } catch (error) {
        post.processingErrors.push({ stage: "NLP", message: error.message });
        post.processingStatus = "Failed";
        await post.save();
      }
    }));
    res.json({ message: `${posts.length} text posts processed successfully` });
  } catch (err) {
    res.status(500).json({ message: "Error processing all posts", error: err.message });
  }
};

// Get urgent posts
const getUrgentPosts = async (req, res) => {
  try {
    const posts = await TextPost.find({ "classification.urgency": "High" });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching urgent posts", error: err.message });
  }
};

// Stats
const getStats = async (req, res) => {
  try {
    const total = await TextPost.countDocuments();
    const urgent = await TextPost.countDocuments({ "classification.urgency": "High" });
    res.json({ total, urgent });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};

module.exports = {
  getPosts,
  createPost,
  processPost,
  processAllPosts,
  getUrgentPosts,
  getStats,
  fetchTwitterPosts,
  deleteAllPosts
};
