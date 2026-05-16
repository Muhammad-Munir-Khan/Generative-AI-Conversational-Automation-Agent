"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, MessageSquare, MoreHorizontal, Pencil, Plus, Trash2, X } from "lucide-react";
import type { SessionInfo } from "@/lib/api";
import { cn } from "@/lib/utils";

const MENU_WIDTH = 160;
const MENU_HEIGHT = 88;

export function ChatList({
  sessions,
  activeId,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  sessions: SessionInfo[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) {
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const triggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu on outside click (anywhere outside the menu element itself)
  useEffect(() => {
    if (!menuOpenFor) return;
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      const trigger = triggerRefs.current.get(menuOpenFor!);
      if (trigger?.contains(target)) return;
      setMenuOpenFor(null);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpenFor]);

  // Close menu on scroll or resize (otherwise it floats away from its trigger)
  useEffect(() => {
    if (!menuOpenFor) return;
    function close() { setMenuOpenFor(null); }
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menuOpenFor]);

  // Position the menu relative to the trigger using viewport coordinates.
  useLayoutEffect(() => {
    if (!menuOpenFor) {
      setMenuPos(null);
      return;
    }
    const trigger = triggerRefs.current.get(menuOpenFor);
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();

    // Default: place below trigger, right-aligned
    let top = rect.bottom + 4;
    let left = rect.right - MENU_WIDTH;

    // Flip up if no room below
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < MENU_HEIGHT + 16) {
      top = rect.top - MENU_HEIGHT - 4;
    }

    // Keep within viewport horizontally
    if (left < 8) left = 8;
    if (left + MENU_WIDTH > window.innerWidth - 8) {
      left = window.innerWidth - MENU_WIDTH - 8;
    }

    setMenuPos({ top, left });
  }, [menuOpenFor]);

  function startRename(s: SessionInfo) {
    setRenamingId(s.id);
    setRenameValue(s.title);
    setMenuOpenFor(null);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }

  const activeSession = menuOpenFor ? sessions.find((s) => s.id === menuOpenFor) : null;

  return (
    <div>
      <button
        onClick={onNew}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/40 hover:border-cyan-500/60 rounded-md py-2 transition-all mb-3"
      >
        <Plus className="w-3.5 h-3.5" />
        New chat
      </button>

      {sessions.length === 0 ? (
        <div className="text-[0.7rem] text-[var(--fg-muted)] font-mono italic px-2 py-3 text-center">
          no chats yet
        </div>
      ) : (
        <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
          {sessions.map((s) => {
            const isActive = s.id === activeId;
            const isRenaming = renamingId === s.id;
            const menuOpen = menuOpenFor === s.id;

            return (
              <div key={s.id} className="relative group">
                {isRenaming ? (
                  <div className="flex items-center gap-1 bg-[var(--bg-card)] border border-cyan-500/40 rounded-md px-2 py-1.5">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename();
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      onBlur={commitRename}
                      className="flex-1 bg-transparent text-xs text-[var(--fg-primary)] outline-none"
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={commitRename}
                      className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300"
                      aria-label="Save"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setRenamingId(null)}
                      className="text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)]"
                      aria-label="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onSelect(s.id)}
                      className={cn(
                        "w-full flex items-center gap-2 text-left pl-2 pr-7 py-1.5 rounded-md transition-all border",
                        isActive
                          ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-700 dark:text-cyan-200"
                          : "bg-transparent border-transparent text-[var(--fg-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--fg-primary)]"
                      )}
                    >
                      <MessageSquare
                        className={cn(
                          "w-3.5 h-3.5 shrink-0",
                          isActive && "text-cyan-600 dark:text-cyan-400"
                        )}
                      />
                      <span className="text-xs truncate flex-1">{s.title}</span>
                      <span className="text-[0.6rem] font-mono text-[var(--fg-muted)] shrink-0">
                        {relativeTime(s.updated_at)}
                      </span>
                    </button>
                    <button
                      ref={(el) => {
                        if (el) triggerRefs.current.set(s.id, el);
                        else triggerRefs.current.delete(s.id);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpenFor(menuOpen ? null : s.id);
                      }}
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-[var(--fg-tertiary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-hover)] transition",
                        isActive || menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}
                      aria-label="Chat options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Portaled menu — escapes the scrollable container's overflow */}
      {menuOpenFor && menuPos && activeSession && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                width: MENU_WIDTH,
                zIndex: 1000,
              }}
              className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md shadow-[0_8px_24px_rgb(0_0_0/0.2)] dark:shadow-[0_8px_24px_rgb(0_0_0/0.5)] overflow-hidden"
            >
              <button
                onClick={() => startRename(activeSession)}
                className="w-full text-left px-3 py-2 text-xs text-[var(--fg-primary)] hover:bg-[var(--bg-hover)] flex items-center gap-2"
              >
                <Pencil className="w-3 h-3" />
                Rename
              </button>
              <button
                onClick={() => {
                  const id = activeSession.id;
                  const title = activeSession.title;
                  setMenuOpenFor(null);
                  if (confirm(`Delete "${title}"?\n\nThis cannot be undone.`)) onDelete(id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

function relativeTime(epochSeconds: number): string {
  const diff = Date.now() / 1000 - epochSeconds;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d`;
  return `${Math.floor(diff / (86400 * 7))}w`;
}