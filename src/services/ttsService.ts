import { GoogleGenAI, Modality } from "@google/genai";
import { handleGeminiError } from "../lib/geminiErrors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateSpeech(text: string, voiceName: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore'): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data generated");
    }

    return base64Audio;
  } catch (error) {
    handleGeminiError(error);
  }
}

export function playAudioFromBase64(base64: string, sampleRate: number = 24000) {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  
  // The TTS model returns raw PCM (16-bit little-endian)
  const arrayBuffer = bytes.buffer;
  const dataView = new DataView(arrayBuffer);
  const numSamples = dataView.byteLength / 2;
  const audioBuffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const channelData = audioBuffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    // Convert 16-bit signed integer to float (-1.0 to 1.0)
    channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
  }

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}
