import { useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export function ChatSearch({ onSearch }: ChatSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  const handleClose = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="input-shell flex items-center gap-2 px-3 py-2"
    >
      <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search chats..."
        className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
      />
      <AnimatePresence>
        {query && (
          <motion.button
            key="clear"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleClose}
            className="btn-icon-sm"
            aria-label="Clear chat search"
          >
            <X className="h-3 w-3" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
