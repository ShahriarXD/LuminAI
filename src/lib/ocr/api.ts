import { supabase } from "@/integrations/supabase/client";
import type { OCRImageAttachment, OCRPayload, OCRResponse } from "./types";
import { validateOcrImage } from "./validation";

async function fileToDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export async function processImageOCR(attachment: OCRImageAttachment) {
  const validationError = validateOcrImage(attachment.file);
  if (validationError) throw new Error(validationError);

  const imageDataUrl = await fileToDataUrl(attachment.file);
  const payload: OCRPayload = {
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    imageDataUrl,
  };

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let accessToken = session?.access_token;
  if (session?.expires_at && session.expires_at * 1000 <= Date.now() + 30_000) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    accessToken = refreshed.session?.access_token ?? accessToken;
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-image-ocr`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({ error: "Failed to process image" }));

  if (!response.ok) {
    throw new Error(data.error || "Failed to process image");
  }

  return data as OCRResponse;
}
