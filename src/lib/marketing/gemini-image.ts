import { GoogleGenAI, Modality } from "@google/genai";

export class GeminiImageError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GeminiImageError";
  }
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function imageModel() {
  return process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image";
}

export async function editProductImage(input: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}): Promise<{ buffer: Buffer; contentType: string }> {
  if (!isGeminiConfigured()) {
    throw new GeminiImageError("Gemini image API is not configured (GEMINI_API_KEY)", 503);
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  let response;
  try {
    response = await ai.models.generateContent({
      model: imageModel(),
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: input.mimeType,
                data: input.imageBase64,
              },
            },
            { text: input.prompt },
          ],
        },
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gemini request failed";
    throw new GeminiImageError(message, 502);
  }

  const parts = response.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    if (part.inlineData?.data) {
      const mime = part.inlineData.mimeType || "image/png";
      const contentType =
        mime === "image/jpeg" || mime === "image/png" || mime === "image/webp"
          ? mime
          : "image/png";
      return {
        buffer: Buffer.from(part.inlineData.data, "base64"),
        contentType,
      };
    }
  }

  throw new GeminiImageError("Gemini returned no image", 502);
}
