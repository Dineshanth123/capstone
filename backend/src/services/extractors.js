// src/services/extractor.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: clean JSON text ---
function cleanJsonResponse(text) {
  if (!text) return "{}";
  return text.replace(/```json/gi, "").replace(/```/g, "").trim();
}

// --- Regex fallback extractors ---
function regexFallback(text) {
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\d{10}/g;
  const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const nameRegex = /\bI am ([A-Z][a-z]+\s[A-Z][a-z]+)\b/;
  const locationRegex = /\b(Victoria Station|Chennai|Mumbai|Delhi)\b/gi;

  const names = nameRegex.test(text) ? [text.match(nameRegex)[1]] : [];
  const phones = text.match(phoneRegex) || [];
  const emails = text.match(emailRegex) || [];
  const locations = (text.match(locationRegex) || []).map(l => ({ name: l }));

  let helpType = "Other";
  if (/food|water/i.test(text)) helpType = "Food";
  if (/medical|doctor|hospital/i.test(text)) helpType = "Medical";
  if (/rescue|trapped|help/i.test(text)) helpType = "Rescue";

  return {
    classification: {
      isHelpRequest: false,
      urgency: "Needs Review",
      confidence: 0,
      categories: []
    },
    names,
    contacts: { phones, emails },
    locations,
    helpType,
    timestamps: [{ eventType: "processed", eventTime: new Date() }],
    quantities: [],
    rawNlpResponse: null
  };
}

// --- Main Extractor with Gemini ---
async function extractDetails(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Extract structured information from the following disaster-related message.
      Return valid JSON ONLY with this structure:
      {
        "classification": {
          "isHelpRequest": true/false,
          "urgency": "High" | "Medium" | "Low" | "Needs Review",
          "confidence": number (0 to 1),
          "categories": [ "Medical", "Food", "Shelter", "Rescue", "Other" ]
        },
        "names": [string],
        "contacts": {
          "phones": [string],
          "emails": [string]
        },
        "locations": [ { "name": string } ],
        "helpType": "Medical" | "Food" | "Rescue" | "Shelter" | "Other"
      }

      Message: """${text}"""
    `;

    const result = await model.generateContent(prompt);
    const raw = result.response.candidates[0].content.parts[0].text;
    const cleaned = cleanJsonResponse(raw);

    const parsed = JSON.parse(cleaned);

    return {
      ...parsed,
      timestamps: [{ eventType: "processed", eventTime: new Date() }],
      quantities: [],
      rawNlpResponse: cleaned
    };
  } catch (err) {
    console.error("Gemini Extractor Error:", err.message);
    return regexFallback(text);
  }
}

module.exports = {
  extractDetails
};
