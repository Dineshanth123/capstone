const mongoose = require('mongoose');

// Define the schema for extracted contact information
const ContactSchema = new mongoose.Schema({
  phones: [{
    type: String,
    trim: true
  }],
  emails: [{
    type: String,
    trim: true,
    lowercase: true
  }]
}, { _id: false }); // Disable _id for subdocuments

// Define the schema for classification results
const ClassificationSchema = new mongoose.Schema({
  isHelpRequest: {
    type: Boolean,
    default: false,
    required: true
  },
  urgency: {
    type: String,
    enum: ['High', 'Medium', 'Low', 'Needs Review', 'Not Applicable'],
    default: 'Needs Review',
    required: true
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0
  },
  categories: [{
    type: String,
    trim: true
  }]
}, { _id: false });

// Define the schema for extracted details
const ExtractedDetailsSchema = new mongoose.Schema({
  names: [{
    type: String,
    trim: true
  }],
  contacts: ContactSchema,
  locations: [{
    name: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  }],
  helpType: {
    type: String,
    trim: true,
    enum: ['Medical', 'Food', 'Shelter', 'Rescue', 'Evacuation', 'Information', 'Other', ''],
    default: ''
  },
  timestamps: [{
  eventType: {
    type: String,
    default: 'processed'
  },
  eventTime: {
    type: Date,
    default: Date.now
  }
}],
  quantities: [{
    item: String,
    amount: Number,
    unit: String
  }],
  // Store raw response from NLP service for debugging
  rawNlpResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
}, { _id: false });

// Main Post schema
const PostSchema = new mongoose.Schema({
  // Original content
  rawText: {
    type: String,
    required: [true, 'Post text is required'],
    trim: true,
    maxlength: [5000, 'Post text cannot exceed 5000 characters']
  },
  
  // Source information (optional)
  source: {
    platform: {
      type: String,
      enum: ['Twitter', 'Facebook', 'Instagram', 'Reddit', 'Web', 'Unknown'],
      default: 'Unknown'
    },
    postId: {
      type: String,
      trim: true
    },
    author: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  },
  
  // Processing results
  processedText: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Classification results
  classification: {
    type: ClassificationSchema,
    default: () => ({})
  },
  
  // Extracted structured information
  extractedDetails: {
    type: ExtractedDetailsSchema,
    default: () => ({})
  },
  
  // Processing metadata
  processingStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  processingErrors: [{
    stage: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Version for optimistic concurrency control
  version: {
    type: Number,
    default: 0
  }
}, {
  timestamps: false, // We're handling timestamps manually
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
PostSchema.index({ createdAt: -1 });
PostSchema.index({ 'classification.urgency': 1 });
PostSchema.index({ 'classification.isHelpRequest': 1 });
PostSchema.index({ 'processingStatus': 1 });
PostSchema.index({ 'source.platform': 1 });
PostSchema.index({ 
  'rawText': 'text', 
  'processedText': 'text' 
});

// Virtual for easy access to whether post is high priority
PostSchema.virtual('isHighPriority').get(function() {
  return this.classification.urgency === 'High' && this.classification.isHelpRequest;
});

// Middleware to update updatedAt timestamp before saving
PostSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.version += 1;
  next();
});

// Static method to find high priority posts
PostSchema.statics.findHighPriority = function() {
  return this.find({
    'classification.isHelpRequest': true,
    'classification.urgency': 'High'
  });
};

// Static method to find posts by processing status
PostSchema.statics.findByStatus = function(status) {
  return this.find({ processingStatus: status });
};

// Instance method to mark as processed
PostSchema.methods.markAsProcessed = function() {
  this.processingStatus = 'Completed';
  return this.save();
};

// Instance method to add processing error
PostSchema.methods.addProcessingError = function(stage, message) {
  this.processingErrors.push({ stage, message });
  this.processingStatus = 'Failed';
  return this.save();
};

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;