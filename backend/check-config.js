const fs = require("fs");
const path = require("path");

console.log(" Checking Configuration...\n");

const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  console.error(" .env file not found! Copy .env.example to .env");
  process.exit(1);
}

require("dotenv").config();

const checks = {
  database: false,
  gemini: false,
  email: false,
  sms: false,
  twitter: false,
};

if (process.env.MONGODB_URI) {
  console.log(" MongoDB URI configured");
  checks.database = true;
} else {
  console.log("MONGODB_URI not set");
}

if (process.env.GEMINI_API_KEY) {
  console.log("Gemini API key configured");
  checks.gemini = true;
} else {
  console.log(" GEMINI_API_KEY not set");
}

if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  console.log(" Email configuration found");
  console.log(`   User: ${process.env.EMAIL_USER}`);
  console.log(
    `   Recipients: ${process.env.ALERT_EMAIL_RECIPIENTS || "Not set"}`,
  );
  checks.email = true;
} else {
  console.log(
    " Email not configured (EMAIL_USER or EMAIL_PASSWORD missing)",
  );
  console.log("   → Notifications will not work");
}

if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
) {
  console.log(" Twilio SMS configuration found");
  console.log(`   Phone: ${process.env.TWILIO_PHONE_NUMBER}`);
  console.log(
    `   Recipients: ${process.env.ALERT_SMS_RECIPIENTS || "Not set"}`,
  );
  checks.sms = true;
} else {
  console.log("  SMS not configured (Twilio credentials missing)");
  console.log("   → SMS alerts will not work (optional)");
}

if (process.env.TWITTER_BEARER_TOKEN) {
  console.log(" Twitter API configured");
  checks.twitter = true;
} else {
  console.log("  Twitter not configured (optional)");
}


if (checks.database && checks.gemini) {
  console.log("\n Core features ready to use!");
  console.log("   You can start the server with: npm run dev\n");

  if (!checks.email) {
    console.log(
      "  Configure EMAIL_USER and EMAIL_PASSWORD for notifications",
    );
  }
} else {
  console.log("\n Core configuration incomplete!");
  console.log("   Please set MONGODB_URI and GEMINI_API_KEY in .env\n");
  process.exit(1);
}

console.log("\n🔧 Testing dependencies...");
try {
  require("nodemailer");
  require("twilio");
  require("node-geocoder");
  console.log(" All notification dependencies installed\n");
} catch (error) {
  console.error(" Missing dependencies:", error.message);
  console.log("   Run: npm install\n");
  process.exit(1);
}

console.log(" Configuration check complete!\n");
