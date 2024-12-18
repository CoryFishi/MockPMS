const axios = require("axios");
const weatherAPI = import.meta.env.VITE_RESEND_KEY;

exports.handler = async (event, context) => {
  try {
    const { to, subject, html } = JSON.parse(event.body);

    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "onboarding@cfishburn.dev",
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${weatherAPI}`,
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
