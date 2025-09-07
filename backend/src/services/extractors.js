// Extract phone numbers
const extractPhones = (text) => {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  const phones = text.match(phoneRegex) || [];
  return phones.map(phone => phone.replace(/\D/g, ''));
};

// Extract email addresses
const extractEmails = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
};

// Extract names (simple pattern matching)
const extractNames = (text) => {
  const namePatterns = [
    /contact\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
    /name\s*[:=]\s*([A-Z][a-z]+)/gi,
    /(?:call|phone|text)\s+([A-Z][a-z]+)/gi
  ];
  
  const names = new Set();
  namePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 2) {
        names.add(match[1]);
      }
    }
  });
  
  return Array.from(names);
};

// Extract locations - return objects, not strings
const extractLocations = (text) => {
  const locationKeywords = [
    'street', 'st', 'avenue', 'ave', 'road', 'rd', 'boulevard', 'blvd',
    'lane', 'ln', 'drive', 'dr', 'court', 'ct', 'highway', 'hwy'
  ];
  
  const locations = [];
  const words = text.split(' ');
  
  for (let i = 0; i < words.length - 1; i++) {
    if (locationKeywords.includes(words[i].toLowerCase()) || /\d+/.test(words[i])) {
      const locationName = words.slice(Math.max(0, i - 2), i + 3).join(' ');
      locations.push({
        name: locationName,
        coordinates: {}
      });
    }
  }
  
  return locations.slice(0, 3);
};

// Extract help type - use exact enum values from your schema
const extractHelpType = (text) => {
  const helpCategories = {
    Rescue: ['rescue', 'trapped', 'stuck', 'evacuate', 'save', 'emergency', 'urgent'],
    Medical: ['medical', 'doctor', 'hospital', 'medicine', 'injured', 'hurt', 'bleeding'],
    Food: ['food', 'hungry', 'starving', 'eat', 'meal', 'water', 'thirsty'],
    Shelter: ['shelter', 'home', 'house', 'roof', 'warm', 'cold', 'sleep'],
    Evacuation: ['evacuate', 'evacuation', 'leave', 'exit'],
    Information: ['information', 'info', 'news', 'update'],
    Other: []
  };
  
  const lowerText = text.toLowerCase();
  let maxMatches = 0;
  let detectedType = 'Other';
  
  Object.entries(helpCategories).forEach(([type, keywords]) => {
    const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedType = type;
    }
  });
  
  return detectedType;
};

// ✅ MAKE SURE THIS EXPORT EXISTS:
module.exports = {
  extractPhones,
  extractEmails,
  extractNames,
  extractLocations,
  extractHelpType
};