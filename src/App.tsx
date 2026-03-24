import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import type { User } from "@supabase/supabase-js";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import SharedChatPage from "./pages/SharedChatPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    // Init theme from localStorage
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      if (!theme) localStorage.setItem("theme", "light");
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="surface-panel flex items-center gap-3 px-5 py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <div>
            <p className="text-sm font-medium text-foreground">Loading workspace</p>
            <p className="text-xs text-muted-foreground">Preparing your AI environment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={user ? <Index /> : <LandingPage />} />
            <Route path="/shared/:shareId" element={<SharedChatPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
