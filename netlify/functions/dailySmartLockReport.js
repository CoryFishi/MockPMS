const axios = require("axios");

exports.handler = async (event, context) => {
  try {
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "noreply@cfishburn.dev",
        to: "coryjr2002@gmail.com",
        subject: "Test email",
        html: <p>Hello</p>,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Email sent successfully:", response.data);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Operation completed successfully",
        users,
      }),
    };
  } catch (error) {
    console.error("Error in function:", error.message || error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to complete operation" }),
    };
  }
};
