import { GoogleGenAI, GenerateContentResponse, Part, Modality } from "@google/genai";
import { PROMPT_GENERATION_SYSTEM_INSTRUCTION } from '../constants';
import { structuredPromptToString, StructuredPrompt } from "../utils/promptUtils";

const getAiClient = (apiKey: string) => new GoogleGenAI({ apiKey });

export const generatePromptFromImage = async (apiKey: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAiClient(apiKey);
  
  const imagePart: Part = {
    inlineData: {
      mimeType: mimeType,
      data: imageBase64,
    },
  };

  const textPart: Part = {
    text: "Analyze this image and generate a structured prompt based on your system instructions."
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        systemInstruction: PROMPT_GENERATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      }
    });
    
    // Gracefully handle cases where the model returns no candidates (e.g., safety filters)
    if (!response.candidates || response.candidates.length === 0) {
        if (response.promptFeedback?.blockReason) {
            throw new Error(`Prompt generation was blocked: ${response.promptFeedback.blockReason}.`);
        }
        throw new Error("The model returned no content for prompt generation. This may be due to safety filters on the input image.");
    }

    let jsonText = response.text.trim();
    
    // The AI might still wrap the JSON in markdown, so we strip it.
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonText.match(fenceRegex);
    if (match && match[1]) {
      jsonText = match[1].trim();
    }

    // Now parse the JSON and convert it to a string.
    const structuredResult: StructuredPrompt = JSON.parse(jsonText);
    return structuredPromptToString(structuredResult);

  } catch (error) {
    console.error("Error in generatePromptFromImage:", error);
    if (error instanceof SyntaxError) { // Handle JSON parsing errors
        throw new Error("Failed to parse the prompt from the AI. The response was not valid JSON.");
    }
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            throw new Error("Invalid API Key. Please check your configuration.");
        }
        if (error.message.includes("quota")) {
            throw new Error("API quota exceeded. Please try again later.");
        }
        // Re-throw the original, more specific error
        throw error;
    }
    throw new Error("Failed to generate prompt from image. The model might be unavailable or an error occurred.");
  }
};

export const editImageWithPrompt = async (apiKey: string, prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
  const ai = getAiClient(apiKey);

  const imagePart: Part = {
    inlineData: {
      data: imageBase64,
      mimeType: mimeType,
    },
  };

  const textPart: Part = {
    text: prompt,
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: {
        parts: [imagePart, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback?.blockReason) {
        throw new Error(`Request was blocked: ${response.promptFeedback.blockReason}. Please adjust your prompt.`);
      }
      throw new Error("The model returned no content. This might be due to safety filters or an internal error.");
    }
    
    const candidate = response.candidates[0];

    if (!candidate.content?.parts?.length) {
      throw new Error("The model's response was empty or malformed.");
    }

    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const base64ImageBytes: string = part.inlineData.data;
        const outputMimeType = part.inlineData.mimeType;
        return `data:${outputMimeType};base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("No image was returned in the response. The model may have only returned text.");

  } catch (error) {
    console.error("Error in editImageWithPrompt:", error);
     if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
            throw new Error("Invalid API Key. Please check your configuration.");
        }
         if (error.message.includes("quota")) {
            throw new Error("API quota exceeded. Please try again later.");
        }
        // Re-throw the original, more specific error
        throw error;
    }
    // Fallback for non-Error objects being thrown.
    throw new Error("An unknown error occurred while editing the image.");
  }
};