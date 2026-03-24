import { motion } from "framer-motion";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageActions } from "./MessageActions";
import { OCRQuickActions } from "./OCRQuickActions";
import { SpeakButton } from "@/components/SpeakButton";
import { SourceCitations } from "@/components/SourceCitations";
import type { SourceCitation } from "@/lib/chat-api";
import type { ChatMessageMetadata } from "@/lib/ocr/types";
import { Image as ImageIcon, Loader2, FileText } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  metadata?: ChatMessageMetadata | null;
  index: number;
  isMobile: boolean;
  ttsSupported?: boolean;
  isSpeaking?: boolean;
  isPaused?: boolean;
  onSpeak?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
  onRegenerate?: () => void;
  onQuickAction?: (prompt: string) => void;
  quickActionsDisabled?: boolean;
}

export const ChatMessage = ({
  role, content, sources, metadata, index, isMobile,
  ttsSupported, isSpeaking, isPaused,
  onSpeak, onPause, onResume, onStop,
  onRegenerate,
  onQuickAction,
  quickActionsDisabled,
}: ChatMessageProps) => {
  if (role === "user") {
    return (
      <motion.div
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: index === 0 ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
        className="flex justify-end group"
      >
        <div className={`flex flex-col ${isMobile ? "max-w-[90%]" : "max-w-[75%]"}`}>
          <div className="rounded-[1.35rem] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap gradient-send text-primary-foreground shadow-glow">
            {metadata?.kind === "user_image_upload" && (
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
                <ImageIcon className="h-3.5 w-3.5" />
                <span className="truncate">{metadata.fileName}</span>
              </div>
            )}
            {content}
          </div>
          <div className="flex justify-end">
            <MessageActions content={content} role="user" />
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: index === 0 ? 0.15 : 0, ease: [0.16, 1, 0.3, 1] }}
      className="flex justify-start group"
    >
      <div className={`flex flex-col ${isMobile ? "max-w-[95%]" : "max-w-[85%]"}`}>
        <div className="surface-subtle rounded-[1.35rem] px-4 py-3 text-foreground">
          {metadata?.kind === "ocr_processing" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{metadata.label}</span>
            </div>
          ) : (
            <>
              {metadata?.kind === "ocr_result" && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="surface-chip px-2.5 py-1 text-[11px] font-medium text-primary">
                    Extracted from image
                  </span>
                  {(metadata.documentType === "question_paper" || metadata.questionCount > 0) && (
                    <span className="surface-chip px-2.5 py-1 text-[11px] font-medium text-accent">
                      Question paper detected
                    </span>
                  )}
                  <span className="surface-chip px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                    <FileText className="mr-1 inline h-3 w-3" />
                    {metadata.fileName}
                  </span>
                </div>
              )}
              {content && <MarkdownRenderer content={content} />}
              {metadata?.kind === "ocr_result" && onQuickAction && metadata.quickActions.length > 0 && (
                <OCRQuickActions
                  actions={metadata.quickActions}
                  disabled={quickActionsDisabled}
                  onSelect={onQuickAction}
                />
              )}
            </>
          )}
        </div>
        {sources && sources.length > 0 && <SourceCitations sources={sources} />}
        <div className="flex items-center gap-1">
          <MessageActions content={content} role="assistant" onRegenerate={onRegenerate} />
          {ttsSupported && content && (
            <SpeakButton
              isPlaying={!!isSpeaking}
              isPaused={!!isPaused}
              onSpeak={onSpeak!}
              onPause={onPause!}
              onResume={onResume!}
              onStop={onStop!}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
};
