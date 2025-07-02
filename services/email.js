const axios = require('axios');


// Function to generate the signup confirmation HTML for Chessatmarlima
const generateSignupTemplate = (userName) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Chessatmarlima</title>
  <style>
    body {
      font-family: 'Segoe UI', sans-serif;
      background-color: #f4f4f4;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      background-color: #ffffff;
      margin: 30px auto;
      padding: 20px 30px;
      border-radius: 10px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
    }
    .highlight {
      color: #1d3557;
      font-weight: bold;
    }
    .footer {
      font-size: 12px;
      color: #888;
      margin-top: 30px;
      text-align: center;
    }
    a.button {
      display: inline-block;
      padding: 10px 20px;
      background-color: #1d3557;
      color: #fff;
      text-decoration: none;
      border-radius: 6px;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>♟️ Welcome to Chessatmarlima!</h2>
    </div>
    <p>Hi <span class="highlight">${userName}</span>,</p>
    <p>Congratulations on signing up for our chess competition! We’re thrilled to have you join us.</p>
    <p>Get ready to challenge your mind and connect with fellow chess enthusiasts.</p>
    <a href="https://chessatmarlima.online/participants" class="button">View Competitions</a>
    <div class="footer">
      Powered by Chessatmarlima · Unleash Your Inner Grandmaster ♛
    </div>
  </div>
</body>
</html>`;


const sendEmail = async (data) => {
  // Map the provided data to the required fields
  const payload = {
    to: data.email,
    subject: data.subject || 'Welcome to Chessatmarlima!',
    html: generateSignupTemplate(data.userName)
  };
  try {
    const response = await axios.post('https://service-8wma.onrender.com/api/email', payload);
    console.log("request", payload);
    return response.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};


module.exports = {
  sendEmail
};