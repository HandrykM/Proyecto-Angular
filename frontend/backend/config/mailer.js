// config/mailer.js

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // o 'smtp.gmail.com'
  port: process.env.SMTP_PORT, // o 587
  secure: process.env.SMTP_SECURE === 'true', // o false
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

module.exports = transporter;