import { OCR_IMAGE_MIME_TYPES, OCR_MAX_IMAGE_SIZE_BYTES } from "./types";

export function validateOcrImage(file: File): string | null {
  if (!OCR_IMAGE_MIME_TYPES.includes(file.type as (typeof OCR_IMAGE_MIME_TYPES)[number])) {
    return "Unsupported image type. Please upload a PNG, JPG, JPEG, or WEBP file.";
  }

  if (file.size > OCR_MAX_IMAGE_SIZE_BYTES) {
    return "Image is too large. Please upload an image smaller than 8 MB.";
  }

  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
