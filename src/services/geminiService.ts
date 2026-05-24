import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import { ViralAnalysis, RemakeOutput, Project } from "../types";
import { handleGeminiError } from "../lib/geminiErrors";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    hook: { type: Type.STRING, description: "Detailed description of the first 3 seconds hook" },
    structure: { type: Type.STRING, description: "Breakdown of the video's content structure" },
    tempo: { type: Type.STRING, description: "Description of the editing tempo and pacing" },
    cta: { type: Type.STRING, description: "The specific call to action identified" },
    viralPoints: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "List of key reasons why this video is viral" 
    },
    keyTimestamps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING, description: "Timestamp (e.g. 0:03)" },
          label: { type: Type.STRING, description: "Short label for the moment" },
          visualConcept: { type: Type.STRING, description: "Detailed English prompt for AI image generation of this frame" }
        },
        required: ["time", "label", "visualConcept"]
      }
    },
    scenario: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          time: { type: Type.STRING, description: "Timestamp" },
          description: { type: Type.STRING, description: "Action/Scenario description in Korean" },
          visualConcept: { type: Type.STRING, description: "Detailed English prompt for AI image generation of this scene" }
        },
        required: ["time", "description", "visualConcept"]
      }
    }
  },
  required: ["hook", "structure", "tempo", "cta", "viralPoints"]
};

export async function analyzeVideoLink(link: string): Promise<ViralAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `You are a World-Class Viral Video Architect and Social Media Psychologist. 
            Deeply analyze this Instagram/Viral video link: ${link}. 
            
            Focus on:
            1. The "Invisible Hook": What psychological trigger is pulled in the first 1.5 seconds? (Visual, Audio, or Textual)
            2. Retention Engineering: How does the video maintain interest? Identify "Value Gaps" or "Pattern Interrupts".
            3. Aesthetic DNA: Analyze color grading, typography style, and sound design.
            4. Viral Alchemy: Why did this go viral? Identify 5 specific "Unfair Advantages" of this content.
            5. Structural Blueprint: Provide precise timestamps for every major scene change.
            6. Scenario/Storyboard: Break down the video into 4-6 key scenes. For each scene, provide a Korean description and a detailed English visual prompt that describes the scene's composition, lighting, and action for image generation.
            
            Provide a sophisticated, professional analysis in JSON format.`
          }]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    return JSON.parse(response.text) as ViralAnalysis;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function analyzeVideoFile(fileBase64: string, mimeType: string): Promise<ViralAnalysis> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType
              }
            },
            {
              text: `Acting as a Senior Viral Strategist, perform a frame-by-frame deep dive into this video.
              
              Analyze the following with surgical precision:
              1. Opening Hook: Exactly what happens in the first 3 seconds that forces a stop-scroll?
              2. Internal Rhythm: Map out the cut-frequency and how it matches the audio beat.
              3. Conversion Mechanics: How is the Call-to-Action integrated? Is it a "Soft Sell" or "Hard Sell"?
              4. Emotional Arc: What specific emotion is the viewer supposed to feel at each stage?
              5. Viral Points: List high-level strategies used (e.g., "Oddly Satisfying", "Relatability", "Knowledge Gap").
              6. Detailed Timestamps: List every 3-5 second interval and its function.
              7. Scenario/Storyboard: Breakdown 4-6 key frames with Korean descriptions and English visual prompts for AI imagery.

              Deliver the insights in a structured JSON output.`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
      }
    });

    return JSON.parse(response.text) as ViralAnalysis;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function generateRemakeStrategy(
  analysis: ViralAnalysis, 
  targetTone: string = "friendly",
  userContext: string = ""
): Promise<RemakeOutput> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on this viral analysis: ${JSON.stringify(analysis)}
      Generate a remake strategy for the Korean market.
      Target Tone: ${targetTone}
      User Context: ${userContext}
      
      Include:
      1. Korean Narration: Natural, viral-oriented Korean script using current social media slang and friendly/engaging tone. Break into logical segments with timing hints.
      2. Shooting Angles/Guide (Array of objects with label 'type' and 'description'):
         - Focus on "K-style" aesthetics: high-quality close-ups, aesthetic transitions (wipe, zoom), POV shots, and soft lighting.
         - Descriptions MUST be specific and actionable (e.g., "45-degree high angle for the hook," "Extreme close-up with ASMR sound focus").
         - Emphasize visual variety to maintain high retention.
      3. Edit Format: Specify transition speed, text overlay placement (safe zones), and recommended background music genre.
      4. Predicted Viral Score (0-100) based on current Korean trends.
      5. Practical Tips: Specific tricks like "Include breath sounds in the first 0.5s" or "Use specific trending fonts".
      6. Remake Scenario: 4-6 key scenes for the remake, each with a Korean description and an English visual concept prompt for AI image generation.
      Format the response as JSON.`,
      config: {
        responseMimeType: "application/json",
      }
    });

    return JSON.parse(response.text) as RemakeOutput;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function chatWithVideo(
  message: string, 
  history: { role: string; parts: string }[], 
  project: Project,
  remake?: RemakeOutput
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [{
            text: `System: You are ViralCraft AI Assistant. You are helping a creator remake a viral video. 
            Original Video Link: ${project.originalLink}
            Original Analysis: ${JSON.stringify(project.originalAnalysis)}
            Current Remake Strategy: ${JSON.stringify(remake)}
            
            Previous Conversation: ${JSON.stringify(history)}
            
            User Message: ${message}
            
            Provide helpful, professional, and creative advice in Korean. Use your tools if needed to find external context about trends.`
          }]
        }
      ],
      config: {
      }
    });

    return response.text;
  } catch (error) {
    handleGeminiError(error);
  }
}

export async function generateThumbnailPrompt(remake: RemakeOutput): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a high-quality image generation prompt for a viral video thumbnail based on this remake strategy: ${JSON.stringify(remake)}.
      The prompt should be in English and focused on creating a clickable, vibrant YouTube/Instagram thumbnail.`,
    });
    return response.text.trim();
  } catch (error) {
    handleGeminiError(error);
  }
}
