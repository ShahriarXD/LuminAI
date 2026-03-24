import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer";

interface ChatMsg { role: string; content: string; }

export default function SharedChatPage() {
  const { shareId } = useParams();
  const [title, setTitle] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: chat } = await supabase.from("chats").select("id, title").eq("share_id", shareId!).eq("is_public", true).single();
      if (!chat) { setError("Chat not found or not public"); setLoading(false); return; }
      setTitle(chat.title);
      const { data: msgs } = await supabase.from("messages").select("role, content").eq("chat_id", chat.id).order("created_at", { ascending: true });
      if (msgs) setMessages(msgs);
      setLoading(false);
    }
    if (shareId) load();
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center px-4 text-center text-sm text-muted-foreground">{error}</div>;
  }

  return (
    <div className="min-h-screen px-4 py-10 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="surface-panel mb-8 px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/75">Shared conversation</p>
          <h1 className="mt-2 font-display text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Read-only view</p>
        </div>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user" ? "gradient-send text-primary-foreground shadow-glow" : "surface-subtle text-foreground"
              }`}>
                {msg.role === "assistant" ? <MarkdownRenderer content={msg.content} /> : <span className="whitespace-pre-wrap">{msg.content}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
