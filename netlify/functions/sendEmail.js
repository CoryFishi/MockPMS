const axios = require("axios");
require("dotenv").config();

exports.handler = async (event, context) => {
  try {
    const { to, subject, html, attachment } = JSON.parse(event.body);
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "noreply@cfishburn.dev",
        to: [to],
        subject,
        html,
        attachments: [attachment],
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
