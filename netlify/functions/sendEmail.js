const axios = require("axios");
require("dotenv").config();

exports.handler = async (event, context) => {
  try {
    const contentType = event.headers["content-type"] || "";
    const isMultipart = contentType.includes("multipart/form-data");

    if (!isMultipart) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid content type" }),
      };
    }

    const formData = new URLSearchParams(new URLSearchParams(event.body));
    const to = formData.get("to");
    const subject = formData.get("subject");
    const html = formData.get("html");
    const attachment = formData.get("attachment");

    if (!to || !subject || !html || !attachment) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required fields" }),
      };
    }

    // Send email via Resend API
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "noreply@cfishburn.dev",
        to: [to],
        subject,
        html,
        attachments: [
          {
            filename: "facility_detail.csv",
            content: attachment,
            contentType: "text/csv",
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Email sent successfully",
        data: response.data,
      }),
    };
  } catch (error) {
    console.error(
      "Error sending email:",
      error.response?.data || error.message
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send email" }),
    };
  }
};
