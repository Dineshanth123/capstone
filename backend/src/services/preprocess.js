// Clean and prepare text for NLP analysis
const preprocessText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  let processed = text;
  
  // Remove URLs
  processed = processed.replace(/(https?:\/\/[^\s]+)/g, '');
  
  // Remove social media tags and hashtags (but keep the words)
  processed = processed.replace(/[@#]\w+/g, '');
  
  // Remove special characters but keep basic punctuation
  processed = processed.replace(/[^\w\s.,!?']/g, ' ');
  
  // Replace multiple spaces with single space
  processed = processed.replace(/\s+/g, ' ').trim();
  
  // Convert to lowercase for better NLP processing
  processed = processed.toLowerCase();
  
  return processed;
};

// Example: 
// Input: "URGENT: Flood at 123 Main St! Contact @JohnDoe #Emergency"
// Output: "urgent flood at 123 main st contact emergency"

module.exports = { preprocessText };