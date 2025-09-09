// src/controllers/postController.js
const { fetchTweetsAndSave } = require("../services/twitterService");

const Post = require("../models/Post");
const { extractDetails } = require("../services/extractors");
const axios = require("axios");

// Get all posts
const getPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching posts", error: err.message });
  }
};

// Create new post
const createPost = async (req, res) => {
  try {
    const post = new Post(req.body);
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(400).json({ message: "Error creating post", error: err.message });
  }
};

// Fetch posts from Twitter API
const fetchTwitterPosts = async (req, res) => {
  try {
      let query = req.query.query || "news";
      query = encodeURIComponent(query); // encode spaces and special chars
      const max_results = Math.min(Math.max(parseInt(req.query.limit) || 10, 10), 100); // enforce 10-100

      const response = await axios.get(
        "https://api.twitter.com/2/tweets/search/recent",
        {
          params: {
            query,
            max_results,
            "tweet.fields": "author_id,created_at",
          },
          headers: {
            Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
          },
        }
      );

      const tweets = response.data.data || [];

      if (!tweets.length) {
        return res.json({ message: "No tweets found for this query", tweets: [] });
      }

    const posts = await Post.insertMany(
      tweets.map((t) => ({
        rawText: t.text,
        source: {
          platform: "Twitter",
          postId: t.id,
          author: t.author_id,
          url: `https://twitter.com/i/web/status/${t.id}`,
        },
        classification: {},
        processingStatus: "Pending",
      })),
      { ordered: false }
    );

    res.json(posts);
  } catch (err) {
    console.error("Twitter fetch error:", err.response?.data || err.message);
    res.status(500).json({ message: "Error fetching from Twitter", error: err.message });
  }
};

// Process a post (NLP)
const processPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const extracted = await extractDetails(post.rawText);

    post.processedText = post.rawText; // you could normalize text if needed
    post.classification = extracted.classification;
    post.extractedDetails = {
      names: extracted.names,
      contacts: extracted.contacts,
      locations: extracted.locations,
      helpType: extracted.helpType,
      timestamps: extracted.timestamps,
      quantities: extracted.quantities,
      rawNlpResponse: extracted.rawNlpResponse
    };
    post.processingStatus = "Completed";

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Process post error:", err.message);
    res.status(500).json({ message: "Error processing post", error: err.message });
  }
};

// Get urgent posts
const getUrgentPosts = async (req, res) => {
  try {
    const posts = await Post.find({ "classification.urgency": "High" });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Error fetching urgent posts", error: err.message });
  }
};

// Get statistics
const getStats = async (req, res) => {
  try {
    const total = await Post.countDocuments();
    const urgent = await Post.countDocuments({ "classification.urgency": "High" });
    res.json({ total, urgent });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
};

module.exports = {
  getPosts,
  createPost,
  processPost,
  getUrgentPosts,
  getStats,
  fetchTwitterPosts
};
