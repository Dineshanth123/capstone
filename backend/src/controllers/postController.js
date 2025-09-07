const Post = require("../models/Post");
const { preprocessText } = require("../services/preprocess");
const { classifyText } = require("../services/nlpService");
const {
  extractPhones,
  extractEmails,
  extractNames,
  extractLocations,
  extractHelpType,
} = require("../services/extractors");

// ================== Get all posts (for dashboard) ==================
const getPosts = async (req, res) => {
  try {
    const { urgency, helpType, page = 1, limit = 10 } = req.query;

    // Build filter based on query parameters
    const filter = {};
    if (urgency && urgency !== "All")
      filter["classification.urgency"] = urgency;
    if (helpType && helpType !== "All")
      filter["extractedDetails.helpType"] = helpType;

    const posts = await Post.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching posts", error: error.message });
  }
};

// ================== Create a new post ==================
const createPost = async (req, res) => {
  try {
    const { rawText, source } = req.body;

    if (!rawText) {
      return res.status(400).json({ message: "Post text is required" });
    }

    const post = new Post({
      rawText,
      source: source || { platform: "Unknown", author: "Unknown" },
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating post", error: error.message });
  }
};

// ================== Process a post (NLP + Extraction) ==================
const processPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Update status to processing
    post.processingStatus = "Processing";
    await post.save();

    try {
      // 1. Preprocess text
      const processedText = preprocessText(post.rawText);

      // 2. NLP Classification
      const classification = await classifyText(processedText);

      // 3. Information Extraction (✅ now using real extractors)
      const extractedDetails = {
        names: extractNames(post.rawText),
        contacts: {
          phones: extractPhones(post.rawText),
          emails: extractEmails(post.rawText),
        },
        locations: extractLocations(post.rawText),
        helpType: extractHelpType(post.rawText),
        timestamps: [
          {
            eventType: "processed",
            eventTime: new Date(),
          },
        ],
        quantities: [],
      };

      // 4. Save results
      post.processedText = processedText;
      post.classification = classification;
      post.extractedDetails = extractedDetails;
      post.processingStatus = "Completed";
      await post.save();

      res.json(post);
    } catch (processingError) {
      // Handle processing errors
      post.processingStatus = "Failed";
      post.processingErrors.push({
        stage: "NLP_Processing",
        message: processingError.message,
      });
      await post.save();
      throw processingError;
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error processing post", error: error.message });
  }
};

// ================== Get urgent posts ==================
const getUrgentPosts = async (req, res) => {
  try {
    const urgentPosts = await Post.find({
      "classification.isHelpRequest": true,
      "classification.urgency": "High",
    }).sort({ createdAt: -1 });

    res.json(urgentPosts);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching urgent posts", error: error.message });
  }
};

// ================== Get statistics ==================
const getStats = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    const helpRequests = await Post.countDocuments({
      "classification.isHelpRequest": true,
    });
    const urgentPosts = await Post.countDocuments({
      "classification.urgency": "High",
    });
    const completedProcessing = await Post.countDocuments({
      processingStatus: "Completed",
    });

    res.json({
      totalPosts,
      helpRequests,
      urgentPosts,
      completedProcessing,
      pendingProcessing: totalPosts - completedProcessing,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching statistics", error: error.message });
  }
};

// ================== Exports ==================
module.exports = {
  getPosts,
  createPost,
  processPost,
  getUrgentPosts,
  getStats,
};
