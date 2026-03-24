import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Paperclip, Brain, Globe, Mic, SendHorizonal, X, Image as ImageIcon } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { VoiceListeningOverlay } from "@/components/VoiceListeningOverlay";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { OCR_IMAGE_ACCEPT, type OCRImageAttachment } from "@/lib/ocr/types";
import { formatFileSize, validateOcrImage } from "@/lib/ocr/validation";

interface ChatInputProps {
  onSend: (message: string, deepThink: boolean, searchInternet: boolean, attachment?: OCRImageAttachment) => void;
  isLoading?: boolean;
  busyLabel?: string;
}

export function ChatInput({ onSend, isLoading, busyLabel }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [deepThink, setDeepThink] = useState(false);
  const [searchInternet, setSearchInternet] = useState(false);
  const [attachedImage, setAttachedImage] = useState<OCRImageAttachment | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const { isListening, transcript, interimTranscript, isSupported, startListening, stopListening, cancelListening } = useSpeechRecognition();
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (attachedImage?.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl);
    };
  }, [attachedImage]);

  const clearAttachedImage = () => {
    if (attachedImage?.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl);
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const attachImage = (file: File | null) => {
    if (!file) return;
    const validationError = validateOcrImage(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (attachedImage?.previewUrl) URL.revokeObjectURL(attachedImage.previewUrl);

    setAttachedImage({
      file,
      previewUrl: URL.createObjectURL(file),
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    });
  };

  const handleSubmit = () => {
    if ((!value.trim() && !attachedImage) || isLoading) return;
    onSend(value.trim(), deepThink, searchInternet, attachedImage ?? undefined);
    setValue("");
    clearAttachedImage();
  };

  const handleVoiceDone = () => {
    stopListening();
    const text = (transcript + " " + interimTranscript).trim();
    if (text) setValue((prev) => (prev ? prev + " " + text : text));
  };

  const ringClass =
    deepThink && searchInternet
    ? "ring-2 ring-[hsl(280_50%_60%_/_0.4)]"
    : deepThink
    ? "ring-2 ring-accent/40"
    : searchInternet
    ? "ring-2 ring-primary/40"
    : "";

  return (
    <>
      <VoiceListeningOverlay
        isListening={isListening}
        transcript={transcript}
        interimTranscript={interimTranscript}
        onStop={handleVoiceDone}
        onCancel={cancelListening}
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto w-full max-w-2xl px-1"
      >
        <div
          className={`surface-panel p-1.5 transition-all duration-300 ${ringClass} ${isDraggingImage ? "border-primary/40 bg-primary/5" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            if (!isLoading) setIsDraggingImage(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDraggingImage(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDraggingImage(false);
            if (isLoading) return;
            const file = event.dataTransfer.files?.[0];
            attachImage(file ?? null);
          }}
        >
          <div className="input-shell px-3 sm:px-4 pt-3 pb-2.5">
            {attachedImage && (
              <div className="mb-3 flex items-start gap-3 rounded-[1.1rem] border border-border/60 bg-card/70 p-2.5">
                <img
                  src={attachedImage.previewUrl}
                  alt={attachedImage.fileName}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">{attachedImage.fileName}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        Ready for OCR · {formatFileSize(attachedImage.size)}
                      </p>
                    </div>
                    <button
                      onClick={clearAttachedImage}
                      type="button"
                      className="btn-icon-sm text-muted-foreground hover:text-foreground"
                      aria-label="Remove image"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder={
                deepThink && searchInternet ? "Search and analyze anything..." :
                searchInternet ? "Ask anything with web search..." :
                deepThink ? "Ask anything in Deep Think mode..." :
                "Ask me anything..."
              }
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground font-body focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={isLoading}
            />
            {busyLabel && (
              <div className="mt-2 inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary/70" />
                {busyLabel}
              </div>
            )}
          </div>
          <div className={`flex items-center justify-between px-1.5 pt-2 sm:px-2 ${isMobile ? "gap-2" : ""}`}>
            <div className={`flex items-center ${isMobile ? "gap-1" : "gap-1.5"}`}>
              <input
                ref={fileInputRef}
                type="file"
                accept={OCR_IMAGE_ACCEPT}
                className="hidden"
                onChange={(event) => attachImage(event.target.files?.[0] ?? null)}
              />
              <ActionButton
                icon={attachedImage ? ImageIcon : Paperclip}
                label={isMobile ? "" : attachedImage ? "Image Ready" : "Upload"}
                onClick={() => fileInputRef.current?.click()}
                active={!!attachedImage}
                activeColor="primary"
                compact={isMobile}
              />
              <ActionButton icon={Brain} label={isMobile ? "" : "Think"} active={deepThink} onClick={() => setDeepThink(!deepThink)} compact={isMobile} />
              <ActionButton icon={Globe} label={isMobile ? "" : "Search"} active={searchInternet} onClick={() => setSearchInternet(!searchInternet)} activeColor="primary" compact={isMobile} />
            </div>
            <div className={`flex items-center ${isMobile ? "gap-1" : "gap-1.5"}`}>
              {isSupported && (
                <ActionButton icon={Mic} label={isMobile ? "" : "Voice"} onClick={startListening} compact={isMobile} />
              )}
              <button
                onClick={handleSubmit}
                disabled={(!value.trim() && !attachedImage) || isLoading}
                className="group flex items-center gap-1.5 rounded-full gradient-send px-3.5 py-2 text-xs font-medium text-primary-foreground transition-all duration-200 hover:shadow-glow hover:brightness-110 hover:-translate-y-0.5 btn-press disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                <SendHorizonal className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                {!isMobile && <span>Send</span>}
              </button>
            </div>
          </div>
        </div>
        {(deepThink || searchInternet) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 flex items-center justify-center gap-2 text-[10px] font-medium"
          >
            {deepThink && <span className="surface-chip px-2 py-1 text-accent">Deep Think</span>}
            {searchInternet && <span className="surface-chip px-2 py-1 text-primary">Web search</span>}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}

function ActionButton({ icon: Icon, label, active, onClick, activeColor = "accent", compact }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  activeColor?: "accent" | "primary";
  compact?: boolean;
}) {
  const activeClasses = activeColor === "primary"
    ? "bg-primary/15 text-primary shadow-soft"
    : "bg-accent/15 text-accent shadow-soft";

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full ${compact ? "px-2.5 py-2" : "px-3 py-2"} text-xs font-medium transition-all duration-200 hover:-translate-y-0.5 btn-press ${
        active ? `surface-chip ${activeClasses}` : "surface-chip text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label && <span>{label}</span>}
    </button>
  );
}
