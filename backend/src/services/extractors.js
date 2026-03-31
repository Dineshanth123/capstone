const { GoogleGenerativeAI } = require("@google/generative-ai");
const Tesseract = require("tesseract.js");
const { geocodeMultipleLocations } = require("./geocodingService");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function cleanJsonResponse(text) {
  if (!text) return "{}";
  return text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

function regexFallback(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\d{10}/g;
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const nameRegex = /\bI am ([A-Z][a-z]+\s[A-Z][a-z]+)\b/;
  const locationRegex =
    /\b(Victoria Station|Chennai|Mumbai|Delhi|Bangalore|Hyderabad|Kolkata)\b/gi;

  const names = nameRegex.test(text) ? [text.match(nameRegex)[1]] : [];
  const phones = text.match(phoneRegex) || [];
  const emails = text.match(emailRegex) || [];
  const locations = (text.match(locationRegex) || []).map((l) => ({ name: l }));


  let urgency = "Needs Review";
  let isHelpRequest = false;
  const textLower = text.toLowerCase();

  if (
    /(urgent|emergency|critical|dying|trapped|fire|bleeding|unconscious|severe|immediate)/i.test(
      text,
    )
  ) {
    urgency = "High";
    isHelpRequest = true;
  }
  
  else if (
    /(need help|running out|injured|damage|evacuation|rescue)/i.test(text)
  ) {
    urgency = "Medium";
    isHelpRequest = true;
  }
  
  else if (/(looking for|need supplies|information|request)/i.test(text)) {
    urgency = "Low";
    isHelpRequest = true;
  }

  
  let helpType = "Other";
  if (/food|water|hunger|thirsty/i.test(text)) helpType = "Food";
  if (/medical|doctor|hospital|medicine|injured|sick/i.test(text))
    helpType = "Medical";
  if (/rescue|trapped|help|save|stuck/i.test(text)) helpType = "Rescue";
  if (/shelter|house|homeless|accommodation/i.test(text)) helpType = "Shelter";

  return {
    classification: {
      isHelpRequest,
      urgency,
      confidence: 0.5,
      categories: [helpType],
    },
    names,
    contacts: { phones, emails },
    locations,
    helpType,
    timestamps: [{ eventType: "processed", eventTime: new Date() }],
    quantities: [],
    rawNlpResponse: null,
  };
}

async function extractDetails(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      You are an emergency response AI analyzing disaster-related messages. Extract structured information and classify urgency.
      
      URGENCY CLASSIFICATION RULES:
      - "High": Life-threatening emergency, immediate danger, critical medical needs, trapped people, active disaster
        Keywords: URGENT, EMERGENCY, CRITICAL, DYING, TRAPPED, FIRE, BLEEDING, UNCONSCIOUS, SEVERE
      - "Medium": Needs assistance soon but not immediately life-threatening
        Keywords: Need help, running out, injured, damage, evacuation needed
      - "Low": General information, requests that can wait, non-urgent needs
        Keywords: Looking for, need supplies, information request
      - "Needs Review": Cannot determine urgency from message
      
      Return ONLY valid JSON with this exact structure:
      {
        "classification": {
          "isHelpRequest": true if requesting help/reporting emergency, false otherwise,
          "urgency": "High" | "Medium" | "Low" | "Needs Review",
          "confidence": number between 0 and 1,
          "categories": ["Medical", "Food", "Shelter", "Rescue", "Other"]
        },
        "names": [array of person names mentioned],
        "contacts": {
          "phones": [array of phone numbers],
          "emails": [array of email addresses]
        },
        "locations": [{ "name": "location name" }],
        "helpType": "Medical" | "Food" | "Rescue" | "Shelter" | "Other"
      }

      Message to analyze: """${text}"""
      
      Return ONLY the JSON object, no other text.
    `;

    const result = await model.generateContent(prompt);
    const raw = result.response.candidates[0].content.parts[0].text;
    const cleaned = cleanJsonResponse(raw);

    const parsed = JSON.parse(cleaned);

    if (parsed.locations && parsed.locations.length > 0) {
      parsed.locations = await geocodeMultipleLocations(parsed.locations);
    }

    return {
      ...parsed,
      timestamps: [{ eventType: "processed", eventTime: new Date() }],
      quantities: [],
      rawNlpResponse: cleaned,
    };
  } catch (err) {
    console.error("Gemini Extractor Error:", err.message);
    return regexFallback(text);
  }
}

async function extractTextFromImage(imagePath) {
  try {
    const {
      data: { text },
    } = await Tesseract.recognize(imagePath, "eng");
    return text;
  } catch (err) {
    console.error("OCR extraction failed:", err.message);
    throw err;
  }
}

module.exports = {
  extractDetails,
  extractTextFromImage,
};
