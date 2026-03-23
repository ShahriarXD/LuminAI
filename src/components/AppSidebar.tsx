import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MessageSquare, FolderKanban, LogOut, Plus, Trash2, X,
  Pencil, Settings, Pin, Share2, FileDown, BookOpen, Menu,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ChatSearch } from "@/components/ChatSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onOpenKnowledge: () => void;
}

type Panel = "none" | "chats" | "projects";

export function AppSidebar({
  chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onPinChat, onShareChat, onExportChat,
  projects = [], activeProjectId, onSelectProject, onCreateProject, onDeleteProject, onRenameProject,
  onOpenSettings, onOpenKnowledge,
}: AppSidebarProps) {
  const [panel, setPanel] = useState<Panel>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleLogout = async () => { await supabase.auth.signOut(); };
  const togglePanel = (p: Panel) => setPanel(panel === p ? "none" : p);

  const startRename = (proj: Project) => { setEditingId(proj.id); setEditName(proj.name); };
  const commitRename = () => {
    if (editingId && editName.trim()) onRenameProject(editingId, editName.trim());
    setEditingId(null);
  };

  const activeProject = (projects || []).find((p) => p.id === activeProjectId);

  const filteredChats = chats
    .filter((c) => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return 0;
    });

  // Mobile hamburger
  if (isMobile) {
    return (
      <>
        {/* Floating hamburger */}
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-50 flex h-10 w-10 items-center justify-center rounded-xl glass shadow-glass btn-press"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>

        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
                onClick={() => { setMobileOpen(false); setPanel("none"); }}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: "spring", damping: 28, stiffness: 300 }}
                className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col glass-strong border-r border-border/30"
              >
                <div className="flex items-center justify-between px-4 py-4 border-b border-border/30">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <span className="font-display text-sm font-bold text-primary">C</span>
                    </div>
                    <span className="font-display text-sm font-semibold text-foreground">Chat AI</span>
                  </div>
                  <button onClick={() => { setMobileOpen(false); setPanel("none"); }} className="btn-icon-sm text-muted-foreground hover:text-foreground">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex flex-col gap-1 p-3">
                  <MobileNavButton icon={Sparkles} label="New Chat" onClick={() => { onNewChat(); setMobileOpen(false); }} />
                  <MobileNavButton icon={MessageSquare} label="Chat History" active={panel === "chats"} onClick={() => togglePanel("chats")} />
                  <MobileNavButton icon={FolderKanban} label="Projects" active={panel === "projects"} onClick={() => togglePanel("projects")} />
                  <MobileNavButton icon={BookOpen} label="Knowledge" onClick={() => { onOpenKnowledge(); setMobileOpen(false); }} />
                  <MobileNavButton icon={Settings} label="Settings" onClick={() => { onOpenSettings(); setMobileOpen(false); }} />
                </nav>

                {/* Inline panel content */}
                {panel !== "none" && (
                  <div className="flex-1 flex flex-col border-t border-border/20 overflow-hidden">
                    <div className="px-4 py-3 flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold text-foreground">
                        {panel === "chats" ? "Chat History" : "Projects"}
                      </h3>
                    </div>
                    {panel === "chats" && (
                      <div className="px-3 pb-2">
                        <ChatSearch onSearch={setSearchQuery} />
                      </div>
                    )}
                    <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-1">
                      {panel === "chats" ? (
                        filteredChats.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-8">{searchQuery ? "No matches" : "No chats yet"}</p>
                        ) : (
                          filteredChats.map((chat) => (
                            <ChatListItem
                              key={chat.id}
                              chat={chat}
                              active={activeChatId === chat.id}
                              exportMenuId={exportMenuId}
                              onSelect={() => { onSelectChat(chat.id); setMobileOpen(false); setPanel("none"); }}
                              onPin={() => onPinChat(chat.id, !chat.is_pinned)}
                              onShare={() => onShareChat(chat.id)}
                              onExportToggle={() => setExportMenuId(exportMenuId === chat.id ? null : chat.id)}
                              onExport={(fmt) => { onExportChat(chat.id, fmt); setExportMenuId(null); }}
                              onDelete={() => onDeleteChat(chat.id)}
                            />
                          ))
                        )
                      ) : (
                        <ProjectList
                          projects={projects}
                          activeProjectId={activeProjectId}
                          editingId={editingId}
                          editName={editName}
                          onSelectProject={(id) => { onSelectProject(id); setPanel("chats"); }}
                          onSelectAll={() => { onSelectProject(null); }}
                          onStartRename={startRename}
                          onEditNameChange={setEditName}
                          onCommitRename={commitRename}
                          onDeleteProject={onDeleteProject}
                        />
                      )}
                    </div>
                    <div className="p-2 border-t border-border/30">
                      <button
                        onClick={() => {
                          if (panel === "chats") { onNewChat(); setMobileOpen(false); setPanel("none"); }
                          else onCreateProject();
                        }}
                        className="btn-premium flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        {panel === "chats" ? "New Chat" : "New Project"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="p-3 border-t border-border/20 flex items-center justify-between">
                  <ThemeToggle />
                  <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground btn-press">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop sidebar
  return (
    <>
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col items-center py-6 glass"
        style={{
          boxShadow: "1px 0 24px hsl(240 20% 50% / 0.04)",
        }}
      >
        <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shadow-soft">
          <span className="font-display text-lg font-bold text-primary">C</span>
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2">
          <SidebarIcon icon={Sparkles} label="New Chat" onClick={onNewChat} />
          <SidebarIcon icon={MessageSquare} label="Chats" active={panel === "chats"} onClick={() => togglePanel("chats")} />
          <SidebarIcon icon={FolderKanban} label="Projects" active={panel === "projects"} onClick={() => togglePanel("projects")} />
          <SidebarIcon icon={BookOpen} label="Knowledge" onClick={onOpenKnowledge} />
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
            className="fixed left-16 top-0 z-30 h-full w-64 glass-strong border-r border-border/30 flex flex-col"
            style={{
              boxShadow: "4px 0 32px hsl(240 20% 50% / 0.06)",
            }}
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
              <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl bg-primary/5 px-3 py-1.5 text-xs text-primary border border-primary/10">
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
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      active={activeChatId === chat.id}
                      exportMenuId={exportMenuId}
                      onSelect={() => { onSelectChat(chat.id); setPanel("none"); }}
                      onPin={() => onPinChat(chat.id, !chat.is_pinned)}
                      onShare={() => onShareChat(chat.id)}
                      onExportToggle={() => setExportMenuId(exportMenuId === chat.id ? null : chat.id)}
                      onExport={(fmt) => { onExportChat(chat.id, fmt); setExportMenuId(null); }}
                      onDelete={() => onDeleteChat(chat.id)}
                    />
                  ))
                )
              ) : (
                <ProjectList
                  projects={projects}
                  activeProjectId={activeProjectId}
                  editingId={editingId}
                  editName={editName}
                  onSelectProject={(id) => { onSelectProject(id); setPanel("chats"); }}
                  onSelectAll={() => onSelectProject(null)}
                  onStartRename={startRename}
                  onEditNameChange={setEditName}
                  onCommitRename={commitRename}
                  onDeleteProject={onDeleteProject}
                />
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

// ─── Sub-components ────────────────────────────────────────

function SidebarIcon({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 btn-press ${
        active ? "bg-primary/10 text-primary shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-110" />
      <span className="pointer-events-none absolute left-14 whitespace-nowrap rounded-xl bg-foreground/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium text-primary-foreground opacity-0 shadow-glass transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1">
        {label}
      </span>
    </button>
  );
}

function MobileNavButton({ icon: Icon, label, active, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 btn-press ${
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
    >
      <Icon className="h-4.5 w-4.5" />
      {label}
    </button>
  );
}

function ChatListItem({ chat, active, exportMenuId, onSelect, onPin, onShare, onExportToggle, onExport, onDelete }: {
  chat: { id: string; title: string; is_pinned?: boolean };
  active: boolean;
  exportMenuId: string | null;
  onSelect: () => void;
  onPin: () => void;
  onShare: () => void;
  onExportToggle: () => void;
  onExport: (fmt: "md" | "pdf") => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
        active ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
      }`}
      onClick={onSelect}
    >
      {chat.is_pinned ? <Pin className="h-3 w-3 shrink-0 text-primary/60" /> : <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />}
      <span className="flex-1 truncate">{chat.title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={(e) => { e.stopPropagation(); onPin(); }} className="btn-icon-sm text-muted-foreground hover:text-primary"><Pin className="h-3 w-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onShare(); }} className="btn-icon-sm text-muted-foreground hover:text-primary"><Share2 className="h-3 w-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onExportToggle(); }} className="btn-icon-sm text-muted-foreground hover:text-primary"><FileDown className="h-3 w-3" /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="btn-icon-sm text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
      {exportMenuId === chat.id && (
        <div className="absolute right-2 top-full z-50 glass-strong rounded-xl shadow-glass p-1 flex flex-col gap-0.5 mt-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => onExport("md")} className="px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-lg text-left">Markdown</button>
          <button onClick={() => onExport("pdf")} className="px-3 py-1.5 text-xs text-foreground hover:bg-muted rounded-lg text-left">PDF</button>
        </div>
      )}
    </div>
  );
}

function ProjectList({ projects, activeProjectId, editingId, editName, onSelectProject, onSelectAll, onStartRename, onEditNameChange, onCommitRename, onDeleteProject }: {
  projects: { id: string; name: string; description: string | null }[];
  activeProjectId: string | null;
  editingId: string | null;
  editName: string;
  onSelectProject: (id: string) => void;
  onSelectAll: () => void;
  onStartRename: (proj: any) => void;
  onEditNameChange: (name: string) => void;
  onCommitRename: () => void;
  onDeleteProject: (id: string) => void;
}) {
  return (
    <>
      <button
        onClick={onSelectAll}
        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 hover:-translate-y-0.5 ${
          activeProjectId === null ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
        }`}
      >
        <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-50" />
        <span>All Chats</span>
      </button>
      {(projects || []).map((proj) => (
        <div
          key={proj.id}
          className={`group flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 ${
            activeProjectId === proj.id ? "bg-primary/10 text-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          }`}
          onClick={() => onSelectProject(proj.id)}
        >
          <FolderKanban className="h-3.5 w-3.5 shrink-0 opacity-50" />
          {editingId === proj.id ? (
            <input
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              onBlur={onCommitRename}
              onKeyDown={(e) => e.key === "Enter" && onCommitRename()}
              onClick={(e) => e.stopPropagation()}
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none border-b border-primary/30"
            />
          ) : (
            <span className="flex-1 truncate">{proj.name}</span>
          )}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onStartRename(proj); }} className="btn-icon-sm text-muted-foreground hover:text-foreground">
              <Pencil className="h-3 w-3" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="btn-icon-sm text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      ))}
    </>
  );
}
