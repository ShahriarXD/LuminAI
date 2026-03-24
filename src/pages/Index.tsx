import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  streamChat, cleanSourceMarkers, retrieveRelevantChunks, fetchMemories, triggerMemoryExtraction,
  type ModelId, type ProviderType, type UserProfile, type SourceCitation, type RAGChunk, type Memory,
} from "@/lib/chat-api";
import { AppSidebar } from "@/components/AppSidebar";
import { HeroOrb, type OrbState } from "@/components/HeroOrb";
import { ActionChips } from "@/components/ActionChips";
import { ChatInput } from "@/components/ChatInput";
import { ModelSelector } from "@/components/ModelSelector";

import { ChatMessage } from "@/components/chat/ChatMessage";
import { SearchStatus } from "@/components/SearchStatus";
import { exportAsMarkdown, exportAsPdf } from "@/lib/export-chat";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { processImageOCR } from "@/lib/ocr/api";
import { formatOcrResultMarkdown } from "@/lib/ocr/format";
import { buildOcrQuickActions } from "@/lib/ocr/prompts";
import type { ChatMessageMetadata, OCRImageAttachment } from "@/lib/ocr/types";

interface ChatMsg { role: "user" | "assistant"; content: string; sources?: SourceCitation[]; metadata?: ChatMessageMetadata | null; }
interface ChatRecord { id: string; title: string; updated_at: string; project_id: string | null; is_pinned?: boolean; tags?: string[]; }
interface ProjectRecord { id: string; name: string; description: string | null; system_prompt: string | null; }
interface NewChatInsert { user_id: string; title: string; project_id?: string; }
interface ChatUpdatePayload { is_pinned?: boolean; is_public?: boolean; share_id?: string; }

