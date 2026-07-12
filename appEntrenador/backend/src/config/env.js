require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const PORT = Number(process.env.PORT) || 3000;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET es obligatorio en producción.');
  }

  console.warn(
    '[auth] JWT_SECRET no definido; usando secreto de desarrollo. Configura backend/.env antes de producción.',
  );
}

module.exports = {
  JWT_SECRET: JWT_SECRET || 'trainfit-dev-only-change-me',
  JWT_EXPIRES_IN,
  PORT,
};
