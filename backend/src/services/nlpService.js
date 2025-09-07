// For now, let's create a SIMULATED NLP service
// Later you can replace this with actual HuggingFace API calls

const simulateNLPClassification = (text) => {
  // Simple rule-based classification for demo purposes
  const lowerText = text.toLowerCase();
  
  // Check if this is a help request
  const helpKeywords = ['help', 'need', 'urgent', 'emergency', 'rescue', 'save', 'trapped', 'stuck'];
  const isHelpRequest = helpKeywords.some(keyword => lowerText.includes(keyword));
  
  // Determine urgency level
  let urgency = 'Low';
  let confidence = 0.6;
  
  if (lowerText.includes('urgent') || lowerText.includes('emergency')) {
    urgency = 'High';
    confidence = 0.9;
  } else if (lowerText.includes('need') || lowerText.includes('help')) {
    urgency = 'Medium';
    confidence = 0.7;
  }
  
  // Detect categories
  const categories = [];
  if (lowerText.includes('medical') || lowerText.includes('doctor')) categories.push('medical');
  if (lowerText.includes('food') || lowerText.includes('water')) categories.push('food');
  if (lowerText.includes('shelter') || lowerText.includes('home')) categories.push('shelter');
  if (lowerText.includes('rescue') || lowerText.includes('trapped')) categories.push('rescue');
  
  return {
    isHelpRequest,
    urgency,
    confidence,
    categories: categories.length > 0 ? categories : ['general']
  };
};

// Main classification function (will be replaced with real API later)
const classifyText = async (text) => {
  try {
    // SIMULATED API CALL - Replace this with actual HuggingFace API
    console.log('📡 Simulating NLP classification for text:', text.substring(0, 50) + '...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return simulateNLPClassification(text);
    
  } catch (error) {
    console.error('NLP classification error:', error);
    // Return default classification if API fails
    return {
      isHelpRequest: false,
      urgency: 'Needs Review',
      confidence: 0,
      categories: []
    };
  }
};

module.exports = { classifyText };