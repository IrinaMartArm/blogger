import dotenv from 'dotenv';
dotenv.config();

export const SETTINGS = {
  PORT: process.env.PORT || 5001,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017',
  DB_NAME: process.env.DB_NAME || 'lessons',
  EMAIL: process.env.MY_EMAIL,
  PASS: process.env.MY_PASS,
};
