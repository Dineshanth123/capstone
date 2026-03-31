require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

if (!process.env.GEMINI_API_KEY) {
  console.warn(" GEMINI_API_KEY is missing! Check your .env file.");
}

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
