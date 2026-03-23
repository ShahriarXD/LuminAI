import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function ConnectWalletButton() {
  return (
    <motion.button
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="glass-strong flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground shadow-glass transition-all duration-200 hover:shadow-glass-hover active:scale-[0.97]"
    >
      <Plus className="h-4 w-4" />
      Connect Wallet
    </motion.button>
  );
}
