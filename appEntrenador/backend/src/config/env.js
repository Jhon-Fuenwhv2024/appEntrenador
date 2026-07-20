require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const PORT = Number(process.env.PORT) || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET) {
  if (NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción.');
  }

  console.warn(
    '[auth] JWT_SECRET no definido; usando secreto de desarrollo. Configura backend/.env antes de producción.',
  );
}

function parseBool(value, fallback = false) {
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const SMTP = {
  host: process.env.SMTP_HOST || '',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: parseBool(process.env.SMTP_SECURE, false),
  user: process.env.SMTP_USER || '',
  pass: process.env.SMTP_PASS || '',
  from: process.env.SMTP_FROM || 'Trainfit <noreply@trainfit.local>',
};

const APP_PUBLIC_URL = (process.env.APP_PUBLIC_URL || 'http://localhost:5173').replace(
  /\/$/,
  '',
);

/** Comma-separated frontend origins for CORS (e.g. https://entrenadorfit.xxx.workers.dev). */
const CORS_ORIGINS = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = {
  JWT_SECRET: JWT_SECRET || 'trainfit-dev-only-change-me',
  JWT_EXPIRES_IN,
  PORT,
  NODE_ENV,
  SMTP,
  APP_PUBLIC_URL,
  CORS_ORIGINS,
};
