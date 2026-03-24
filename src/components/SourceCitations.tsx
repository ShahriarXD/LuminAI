import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, ChevronDown, Globe } from "lucide-react";
import type { SourceCitation } from "@/lib/chat-api";

interface SourceCitationsProps {
  sources: SourceCitation[];
}

export function SourceCitations({ sources }: SourceCitationsProps) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-2"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="surface-chip flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <Globe className="h-3 w-3" />
        <span>{sources.length} source{sources.length > 1 ? "s" : ""}</span>
        <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 space-y-2 overflow-hidden"
          >
            {sources.map((source, i) => (
              <motion.a
                key={i}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="surface-subtle group flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-primary/5"
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted/85 text-[10px] font-bold text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] font-medium text-foreground transition-colors group-hover:text-primary">
                    {source.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">{source.snippet}</p>
                  <p className="mt-1 text-[9px] text-muted-foreground/60">{source.domain}</p>
                </div>
                <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground/50 group-hover:text-primary transition-colors mt-0.5" />
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Inline citation pills for within message text
export function InlineCitation({ index, source }: { index: number; source: SourceCitation }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary hover:bg-primary/20 transition-colors align-middle mx-0.5"
      title={source.title}
    >
      {index + 1}
    </a>
  );
}
