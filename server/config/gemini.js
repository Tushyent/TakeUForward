import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

let genAI = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

export const getGeminiModel = () => {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is missing from environment variables');
  }
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};
