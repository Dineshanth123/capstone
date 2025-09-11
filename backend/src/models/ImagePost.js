const mongoose = require("mongoose");

const ImagePostSchema = new mongoose.Schema({
  image: {
    type: Buffer,
    required: [true, "Image binary is required"]
  },
  mimeType: {
    type: String,
    default: "image/jpeg"
  },
  rawText: { type: String, default: "" },
  processedText: { type: String, default: "" },
  classification: {
    isHelpRequest: { type: Boolean, default: false },
    urgency: {
      type: String,
      enum: ["High", "Medium", "Low", "Needs Review", "Not Applicable"],
      default: "Needs Review"
    },
    confidence: { type: Number, default: 0 },
    categories: [String]
  },
  extractedDetails: {
    names: [String],
    contacts: {
      phones: [String],
      emails: [String]
    },
    locations: [{ name: String }],
    helpType: { type: String, default: "Other" },
    timestamps: [{ eventType: String, eventTime: { type: Date, default: Date.now } }],
    quantities: [{ item: String, amount: Number, unit: String }],
    rawNlpResponse: mongoose.Schema.Types.Mixed
  },
  processingStatus: {
    type: String,
    enum: ["Pending", "Processing", "Completed", "Failed"],
    default: "Pending"
  },
  processingErrors: [{
    stage: String,
    message: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now }
});

ImagePostSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("ImagePost", ImagePostSchema);
