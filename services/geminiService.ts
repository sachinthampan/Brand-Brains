
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, PostContent, UserNiche } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

/**
 * Ensures a valid API key is selected via the AI Studio dialog.
 * This is required for high-tier models like gemini-3-pro and Veo.
 */
const ensureApiKey = async () => {
  if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
    await window.aistudio.openSelectKey();
    // Guideline: Assume successful after trigger
    return true;
  }
  return true;
};

export const generatePostDrafts = async (niche: UserNiche): Promise<Partial<PostContent>[]> => {
  const ai = getAI();
  const prompt = `Generate 5 creative social media post drafts for a brand in the "${niche.name}" niche. 
  Target Audience: ${niche.targetAudience}. 
  Tone: ${niche.tone}. 
  Provide variety in topics and suggest whether it should be an image or a video.
  Return the response in valid JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            caption: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } },
            mediaType: { type: Type.STRING, description: "IMAGE, VIDEO, or TEXT_ONLY" },
          },
          required: ["topic", "caption", "hashtags", "mediaType"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
};

export const generatePostImage = async (prompt: string): Promise<string> => {
  // Use gemini-3-pro-image-preview for high quality and to ensure key-based access
  await ensureApiKey();
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `High quality, aesthetic social media post image. Style: Modern, Professional. Subject: ${prompt}` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1", imageSize: "1K" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error: any) {
    if (error.message?.includes("permission") || error.message?.includes("403")) {
      await window.aistudio?.openSelectKey();
      throw new Error("Please select a valid paid API key to generate images.");
    }
    throw error;
  }
};

export const generatePostVideo = async (prompt: string): Promise<string> => {
  await ensureApiKey();

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic professional social media short: ${prompt}`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error: any) {
    if (error.message?.includes("permission") || error.message?.includes("403")) {
      await window.aistudio?.openSelectKey();
      throw new Error("Please select a valid paid API key for video generation.");
    }
    throw error;
  }
};
