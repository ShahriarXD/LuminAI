import { useState } from "react";
import { CopyButton } from "./CopyButton";
import { ChevronDown, ChevronUp, WrapText } from "lucide-react";

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
}

export const CodeBlock = ({ children, language, className }: CodeBlockProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [wrap, setWrap] = useState(false);
  const lines = children.split("\n").length;
  const isLong = lines > 20;
  const displayLang = language || "code";

  return (
    <div className="my-3 overflow-hidden rounded-2xl border border-border/50 bg-[hsl(240_20%_8%)] shadow-[0_10px_32px_hsl(240_20%_5%_/_0.24)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/30 bg-[hsl(240_15%_12%)] px-4 py-2.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {displayLang}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setWrap(!wrap)}
            className="icon-button h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            title={wrap ? "No wrap" : "Wrap lines"}
          >
            <WrapText size={13} />
          </button>
          {isLong && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="icon-button h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground"
            >
              {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
            </button>
          )}
          <CopyButton text={children} size={13} />
        </div>
      </div>

      {/* Code content */}
      <div
        className={`overflow-x-auto transition-all duration-300 ${collapsed ? "max-h-[120px]" : ""}`}
        style={collapsed ? { overflow: "hidden" } : {}}
      >
        <pre className={`p-4 text-[13px] leading-6 ${wrap ? "whitespace-pre-wrap" : "whitespace-pre"}`}>
          <code className={`${className || ""} text-[hsl(210_15%_85%)]`}>
            {children}
          </code>
        </pre>
      </div>

      {collapsed && isLong && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full border-t border-border/30 bg-[hsl(240_15%_12%)] py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Show all {lines} lines
        </button>
      )}
    </div>
  );
};
