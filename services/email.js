const axios = require('axios');


const sendEmail = async (data) => {
  // Map the provided data to the required fields
  const payload = {
    to: data.email,
    subject: data.subject,
    html: data.html
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