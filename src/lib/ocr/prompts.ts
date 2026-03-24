import type { OCRQuickAction, OCRResult } from "./types";

export function buildOcrQuickActions(result: OCRResult): OCRQuickAction[] {
  const firstQuestionNumber = result.questions[0]?.number || "1";

  return [
    {
      id: "extract-questions",
      label: "Extract Questions",
      prompt: "Using the extracted text from the uploaded image in this chat, list all questions cleanly in order without solving them.",
    },
    {
      id: "solve-all",
      label: "Solve All",
      prompt: "Using the extracted question paper in this chat, solve all questions clearly and organize the answers by question number.",
    },
    {
      id: "solve-first",
      label: `Solve Question ${firstQuestionNumber}`,
      prompt: `Using the extracted question paper in this chat, solve question ${firstQuestionNumber} step by step.`,
    },
    {
      id: "answer-key",
      label: "Make Answer Key",
      prompt: "Using the extracted question paper in this chat, create a concise answer key for all questions.",
    },
    {
      id: "markdown",
      label: "Convert to Markdown",
      prompt: "Using the extracted question paper in this chat, convert it into clean Markdown with headings, numbered questions, and bullet lists where appropriate.",
    },
    {
      id: "summarize",
      label: "Summarize Paper",
      prompt: "Using the extracted question paper in this chat, summarize the paper structure, topics covered, and key instructions.",
    },
  ];
}
