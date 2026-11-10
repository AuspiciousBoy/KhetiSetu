const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT || '5000', 10);
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/khetisetu';

const crypto = require('crypto');

// Generate ephemeral random key in development if not provided in environment
const generateDevSecret = () => crypto.randomBytes(32).toString('hex');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || (NODE_ENV !== 'production' ? generateDevSecret() : '');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (NODE_ENV !== 'production' ? generateDevSecret() : '');
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const WEATHER_API_KEY = process.env.WEATHER_API_KEY || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

// Fail fast in production if security secrets are missing or default
if (NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET.length < 32) {
    missing.push('JWT_ACCESS_SECRET (min 32 chars)');
  }
  if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
    missing.push('JWT_REFRESH_SECRET (min 32 chars)');
  }
  if (!process.env.MONGO_URI) {
    missing.push('MONGO_URI');
  }
  if (missing.length > 0) {
    throw new Error(`[CRITICAL SECURITY CONFIGURATION ERROR] Missing required production environment variables: ${missing.join(', ')}`);
  }
}

module.exports = {
  NODE_ENV,
  PORT,
  MONGO_URI,
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRY,
  JWT_REFRESH_EXPIRY,
  GEMINI_API_KEY,
  WEATHER_API_KEY,
  FRONTEND_URL,
  CORS_ORIGINS,
  UPLOAD_DIR,
  LOG_LEVEL,
  isProd: NODE_ENV === 'production',
  isDev: NODE_ENV === 'development',
  isTest: NODE_ENV === 'test',
};
