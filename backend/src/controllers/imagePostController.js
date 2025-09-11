const ImagePost = require("../models/ImagePost");
const { extractDetails, extractTextFromImage } = require("../services/extractors");

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const post = new ImagePost({
      image: req.file.buffer,      // binary stored in DB
      mimeType: req.file.mimetype, // image type
      processingStatus: "Pending"
    });

    await post.save();

    // Create a response object similar to old filePath style
    const responseObj = {
      _id: post._id,
      filePath: `uploads\\${post._id.toString()}`, // fake path for compatibility
      mimeType: post.mimeType,
      rawText: post.rawText,
      processedText: post.processedText,
      classification: post.classification,
      extractedDetails: post.extractedDetails,
      processingStatus: post.processingStatus,
      processingErrors: post.processingErrors,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      __v: post.__v
    };

    res.status(201).json(responseObj);
  } catch (err) {
    console.error("Upload image error:", err.message);
    res.status(500).json({ message: "Error uploading image", error: err.message });
  }
};



// 5️⃣ Delete all images
const deleteAllImages = async (req, res) => {
  try {
    const result = await ImagePost.deleteMany({});
    res.json({ message: `${result.deletedCount} images deleted successfully` });
  } catch (err) {
    console.error("Delete all images error:", err.message);
    res.status(500).json({ message: "Error deleting all images", error: err.message });
  }
};



// Single process
const processImage = async (req, res) => {
  try {
    const post = await ImagePost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Image post not found" });

    // Pass Buffer instead of filePath
    const extractedText = await extractTextFromImage(post.image);
    const extracted = await extractDetails(extractedText);

    post.rawText = extractedText;
    post.processedText = extractedText;
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
    console.error("Process image error:", err.message);
    res.status(500).json({ message: "Error processing image", error: err.message });
  }
};

// 4️⃣ Process all pending images
const processAllImages = async (req, res) => {
  try {
    const posts = await ImagePost.find({ processingStatus: "Pending" });

    await Promise.all(posts.map(async (post) => {
      try {
        const extractedText = await extractTextFromImage(post.image);
        const extracted = await extractDetails(extractedText);

        post.rawText = extractedText;
        post.processedText = extractedText;
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
      } catch (error) {
        post.processingErrors.push({ stage: "OCR/NLP", message: error.message });
        post.processingStatus = "Failed";
        await post.save();
      }
    }));

    res.json({ message: `${posts.length} image posts processed successfully` });
  } catch (err) {
    console.error("Process all images error:", err.message);
    res.status(500).json({ message: "Error processing all images", error: err.message });
  }
};

module.exports = {
  uploadImage,
  processImage,
  processAllImages,
  deleteAllImages
};
