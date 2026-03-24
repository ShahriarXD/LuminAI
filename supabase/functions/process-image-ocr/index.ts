import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

type OCRQuestionOption = { label: string; text: string };
type OCRQuestion = { number: string; text: string; options?: OCRQuestionOption[] };
type OCRSection = { heading: string; body?: string; questions: OCRQuestion[] };
type OCRResult = {
  fileName: string;
  mimeType: string;
  documentType: "question_paper" | "worksheet" | "general_document" | "unknown";
  title?: string | null;
  extractedText: string;
  markdown: string;
  sections: OCRSection[];
  questions: OCRQuestion[];
};

function getBase64Size(dataUrl: string) {
  const base64 = dataUrl.split(",")[1] || "";
  return Math.ceil((base64.length * 3) / 4);
}

function extractJsonObject(input: string) {
  const fenced = input.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fenced) return fenced.trim();

  const first = input.indexOf("{");
  const last = input.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) return input.trim();
  return input.slice(first, last + 1).trim();
}

function normalizeResult(fileName: string, mimeType: string, payload: any): OCRResult {
  const extractedText = String(payload?.extracted_text || payload?.extractedText || "").trim();
  const markdown = String(payload?.markdown || "").trim();
  const questions = Array.isArray(payload?.questions)
    ? payload.questions
        .filter((question: any) => question?.number && question?.text)
        .map((question: any) => ({
          number: String(question.number).trim(),
          text: String(question.text).trim(),
          options: Array.isArray(question.options)
            ? question.options
                .filter((option: any) => option?.label && option?.text)
                .map((option: any) => ({
                  label: String(option.label).trim(),
                  text: String(option.text).trim(),
                }))
            : [],
        }))
    : [];

  const sections = Array.isArray(payload?.sections)
    ? payload.sections
        .filter((section: any) => section?.heading)
        .map((section: any) => ({
          heading: String(section.heading).trim(),
          body: section.body ? String(section.body).trim() : undefined,
          questions: Array.isArray(section.questions)
            ? section.questions
                .filter((question: any) => question?.number && question?.text)
                .map((question: any) => ({
                  number: String(question.number).trim(),
                  text: String(question.text).trim(),
                  options: Array.isArray(question.options)
                    ? question.options
                        .filter((option: any) => option?.label && option?.text)
                        .map((option: any) => ({
                          label: String(option.label).trim(),
                          text: String(option.text).trim(),
                        }))
                    : [],
                }))
            : [],
        }))
    : [];

  return {
    fileName,
    mimeType,
    documentType: payload?.document_type === "question_paper" || questions.length > 0
      ? "question_paper"
      : payload?.document_type === "worksheet"
      ? "worksheet"
      : payload?.document_type === "general_document"
      ? "general_document"
      : "unknown",
    title: payload?.title ? String(payload.title).trim() : null,
    extractedText,
    markdown,
    sections,
    questions,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageDataUrl, fileName, mimeType } = await req.json();

    if (!imageDataUrl || !fileName || !mimeType) {
      return new Response(JSON.stringify({ error: "Image payload is incomplete." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!ALLOWED_TYPES.has(mimeType)) {
      return new Response(JSON.stringify({ error: "Unsupported image type." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (getBase64Size(String(imageDataUrl)) > MAX_IMAGE_SIZE_BYTES) {
      return new Response(JSON.stringify({ error: "Image is too large. Please upload one smaller than 8 MB." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) throw new Error("GROQ_API_KEY is not configured");

    const prompt = [
      "Read this image carefully.",
      "Extract all visible text exactly as written.",
      "Preserve question numbers, headings, section labels, and formatting as much as possible.",
      "Do not solve the paper unless the user asks later.",
      "If this is a question paper or worksheet, identify question numbers, section headings, and multiple choice options.",
      "Return only valid JSON with this shape:",
      `{
  "document_type": "question_paper" | "worksheet" | "general_document" | "unknown",
  "title": string | null,
  "extracted_text": string,
  "sections": [{ "heading": string, "body": string, "questions": [{ "number": string, "text": string, "options": [{ "label": string, "text": string }] }] }],
  "questions": [{ "number": string, "text": string, "options": [{ "label": string, "text": string }] }],
  "markdown": string,
  "unreadable_reason": string | null
}`,
      "If the image is unreadable, keep extracted_text empty and explain why in unreadable_reason.",
    ].join("\n");

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content: "You are an OCR and document-structure extraction assistant for scanned question papers and image documents.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    const raw = await response.text();

    if (!response.ok) {
      console.error("process-image-ocr Groq error:", response.status, raw);
      return new Response(JSON.stringify({ error: "Groq OCR request failed. Please try again." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(raw);
    const content = payload?.choices?.[0]?.message?.content;
    const jsonText = typeof content === "string" ? extractJsonObject(content) : "";

    if (!jsonText) {
      return new Response(JSON.stringify({ error: "The image could not be read clearly. Please upload a sharper image." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const modelResult = JSON.parse(jsonText);
    const normalized = normalizeResult(fileName, mimeType, modelResult);

    if (!normalized.extractedText) {
      return new Response(
        JSON.stringify({
          error:
            modelResult?.unreadable_reason ||
            "The image looks unreadable. Please try another photo or scan.",
        }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ result: normalized }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("process-image-ocr error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
