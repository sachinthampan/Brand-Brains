
import { GoogleGenAI, Type } from "@google/genai";
import { MediaType, PostContent, UserNiche } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

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
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `High quality, aesthetic social media post image. Style: Modern, Professional. Subject: ${prompt}` }]
      },
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error: any) {
    console.error("Image generation error:", error);
    throw new Error("Failed to generate image. Please check your API configuration.");
  }
};

export const generatePostVideo = async (prompt: string): Promise<string> => {
  const ai = getAI();
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
    console.error("Video generation error:", error);
    throw new Error("Failed to generate video. Please check your API configuration.");
  }
};
