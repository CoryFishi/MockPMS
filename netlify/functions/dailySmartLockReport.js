const axios = require("axios");
const { supabaseAdmin } = require("../supabaseClient"); // Use require for consistency

async function getUsers() {
  const { data, error } = await supabaseAdmin.from("user_data").select("*");

  if (error) {
    console.error("Error fetching users:", error);
    throw error; // Explicitly throw to handle errors in the handler
  }

  return data;
}

exports.handler = async (event, context) => {
  try {
    // Fetch users
    const users = await getUsers();
    console.log("Fetched users:", users);

    // Uncomment to send an email
    /*
    const { to, subject, html } = JSON.parse(event.body);
    const response = await axios.post(
      "https://api.resend.com/emails",
      {
        from: "noreply@cfishburn.dev",
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Email sent successfully:", response.data);
    */

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
