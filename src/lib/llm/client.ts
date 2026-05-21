import { GoogleGenAI } from "@google/genai";

let _client: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI => {
  if (_client) return _client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set. Add it to your .env file.");
  }

  _client = new GoogleGenAI({ apiKey });
  return _client;
};

export const GEMINI_MODEL = "gemini-2.5-flash";
