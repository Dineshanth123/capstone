const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  phones: [{ type: String, trim: true }],
  emails: [{ type: String, trim: true, lowercase: true }]
}, { _id: false });

const ClassificationSchema = new mongoose.Schema({
  isHelpRequest: { type: Boolean, default: false, required: true },
  urgency: {
    type: String,
    enum: ['High', 'Medium', 'Low', 'Needs Review', 'Not Applicable'],
    default: 'Needs Review',
    required: true
  },
  confidence: { type: Number, min: 0, max: 1, default: 0 },
  categories: [{ type: String, trim: true }]
}, { _id: false });

const ExtractedDetailsSchema = new mongoose.Schema({
  names: [{ type: String, trim: true, default: [] }],
  contacts: { type: ContactSchema, default: () => ({ phones: [], emails: [] }) },
  locations: [{ name: { type: String, trim: true }, coordinates: { latitude: Number, longitude: Number } }],
  helpType: {
    type: String,
    trim: true,
    enum: ['Medical', 'Food', 'Shelter', 'Rescue', 'Evacuation', 'Information', 'Other', ''],
    default: ''
  },
  timestamps: [{ eventType: { type: String, default: 'processed' }, eventTime: { type: Date, default: Date.now } }],
  quantities: [{ item: String, amount: Number, unit: String }],
  rawNlpResponse: { type: mongoose.Schema.Types.Mixed, default: null }
}, { _id: false });

const TextPostSchema = new mongoose.Schema({
  rawText: { type: String, required: [true, 'Post text is required'], trim: true, maxlength: 5000 },
  source: {
    platform: { type: String, enum: ['Twitter', 'Facebook', 'Instagram', 'Reddit', 'Web', 'Unknown'], default: 'Unknown' },
    postId: { type: String, trim: true },
    author: { type: String, trim: true },
    url: { type: String, trim: true }
  },
  processedText: { type: String, trim: true, default: '' },
  classification: { type: ClassificationSchema, default: () => ({}) },
  extractedDetails: { type: ExtractedDetailsSchema, default: () => ({}) },
  processingStatus: { type: String, enum: ['Pending', 'Processing', 'Completed', 'Failed'], default: 'Pending' },
  processingErrors: [{ stage: String, message: String, timestamp: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
  version: { type: Number, default: 0 }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

TextPostSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  this.version += 1;
  next();
});

const TextPost = mongoose.model('TextPost', TextPostSchema);
module.exports = TextPost;
