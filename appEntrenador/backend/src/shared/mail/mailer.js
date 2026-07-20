const nodemailer = require('nodemailer');
const { SMTP } = require('../../config/env');

let transporter = null;

function isSmtpConfigured() {
  return Boolean(SMTP.host && SMTP.user && SMTP.pass);
}

function getTransporter() {
  if (!isSmtpConfigured()) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP.host,
      port: SMTP.port,
      secure: SMTP.secure,
      auth: {
        user: SMTP.user,
        pass: SMTP.pass,
      },
    });
  }

  return transporter;
}

/**
 * Nodemailer/Resend often puts the useful message in response / responseCode.
 * @param {unknown} error
 */
function formatMailError(error) {
  if (!error || typeof error !== 'object') {
    return String(error || 'Error de correo desconocido');
  }

  const err = /** @type {{ code?: string, message?: string, response?: string, responseCode?: number }} */ (
    error
  );
  const parts = [];
  if (err.code) parts.push(String(err.code));
  if (err.responseCode) parts.push(`http=${err.responseCode}`);
  if (err.response) parts.push(String(err.response).trim());
  else if (err.message) parts.push(err.message);
  return parts.join(' | ') || 'Error de correo desconocido';
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} options
 */
async function sendMail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    const error = new Error('SMTP no configurado (SMTP_HOST / SMTP_USER / SMTP_PASS).');
    error.code = 'SMTP_NOT_CONFIGURED';
    throw error;
  }

  try {
    return await transport.sendMail({
      from: SMTP.from,
      to,
      subject,
      text,
      html: html || text,
    });
  } catch (error) {
    const wrapped = new Error(formatMailError(error));
    wrapped.code = error?.code || 'MAIL_SEND_FAILED';
    wrapped.cause = error;
    throw wrapped;
  }
}

module.exports = {
  isSmtpConfigured,
  sendMail,
  formatMailError,
};
