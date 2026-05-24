import { GoogleGenAI } from "@google/genai";
import { handleGeminiError } from "../lib/geminiErrors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateThumbnailImage(prompt: string, size: '1K' | '2K' | '4K' = '1K'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio: "16:9"
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (!part?.inlineData?.data) {
      throw new Error("No image data generated");
    }

    return `data:image/png;base64,${part.inlineData.data}`;
  } catch (error) {
    handleGeminiError(error);
  }
}
