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
const CORS_ORIGINS_FROM_ENV = String(process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

/** En desarrollo siempre permitimos Vite local, aunque CORS_ORIGINS apunte a un túnel/prod. */
const LOCAL_DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

const CORS_ORIGINS =
  NODE_ENV === 'production'
    ? CORS_ORIGINS_FROM_ENV
    : [...new Set([...LOCAL_DEV_ORIGINS, ...CORS_ORIGINS_FROM_ENV])];

/** Cloudflare R2 (S3-compatible) — profile avatars only. All four required to enable. */
const R2_ACCOUNT_ID = String(process.env.R2_ACCOUNT_ID || '').trim();
const R2_ACCESS_KEY_ID = String(process.env.R2_ACCESS_KEY_ID || '').trim();
const R2_SECRET_ACCESS_KEY = String(process.env.R2_SECRET_ACCESS_KEY || '').trim();
const R2_BUCKET = String(process.env.R2_BUCKET || '').trim();
const R2_ENDPOINT = String(process.env.R2_ENDPOINT || '').trim()
  || (R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : '');

const isR2Configured = Boolean(
  R2_ACCOUNT_ID
  && R2_ACCESS_KEY_ID
  && R2_SECRET_ACCESS_KEY
  && R2_BUCKET,
);

const R2 = {
  accountId: R2_ACCOUNT_ID,
  accessKeyId: R2_ACCESS_KEY_ID,
  secretAccessKey: R2_SECRET_ACCESS_KEY,
  bucket: R2_BUCKET,
  endpoint: R2_ENDPOINT,
};

module.exports = {
  JWT_SECRET: JWT_SECRET || 'trainfit-dev-only-change-me',
  JWT_EXPIRES_IN,
  PORT,
  NODE_ENV,
  SMTP,
  APP_PUBLIC_URL,
  CORS_ORIGINS,
  R2,
  isR2Configured,
};
