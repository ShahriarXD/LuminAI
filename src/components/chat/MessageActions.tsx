import { CopyButton } from "./CopyButton";
import { RefreshCw } from "lucide-react";

interface MessageActionsProps {
  content: string;
  role: "user" | "assistant";
  onRegenerate?: () => void;
}

export const MessageActions = ({ content, role, onRegenerate }: MessageActionsProps) => {
  return (
    <div className="mt-1.5 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
      <CopyButton text={content} size={13} />
      {role === "assistant" && onRegenerate && (
        <button
          onClick={onRegenerate}
          className="icon-button h-7 w-7 rounded-lg"
          title="Regenerate"
        >
          <RefreshCw size={13} />
        </button>
      )}
    </div>
  );
};
