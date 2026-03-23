import { useState } from "react";
import { motion } from "framer-motion";
import { AppSidebar } from "@/components/AppSidebar";
import { HeroOrb } from "@/components/HeroOrb";
import { ActionChips } from "@/components/ActionChips";
import { ChatInput } from "@/components/ChatInput";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";

const Index = () => {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  const handleSend = (message: string) => {
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    // TODO: integrate AI streaming
  };

  const handleChipSelect = (label: string) => {
    handleSend(label);
  };

  const showHero = messages.length === 0;

  return (
    <div className="flex min-h-screen">
      <AppSidebar />

      {/* Main content */}
      <main className="ml-16 flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-end px-6 py-4">
          <ConnectWalletButton />
        </header>

        {/* Content area */}
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-8">
          {showHero ? (
            <div className="flex flex-col items-center gap-8">
              {/* Title */}
              <motion.h1
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-center font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
                style={{ lineHeight: "1.1" }}
              >
                <span className="text-gradient-muted">AI Powers</span>{" "}
                <span className="text-foreground">Easy Wallet</span>{" "}
                <span className="text-gradient-muted">And</span>
                <br />
                <span className="text-foreground">Voice Access</span>
              </motion.h1>

              {/* Orb */}
              <HeroOrb />

              {/* Action chips */}
              <ActionChips onSelect={handleChipSelect} />

              {/* Chat input */}
              <ChatInput onSend={handleSend} />
            </div>
          ) : (
            <div className="flex w-full max-w-2xl flex-1 flex-col">
              {/* Chat messages */}
              <div className="flex-1 space-y-4 overflow-y-auto px-2 py-4 scrollbar-none">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "gradient-send text-primary-foreground"
                          : "glass text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input at bottom */}
              <div className="pb-4 pt-2">
                <ChatInput onSend={handleSend} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
