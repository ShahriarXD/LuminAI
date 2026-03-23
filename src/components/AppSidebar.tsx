import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare, Settings, LogOut } from "lucide-react";

const navItems = [
  { icon: Sparkles, label: "AI Chat", active: true },
  { icon: MessageSquare, label: "History", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export function AppSidebar() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center py-6 glass"
    >
      {/* Logo */}
      <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <span className="font-display text-lg font-bold text-foreground">C</span>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-1 flex-col items-center gap-2">
        {navItems.map((item, i) => (
          <button
            key={item.label}
            onClick={() => setActiveIndex(i)}
            className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:scale-95 ${
              activeIndex === i
                ? "bg-muted text-foreground shadow-soft"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <item.icon className="h-[18px] w-[18px]" />
            {/* Tooltip */}
            <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-glass transition-opacity duration-150 group-hover:opacity-100">
              {item.label}
            </span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <button className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors duration-200 hover:bg-muted/50 hover:text-foreground active:scale-95">
        <LogOut className="h-[18px] w-[18px]" />
      </button>
    </motion.aside>
  );
}
