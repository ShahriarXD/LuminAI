import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, FolderKanban, LogOut, Plus, Trash2, X,
  Pencil, Settings, Pin, Share2, FileDown, Tag,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSearch } from "@/components/ChatSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { exportAsMarkdown, exportAsPdf } from "@/lib/export-chat";
import { toast } from "sonner";

interface Chat {
  id: string;
  title: string;
  updated_at: string;
  is_pinned?: boolean;
  tags?: string[];
}

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface AppSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onPinChat: (id: string, pinned: boolean) => void;
  onShareChat: (id: string) => void;
  onExportChat: (id: string, format: "md" | "pdf") => void;
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onRenameProject: (id: string, name: string) => void;
  onOpenSettings: () => void;
}

type Panel = "none" | "chats" | "projects";

export function AppSidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onPinChat, onShareChat, onExportChat,
  projects = [], activeProjectId, onSelectProject, onCreateProject, onDeleteProject, onRenameProject,
  onOpenSettings,
}: AppSidebarProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const togglePanel = (p: Panel) => setPanel(panel === p ? "none" : p);

  const startRename = (proj: Project) => { setEditingId(proj.id); setEditName(proj.name); };
  const commitRename = () => {
    if (editingId && editName.trim()) onRenameProject(editingId, editName.trim());
    setEditingId(null);
  };

  const activeProject = (projects || []).find((p) => p.id === activeProjectId);

  // Sort: pinned first, then filter by search
  const filteredChats = chats
    .filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

  return (
    <>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center py-6 glass"
      >
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <span className="font-display text-lg font-bold text-foreground">C</span>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          <SidebarIcon icon={Sparkles} label="New Chat" onClick={onNewChat} />
          <SidebarIcon icon={MessageSquare} label="Chats" active={panel === "chats"} onClick={() => togglePanel("chats")} />
          <SidebarIcon icon={FolderKanban} label="Projects" active={panel === "projects"} onClick={() => togglePanel("projects")} />
          <SidebarIcon icon={Settings} label="Settings" onClick={onOpenSettings} />
        </nav>

        <div className="flex flex-col items-center gap-2">
          <ThemeToggle />
          <SidebarIcon icon={LogOut} label="Logout" onClick={handleLogout} />
        </div>
      </motion.aside>

      <AnimatePresence>
        {panel !== "none" && (
          <motion.div
            initial={{ x: -240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -240, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-16 top-0 z-30 h-full w-64 glass-strong border-r border-border/50 flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
              <h3 className="font-display text-sm font-semibold text-foreground">
                {panel === "chats" ? "Chat History" : "Projects"}
              </h3>
              <button onClick={() => setPanel("none")} className="btn-icon-sm text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {panel === "chats" && (
              <div className="px-3 pt-2">
                <ChatSearch onSearch={setSearchQuery} />
              </div>
            )}

            {panel === "chats" && activeProject && (
              <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-1.5 text-xs text-primary">
                <FolderKanban className="h-3 w-3" />
                <span className="truncate font-medium">{activeProject.name}</span>
                <button onClick={() => onSelectProject(null)} className="ml-auto btn-icon-sm text-primary/60 hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1">
              {panel === "chats" ? (
                filteredChats.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">{searchQuery ? "No matches" : "No chats yet"}</p>
                ) : (
                  filteredChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 hover:translate-x-0.5 ${
                        activeChatId === chat.id ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                      onClick={() => { onSelectChat(chat.id); setPanel("none"); }}
                    >
                      {chat.is_pinned && <Pin className="h-3 w-3 shrink-0 text-primary/60" />}
                      {!chat.is_pinned && <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />}
                      <span className="flex-1 truncate">{chat.title}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); onPinChat(chat.id, !chat.is_pinned); }} className="btn-icon-sm text-muted-foreground hover:text-primary" title={chat.is_pinned ? "Unpin" : "Pin"}>
                          <Pin className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onShareChat(chat.id); }} className="btn-icon-sm text-muted-foreground hover:text-primary" title="Share">
                          <Share2 className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setExportMenuId(exportMenuId === chat.id ? null : chat.id); }} className="btn-icon-sm text-muted-foreground hover:text-primary" title="Export">
                          <FileDown className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }} className="btn-icon-sm text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {/* Export dropdown */}
                      {exportMenuId === chat.id && (
                        <div className="absolute right-2 mt-16 z-50 glass-strong rounded-lg shadow-glass p-1 flex flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => { onExportChat(chat.id, "md"); setExportMenuId(null); }} className="px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-md text-left">Markdown</button>
                          <button onClick={() => { onExportChat(chat.id, "pdf"); setExportMenuId(null); }} className="px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-md text-left">PDF</button>
                        </div>
                      )}
                    </div>
                  ))
                )
              ) : (
                <>
                  <button
                    onClick={() => onSelectProject(null)}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:translate-x-0.5 ${
                      activeProjectId === null ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
                    <span>All Chats</span>
                  </button>

                  {(projects || []).map((proj) => (
                    <div
                      key={proj.id}
                      className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 hover:translate-x-0.5 ${
                        activeProjectId === proj.id ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                      onClick={() => { onSelectProject(proj.id); setPanel("chats"); }}
                    >
                      <FolderKanban className="h-3.5 w-3.5 shrink-0 opacity-50" />
                      {editingId === proj.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e) => e.key === "Enter" && commitRename()}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                          className="flex-1 bg-transparent text-sm outline-none border-b border-primary/30"
                        />
                      ) : (
                        <span className="flex-1 truncate">{proj.name}</span>
                      )}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button onClick={(e) => { e.stopPropagation(); startRename(proj); }} className="btn-icon-sm text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="btn-icon-sm text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-2 border-t border-border/30">
              <button
                onClick={() => {
                  if (panel === "chats") { onNewChat(); setPanel("none"); }
                  else onCreateProject();
                }}
                className="btn-premium flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"
              >
                <Plus className="h-4 w-4" />
                {panel === "chats" ? "New Chat" : "New Project"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarIcon({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 btn-press ${
        active ? "bg-muted text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
      <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-glass transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
        {label}
      </span>
    </button>
  );
}
