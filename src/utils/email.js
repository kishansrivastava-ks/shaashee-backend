// src/utils/email.js
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * sendEmail
 * @param {Object} params
 * @param {string | string[]} params.to
 * @param {string} params.subject
 * @param {string} [params.html]
 * @param {string} [params.text]
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to, // can be string or array
    subject,
    html,
    text,
  });

  if (error) {
    console.error("Resend sendEmail error:", error);
    throw new Error("Email send failed");
  }

  return data;
};

module.exports = sendEmail;
