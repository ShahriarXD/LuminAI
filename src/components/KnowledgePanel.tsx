import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, Loader2, CheckCircle, AlertCircle, X, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type DocumentRecord = Database["public"]["Tables"]["documents"]["Row"];
type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
type MemoryRecord = Database["public"]["Tables"]["memories"]["Row"];

interface KnowledgePanelProps {
  userId: string;
  projectId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function KnowledgePanel({ userId, projectId, isOpen, onClose }: KnowledgePanelProps) {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [scope, setScope] = useState<"personal" | "project">(projectId ? "project" : "personal");
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"files" | "memory">("files");

  const loadDocuments = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (data) setDocuments(data);
  }, [userId]);

  const loadMemories = useCallback(async () => {
    const { data } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setMemories(data);
  }, [userId]);

  useEffect(() => {
    if (isOpen) { loadDocuments(); loadMemories(); }
  }, [isOpen, loadDocuments, loadMemories]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    for (const file of Array.from(files)) {
      try {
        const filePath = `${userId}/${Date.now()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("knowledge-files")
          .upload(filePath, file);

        if (uploadError) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const insertPayload: DocumentInsert = {
          user_id: userId,
          project_id: scope === "project" ? projectId : null,
          name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
          scope,
        };

        const { data: docData, error: docError } = await supabase
          .from("documents")
          .insert(insertPayload)
          .select("id")
          .single();

        if (docError) {
          toast.error(`Failed to create record for ${file.name}`);
          continue;
        }

        // Trigger processing
        const { data: { session } } = await supabase.auth.getSession();
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-document`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ documentId: docData.id }),
        }).then(() => {
          setTimeout(loadDocuments, 2000);
        });

        toast.success(`Uploading ${file.name}...`);
      } catch {
        toast.error(`Error uploading ${file.name}`);
      }
    }

    setIsUploading(false);
    loadDocuments();
  };

  const handleDelete = async (doc: DocumentRecord) => {
    await supabase.storage.from("knowledge-files").remove([doc.file_path]);
    await supabase.from("documents").delete().eq("id", doc.id);
    toast.success("File deleted");
    loadDocuments();
  };

  const handleDeleteMemory = async (id: string) => {
    await supabase.from("memories").delete().eq("id", id);
    toast.success("Memory removed");
    loadMemories();
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "processing": return <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />;
      case "ready": return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case "failed": return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return null;
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 300, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="surface-panel fixed right-0 top-0 z-50 flex h-full w-full max-w-[22rem] flex-col rounded-none border-l border-border/50"
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
          <h3 className="font-display text-sm font-semibold text-foreground">Knowledge Base</h3>
          <button onClick={onClose} className="btn-icon-sm text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-2 border-b border-border/30">
          <button
            onClick={() => setActiveTab("files")}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${activeTab === "files" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <FileText className="h-3 w-3 inline mr-1" /> Files
          </button>
          <button
            onClick={() => setActiveTab("memory")}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${activeTab === "memory" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <Brain className="h-3 w-3 inline mr-1" /> Memory ({memories.length})
          </button>
        </div>

        {activeTab === "files" ? (
          <>
            {/* Scope selector */}
            {projectId && (
              <div className="flex gap-1 p-2 border-b border-border/30">
                <button
                  onClick={() => setScope("personal")}
                  className={`flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors ${scope === "personal" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/50"}`}
                >
                  Personal
                </button>
                <button
                  onClick={() => setScope("project")}
                  className={`flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors ${scope === "project" ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/50"}`}
                >
                  Project
                </button>
              </div>
            )}

            {/* Upload area */}
            <label className="mx-3 mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/30 py-6 transition-colors hover:border-primary/40 hover:bg-primary/5">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {isUploading ? "Uploading..." : "Drop files or click to upload"}
              </span>
              <span className="text-[10px] text-muted-foreground/60">PDF, TXT, MD, DOCX</span>
              <input
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.txt,.md,.docx"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={isUploading}
              />
            </label>

            {/* File list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
              {documents.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No files uploaded yet</p>
              ) : (
                documents.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group surface-subtle flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    {statusIcon(doc.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatSize(doc.file_size)} · {doc.chunk_count} chunks · {doc.scope}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="btn-icon-sm shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-none">
            {memories.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                No memories yet. Chat more and I'll remember important things!
              </p>
            ) : (
              memories.map((mem) => (
                <motion.div
                  key={mem.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="group surface-subtle flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                    {mem.category}
                  </span>
                  <p className="text-xs text-foreground flex-1">{mem.content}</p>
                  <button
                    onClick={() => handleDeleteMemory(mem.id)}
                    className="btn-icon-sm text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
