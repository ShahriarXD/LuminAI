import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="surface-panel w-full max-w-md px-8 py-10 text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          The page you were trying to open does not exist or may have been moved.
        </p>
        <a
          href="/"
          className="gradient-send mx-auto mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:brightness-110"
        >
          Return home
          <ArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
