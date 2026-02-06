
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Suggests a library category based on the book title using Gemini 3 Flash.
 */
export const suggestBookCategory = async (title: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a single-word library category for a book titled "${title}". Return only the category name (e.g., History, Poetry, Fiction, Science, Biography).`,
      config: { temperature: 0.5 },
    });
    return response.text?.trim() || "General";
  } catch (error) {
    console.error("Gemini Category Suggestion Error:", error);
    return "General";
  }
};
