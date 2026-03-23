interface ChatMessage {
  role: string;
  content: string;
}

export function exportAsMarkdown(title: string, messages: ChatMessage[]): void {
  let md = `# ${title}\n\n`;
  messages.forEach((msg) => {
    md += `**${msg.role === "user" ? "You" : "Assistant"}:**\n\n${msg.content}\n\n---\n\n`;
  });
  downloadFile(md, `${sanitize(title)}.md`, "text/markdown");
}

export function exportAsPdf(title: string, messages: ChatMessage[]): void {
  // Build a styled HTML doc and use print to PDF
  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 40px auto; padding: 0 20px; color: #1a1a2e; }
    h1 { font-size: 24px; border-bottom: 2px solid #e8e8f0; padding-bottom: 12px; }
    .msg { margin: 16px 0; padding: 12px 16px; border-radius: 12px; }
    .user { background: #f0e6f6; }
    .assistant { background: #f5f5fa; }
    .role { font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 6px; }
    .content { white-space: pre-wrap; line-height: 1.6; font-size: 14px; }
    hr { border: none; border-top: 1px solid #e8e8f0; margin: 20px 0; }
  </style></head><body>
  <h1>${title}</h1>`;
  messages.forEach((msg) => {
    html += `<div class="msg ${msg.role}"><div class="role">${msg.role === "user" ? "You" : "Assistant"}</div><div class="content">${escapeHtml(msg.content)}</div></div>`;
  });
  html += `</body></html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
  }
}

function sanitize(s: string): string {
  return s.replace(/[^a-zA-Z0-9 -]/g, "").replace(/\s+/g, "_").slice(0, 50);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

function downloadFile(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
