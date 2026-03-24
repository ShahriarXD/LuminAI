import type { OCRResult } from "./types";

function renderQuestions(result: OCRResult) {
  if (result.questions.length === 0) return "";

  return result.questions
    .map((question) => {
      const options = (question.options || [])
        .map((option) => `  - ${option.label}. ${option.text}`)
        .join("\n");

      return [`${question.number}. ${question.text}`, options].filter(Boolean).join("\n");
    })
    .join("\n\n");
}

export function formatOcrResultMarkdown(result: OCRResult) {
  const blocks = [
    `### Extracted from image`,
    result.title ? `**${result.title}**` : "",
    result.documentType === "question_paper" || result.questions.length > 0
      ? `Question paper detected with ${result.questions.length} question${result.questions.length === 1 ? "" : "s"}.`
      : "",
    "#### Extracted Text",
    result.extractedText,
  ].filter(Boolean);

  const questionBlock = renderQuestions(result);

  if (questionBlock) {
    blocks.push("#### Question List", questionBlock);
  }

  return blocks.join("\n\n").trim();
}
