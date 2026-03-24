export const OCR_IMAGE_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;

export const OCR_IMAGE_ACCEPT = OCR_IMAGE_MIME_TYPES.join(",");
export const OCR_MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

export type OCRDocumentType = "question_paper" | "worksheet" | "general_document" | "unknown";

export interface OCRQuestionOption {
  label: string;
  text: string;
}

export interface OCRQuestion {
  number: string;
  text: string;
  options?: OCRQuestionOption[];
}

export interface OCRSection {
  heading: string;
  body?: string;
  questions: OCRQuestion[];
}

export interface OCRResult {
  fileName: string;
  mimeType: string;
  documentType: OCRDocumentType;
  title?: string | null;
  extractedText: string;
  markdown: string;
  sections: OCRSection[];
  questions: OCRQuestion[];
}

export interface OCRQuickAction {
  id: string;
  label: string;
  prompt: string;
}

export interface OCRPayload {
  fileName: string;
  mimeType: string;
  imageDataUrl: string;
}

export interface OCRResponse {
  result: OCRResult;
}

export interface OCRImageAttachment {
  file: File;
  previewUrl: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export type ChatMessageMetadata =
  | {
      kind: "user_image_upload";
      fileName: string;
      mimeType: string;
      size: number;
    }
  | {
      kind: "ocr_processing";
      fileName: string;
      label: string;
    }
  | {
      kind: "ocr_error";
      fileName?: string;
      reason: string;
    }
  | {
      kind: "ocr_result";
      fileName: string;
      documentType: OCRDocumentType;
      title?: string | null;
      questionCount: number;
      quickActions: OCRQuickAction[];
    };
