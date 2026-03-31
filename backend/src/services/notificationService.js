const nodemailer = require("nodemailer");
const twilio = require("twilio");

const emailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );
}

async function sendEmailAlert(postData) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return { success: false, message: "Email not configured" };
    }

    const { classification, extractedDetails, rawText, _id } = postData;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ALERT_EMAIL_RECIPIENTS || process.env.EMAIL_USER,
      subject: `CRITICAL ALERT: ${classification.urgency} Priority - ${extractedDetails.helpType}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f; border-bottom: 3px solid #d32f2f; padding-bottom: 10px;">
            ⚠️ Critical Emergency Alert
          </h2>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #856404;">Alert Details</h3>
            <p><strong>Urgency Level:</strong> <span style="color: #d32f2f; font-size: 18px;">${classification.urgency}</span></p>
            <p><strong>Help Type:</strong> ${extractedDetails.helpType}</p>
            <p><strong>Confidence:</strong> ${(classification.confidence * 100).toFixed(1)}%</p>
            <p><strong>Post ID:</strong> ${_id}</p>
          </div>

          <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4 style="margin-top: 0;">Message Content:</h4>
            <p style="white-space: pre-wrap;">${rawText || "Image-based alert"}</p>
          </div>

          ${
            extractedDetails.locations && extractedDetails.locations.length > 0
              ? `
          <div style="margin: 20px 0;">
            <h4> Location(s):</h4>
            <ul style="list-style-type: none; padding-left: 0;">
              ${extractedDetails.locations
                .map(
                  (loc) => `
                <li style="padding: 5px 0;">
                  • ${loc.name}
                  ${loc.coordinates ? ` (${loc.coordinates.latitude}, ${loc.coordinates.longitude})` : ""}
                </li>
              `,
                )
                .join("")}
            </ul>
          </div>
          `
              : ""
          }

          ${
            extractedDetails.contacts &&
            (extractedDetails.contacts.phones.length > 0 ||
              extractedDetails.contacts.emails.length > 0)
              ? `
          <div style="margin: 20px 0;">
            <h4>Contact Information:</h4>
            ${extractedDetails.contacts.phones.length > 0 ? `<p><strong>Phones:</strong> ${extractedDetails.contacts.phones.join(", ")}</p>` : ""}
            ${extractedDetails.contacts.emails.length > 0 ? `<p><strong>Emails:</strong> ${extractedDetails.contacts.emails.join(", ")}</p>` : ""}
          </div>
          `
              : ""
          }

          ${
            extractedDetails.names && extractedDetails.names.length > 0
              ? `
          <div style="margin: 20px 0;">
            <h4> Affected Persons:</h4>
            <p>${extractedDetails.names.join(", ")}</p>
          </div>
          `
              : ""
          }

          <div style="background-color: #e3f2fd; padding: 15px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p style="margin: 0;"><strong> Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
            <p>This is an automated alert from the Disaster Response System. Please respond immediately.</p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("Email sending failed:", error.message);
    return { success: false, message: error.message };
  }
}

async function sendSMSAlert(postData) {
  try {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      return { success: false, message: "SMS not configured" };
    }

    const { classification, extractedDetails, _id } = postData;

    const recipients = process.env.ALERT_SMS_RECIPIENTS
      ? process.env.ALERT_SMS_RECIPIENTS.split(",").map((num) => num.trim())
      : [];

    if (recipients.length === 0) {
      return { success: false, message: "No recipients configured" };
    }

    const location =
      extractedDetails.locations && extractedDetails.locations.length > 0
        ? extractedDetails.locations[0].name
        : "Location unknown";

    const message = ` CRITICAL ALERT
Urgency: ${classification.urgency}
Type: ${extractedDetails.helpType}
Location: ${location}
ID: ${_id}
Time: ${new Date().toLocaleTimeString()}
Respond immediately!`;

    const results = [];
    for (const recipient of recipients) {
      try {
        const result = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient,
        });
        results.push({ recipient, success: true, sid: result.sid });
      } catch (err) {
        results.push({ recipient, success: false, error: err.message });
      }
    }

    return {
      success: true,
      message: "SMS sending completed",
      results,
    };
  } catch (error) {
    console.error(" SMS sending failed:", error.message);
    return { success: false, message: error.message };
  }
}

async function sendCriticalAlert(postData) {
  const { classification } = postData;

  if (
    !classification ||
    classification.urgency !== "High" ||
    !classification.isHelpRequest
  ) {
    return {
      triggered: false,
      reason: "Not a high-urgency help request",
    };
  }

  const notifications = {
    triggered: true,
    email: null,
    sms: null,
  };

  const [emailResult, smsResult] = await Promise.all([
    sendEmailAlert(postData),
    sendSMSAlert(postData),
  ]);

  notifications.email = emailResult;
  notifications.sms = smsResult;

  return notifications;
}

async function testNotificationSetup() {
  const results = {
    email: { configured: false, working: false },
    sms: { configured: false, working: false },
  };

  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    results.email.configured = true;
    try {
      await emailTransporter.verify();
      results.email.working = true;
    } catch (error) {
      results.email.error = error.message;
    }
  }

  if (
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER
  ) {
    results.sms.configured = true;
    try {
      results.sms.working = twilioClient !== null;
    } catch (error) {
      results.sms.error = error.message;
    }
  }

  return results;
}

module.exports = {
  sendCriticalAlert,
  sendEmailAlert,
  sendSMSAlert,
  testNotificationSetup,
};