const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
function InlineLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel flex items-center gap-3 px-5 py-4">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
    </div>
  );
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<ModelId>("llama-3.3-70b-versatile");
  const [provider, setProvider] = useState<ProviderType>("groq");
  const [profile, setProfile] = useState<UserProfile>({});
  const [showSettings, setShowSettings] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tts = useTextToSpeech();
  const isMobile = useIsMobile();

  const loadChats = useCallback(async () => {
    let query = supabase.from("chats").select("id, title, updated_at, project_id, is_pinned, tags").order("updated_at", { ascending: false });
    if (activeProjectId) query = query.eq("project_id", activeProjectId);
    const { data } = await query;
    if (data) setChats(data);
  }, [activeProjectId]);

  const loadProjects = useCallback(async () => {
    const { data } = await supabase.from("projects").select("id, name, description, system_prompt").order("updated_at", { ascending: false });
    if (data) setProjects(data);
  }, []);

  const loadMessages = useCallback(async (chatId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("role, content, message_metadata")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((message) => ({
          role: message.role as "user" | "assistant",
          content: message.content,
          metadata: (message.message_metadata as ChatMessageMetadata | null) ?? null,
        })),
      );
    }
  }, []);

  const loadProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from("profiles").select("name, profession, interests, goals, preferences").eq("user_id", userId).single();
    if (data) setProfile(data as UserProfile);
  }, []);

  const loadMemories = useCallback(async (userId: string) => {
    const mems = await fetchMemories(userId);
    setMemories(mems);
  }, []);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
  }, []);

  useEffect(() => {
    if (user) { loadChats(); loadProjects(); loadProfile(user.id); loadMemories(user.id); }
  }, [user, loadChats, loadProjects, loadProfile, loadMemories]);

  useEffect(() => { if (activeChatId) loadMessages(activeChatId); else setMessages([]); }, [activeChatId, loadMessages]);
  useEffect(() => { loadChats(); }, [activeProjectId, loadChats]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

  const createChat = async (firstMessage: string): Promise<string | null> => {
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? "..." : "");
    const insertData: NewChatInsert = { user_id: user.id, title };
    if (activeProjectId) insertData.project_id = activeProjectId;
    const { data, error } = await supabase.from("chats").insert(insertData).select("id").single();
    if (error) { toast.error("Failed to create chat"); return null; }
    await loadChats();
    return data.id;
  };

  const persistMessage = async (chatId: string, message: ChatMsg) => {
    await supabase.from("messages").insert({
      chat_id: chatId,
      role: message.role,
      content: message.content,
      message_metadata: message.metadata ?? null,
    });
  };

  const streamAssistantReply = async ({
    chatId,
    conversation,
    deepThink,
    searchInternet,
  }: {
    chatId: string;
    conversation: ChatMsg[];
    deepThink?: boolean;
    searchInternet?: boolean;
  }) => {
    setIsLoading(true);
    setBusyLabel(searchInternet ? "Searching and responding..." : deepThink ? "Thinking deeply..." : "Generating response...");

    let assistantContent = "";
    let msgSources: SourceCitation[] = [];

    await streamChat({
      messages: conversation.map((message) => ({ role: message.role, content: message.content })),
      model,
      provider,
      deepThink,
      searchInternet,
      profile,
      ragContext: user ? await retrieveRelevantChunks(conversation[conversation.length - 1]?.content || "", user.id, activeProjectId) : undefined,
      memories: memories.length > 0 ? memories : undefined,
      onDelta: (chunk) => {
        assistantContent += chunk;
        const displayContent = cleanSourceMarkers(assistantContent);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.metadata) {
            return prev.map((message, index) =>
              index === prev.length - 1 ? { ...message, content: displayContent } : message,
            );
          }

          return [...prev, { role: "assistant", content: displayContent }];
        });
      },
      onSources: (sources) => {
        msgSources = sources;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && !last.metadata) {
            return prev.map((message, index) =>
              index === prev.length - 1 ? { ...message, sources } : message,
            );
          }
          return prev;
        });
      },
      onDone: async () => {
        setIsLoading(false);
        setBusyLabel(null);
        const cleanContent = cleanSourceMarkers(assistantContent);
        if (cleanContent) {
          await persistMessage(chatId, { role: "assistant", content: cleanContent, sources: msgSources });
        }
        triggerMemoryExtraction(
          [...conversation, { role: "assistant" as const, content: cleanContent }],
          chatId,
        );
        if (user) setTimeout(() => loadMemories(user.id), 5000);
      },
      onError: (error) => {
        setIsLoading(false);
        setBusyLabel(null);
        toast.error(error);
      },
    });
  };

  const handleSend = async (
    message: string,
    deepThink: boolean = false,
    searchInternet: boolean = false,
    attachment?: OCRImageAttachment,
  ) => {
    if (isLoading) return;
    let chatId = activeChatId;
    const initialTitle = attachment?.fileName || message || "New Chat";
    if (!chatId) {
      chatId = await createChat(initialTitle);
      if (!chatId) return;
      setActiveChatId(chatId);
    }

    const currentConversation = [...messages];

    if (attachment) {
      const uploadMessage: ChatMsg = {
        role: "user",
        content: `Uploaded image for OCR: ${attachment.fileName}`,
        metadata: {
          kind: "user_image_upload",
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
          size: attachment.size,
        },
      };

      setMessages((prev) => [...prev, uploadMessage]);
      await persistMessage(chatId, uploadMessage);

      const processingMessage: ChatMsg = {
        role: "assistant",
        content: "",
        metadata: {
          kind: "ocr_processing",
          fileName: attachment.fileName,
          label: "Reading image and extracting questions...",
        },
      };

      setMessages((prev) => [...prev, processingMessage]);
      setIsLoading(true);
      setBusyLabel("Reading image...");

      try {
        const { result } = await processImageOCR(attachment);
        const ocrMessage: ChatMsg = {
          role: "assistant",
          content: formatOcrResultMarkdown(result),
          metadata: {
            kind: "ocr_result",
            fileName: result.fileName,
            documentType: result.documentType,
            title: result.title,
            questionCount: result.questions.length,
            quickActions: buildOcrQuickActions(result),
          },
        };

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = ocrMessage;
          return next;
        });
        await persistMessage(chatId, ocrMessage);
        setIsLoading(false);
        setBusyLabel(null);

        if (message.trim()) {
          const followUpUserMessage: ChatMsg = { role: "user", content: message.trim() };
          setMessages((prev) => [...prev, followUpUserMessage]);
          await persistMessage(chatId, followUpUserMessage);

          await streamAssistantReply({
            chatId,
            conversation: [...currentConversation, uploadMessage, ocrMessage, followUpUserMessage],
            deepThink,
            searchInternet,
          });
        }

        return;
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Failed to read image";
        const errorMessage: ChatMsg = {
          role: "assistant",
          content: reason,
          metadata: {
            kind: "ocr_error",
            fileName: attachment.fileName,
            reason,
          },
        };

        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = errorMessage;
          return next;
        });
        await persistMessage(chatId, errorMessage);
        setIsLoading(false);
        setBusyLabel(null);
        toast.error(reason);
        return;
      }
    }

    const userMsg: ChatMsg = { role: "user", content: message };
    setMessages((prev) => [...prev, userMsg]);
    await persistMessage(chatId, userMsg);

    await streamAssistantReply({
      chatId,
      conversation: [...currentConversation, userMsg],
      deepThink,
      searchInternet,
    });
  };

  const handleNewChat = () => { setActiveChatId(null); setMessages([]); };

  const handleDeleteChat = async (id: string) => {
    await supabase.from("chats").delete().eq("id", id);
    if (activeChatId === id) handleNewChat();
    loadChats();
  };

  const handlePinChat = async (id: string, pinned: boolean) => {
    const payload: ChatUpdatePayload = { is_pinned: pinned };
    await supabase.from("chats").update(payload).eq("id", id);
    loadChats();
  };

  const handleShareChat = async (id: string) => {
    const shareId = crypto.randomUUID().slice(0, 12);
    const payload: ChatUpdatePayload = { is_public: true, share_id: shareId };
    await supabase.from("chats").update(payload).eq("id", id);
    const url = `${window.location.origin}/shared/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard!");
    loadChats();
  };

  const handleExportChat = async (id: string, format: "md" | "pdf") => {
    const chat = chats.find((c) => c.id === id);
    const { data: msgs } = await supabase.from("messages").select("role, content").eq("chat_id", id).order("created_at", { ascending: true });
    if (!msgs) return;
    if (format === "md") exportAsMarkdown(chat?.title || "Chat", msgs);
    else exportAsPdf(chat?.title || "Chat", msgs);
  };

  const handleCreateProject = async () => {
    const { data, error } = await supabase.from("projects").insert({ user_id: user.id, name: "New Project" }).select("id").single();
    if (error) { toast.error("Failed to create project"); return; }
    await loadProjects();
    setActiveProjectId(data.id);
    toast.success("Project created!");
  };

  const handleDeleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    if (activeProjectId === id) setActiveProjectId(null);
    loadProjects(); loadChats();
  };

  const handleRenameProject = async (id: string, name: string) => {
    await supabase.from("projects").update({ name }).eq("id", id);
    loadProjects();
  };

  const handleModelChange = (newModel: ModelId, newProvider: ProviderType) => {
    setModel(newModel);
    setProvider(newProvider);
  };

  if (showSettings) {
    return (
      <Suspense fallback={<InlineLoader label="Loading settings" />}>
        <ProfilePage onBack={() => { setShowSettings(false); if (user) loadProfile(user.id); }} onDataCleared={() => { setActiveChatId(null); setMessages([]); loadChats(); if (user) loadMemories(user.id); }} />
      </Suspense>
    );
  }

  const showHero = messages.length === 0;
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const orbState: OrbState = isLoading ? "streaming" : "idle";

  return (
    <div className="flex min-h-screen min-h-[100dvh]">
      <AppSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={setActiveChatId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onPinChat={handlePinChat}
        onShareChat={handleShareChat}
        onExportChat={handleExportChat}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        onRenameProject={handleRenameProject}
        onOpenSettings={() => setShowSettings(true)}
        onOpenKnowledge={() => undefined}
      />

      <main className={`flex flex-1 flex-col ${isMobile ? "ml-0" : "ml-16"}`}>
        <header className={`flex items-center justify-between border-b border-border/20 ${isMobile ? "px-14 py-4" : "px-6 py-4"}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <ModelSelector value={model} provider={provider} onChange={handleModelChange} />
            {activeProject && (
              <span className="surface-chip max-w-[140px] truncate px-2.5 py-1 text-xs font-medium text-primary sm:max-w-none">
                {activeProject.name}
              </span>
            )}
          </div>
          {!isMobile && (
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">{profile.name || user?.email}</span>
          )}
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-3 pb-4 sm:px-4 sm:pb-8">
          <AnimatePresence mode="wait">
            {showHero ? (
              <motion.div
                key="hero"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.96, y: -20 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex w-full max-w-2xl flex-col items-center gap-5 sm:gap-8"
              >
                <motion.h1
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center font-display text-3xl sm:text-4xl md:text-5xl font-bold leading-tight tracking-tight"
                  style={{ lineHeight: "1.1" }}
                >
                  <span className="text-gradient-muted">Lumina</span>{" "}
                  <span className="text-foreground">Workspace</span>
                  <br />
                  <span className="text-foreground">for Deep Thinking</span>
                </motion.h1>
                <HeroOrb state={orbState} />
                <ActionChips onSelect={(label) => handleSend(label, false)} />
                <ChatInput onSend={handleSend} isLoading={isLoading} busyLabel={busyLabel ?? undefined} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="flex w-full max-w-2xl flex-1 flex-col"
              >
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-1 py-4 scrollbar-none sm:space-y-4 sm:px-2">
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      sources={msg.sources}
                      metadata={msg.metadata}
                      index={i}
                      isMobile={isMobile}
                      ttsSupported={msg.role === "assistant" && tts.isSupported}
                      isSpeaking={tts.isPlaying && speakingIdx === i}
                      isPaused={tts.isPaused && speakingIdx === i}
                      onSpeak={() => { setSpeakingIdx(i); tts.speak(msg.content); }}
                      onPause={tts.pause}
                      onResume={tts.resume}
                      onStop={() => { tts.stop(); setSpeakingIdx(null); }}
                      onQuickAction={(prompt) => handleSend(prompt, false, false)}
                      quickActionsDisabled={isLoading}
                    />
                  ))}
                  {isLoading && messages[messages.length - 1]?.role === "user" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                      <div className="flex flex-col gap-1">
                        <SearchStatus isSearching={true} isThinking={true} hasRagContext={false} />
                        <div className="surface-subtle rounded-[1.35rem] px-4 py-3 text-sm text-muted-foreground">
                          <span className="inline-flex gap-1">
                            <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                            <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
                <div className="pb-3 sm:pb-4 pt-2">
                  <ChatInput onSend={handleSend} isLoading={isLoading} busyLabel={busyLabel ?? undefined} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

    </div>
  );
};

export default Index;
