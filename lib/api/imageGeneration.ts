export type ImageGenerationInput = {
  prompt: string;
  productName?: string;
  platform?: string;
  market?: string;
  imageType?: string;
  style?: string;
  size?: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality?: "low" | "medium" | "high" | "auto";
  background?: "auto" | "opaque" | "transparent";
};

export type GeneratedImage = {
  b64Json?: string;
  url?: string;
  revisedPrompt?: string;
  mimeType: string;
};

type ImageGenerationResponse = {
  ok: boolean;
  ai?: boolean;
  model?: string;
  image?: GeneratedImage;
  message?: string;
};

export async function generateImageWithAi(
  input: ImageGenerationInput
): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch("/api/ai/image-generation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const body = (await response.json()) as ImageGenerationResponse;
    return body;
  } catch {
    return { ok: false, message: "Image generation request failed." };
  }
}
