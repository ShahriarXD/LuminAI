import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">{error}</div>;

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 font-display text-2xl font-bold text-foreground">{title}</h1>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "gradient-send text-primary-foreground" : "glass text-foreground"}`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-12 text-center text-xs text-muted-foreground">Shared conversation • Read only</p>
      </div>
    </div>
  );
}
