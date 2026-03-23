import { useState } from "react";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatSearchProps {
  onSearch: (query: string) => void;
}

export function ChatSearch({ onSearch }: ChatSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const handleChange = (val: string) => {
    setQuery(val);
    onSearch(val);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative">
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5"
          >
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              placeholder="Search chats..."
              className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            />
            <button onClick={handleClose} className="btn-icon-sm text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="btn-icon-sm text-muted-foreground hover:text-foreground p-1.5"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
