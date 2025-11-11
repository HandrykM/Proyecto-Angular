// backend/config/mailer.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Envía un correo electrónico
 */
async function sendMail({ to, subject, html }) {
  try {
    const from = process.env.EMAIL_FROM || 'HydroSave <hydrosave05@gmail.com>';

    await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    console.log(`✅ Email enviado a ${to}`);
  } catch (error) {
    console.error('❌ Error al enviar correo:', error);
    throw error;
  }
}

module.exports = { sendMail };
