"use client";

import { Database, FileText, Plus, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  deleteDocument,
  listDocuments,
  reindex,
  uploadDocument,
  type DocumentInfo,
} from "@/lib/api";
import { cn } from "@/lib/utils";

// Matches the backend's SUPPORTED_EXTENSIONS in app/rag/ingestion.py
const ACCEPTED_TYPES = ".pdf,.txt,.md,.docx";
const MAX_FILE_MB = 10;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentManager() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // filename being uploaded
  const [deleting, setDeleting] = useState<string | null>(null); // filename being deleted
  const [reindexing, setReindexing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDocs(await listDocuments());
    } catch (e) {
      console.warn("Failed to list documents:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so the user can upload the same file again later if they want.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    // Client-side guard so users get fast feedback for obvious problems.
    // The backend enforces the same limits authoritatively.
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || "";
    if (!ACCEPTED_TYPES.split(",").includes(ext)) {
      alert(`Unsupported file type. Accepted: ${ACCEPTED_TYPES}`);
      return;
    }

    setUploading(file.name);
    try {
      await uploadDocument(file);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Delete "${filename}"? This removes it from your search index too.`)) {
      return;
    }
    setDeleting(filename);
    try {
      await deleteDocument(filename);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(null);
    }
  };

  const handleReindex = async () => {
    if (
      !window.confirm(
        "Rebuild the index from your uploaded files? This wipes the search index and re-embeds everything.",
      )
    ) {
      return;
    }
    setReindexing(true);
    try {
      const res = await reindex();
      alert(res.message);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Re-index failed");
    } finally {
      setReindexing(false);
    }
  };

  return (
    <div>
      {/* Upload row */}
      <button
        onClick={handleUploadClick}
        disabled={uploading !== null}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-bright)] border border-[var(--accent)] rounded-md py-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {uploading ? (
          <>
            <span className="block w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            <span className="truncate max-w-[180px]">Indexing {uploading}…</span>
          </>
        ) : (
          <>
            <Plus className="w-3.5 h-3.5" />
            Upload document
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileSelected}
        className="hidden"
      />
      <div className="mt-1.5 text-[0.62rem] text-[var(--fg-muted)] font-mono text-center">
        pdf · txt · md · docx · max {MAX_FILE_MB}MB
      </div>

      {/* Document list */}
      <div className="mt-3">
        {loading ? (
          <div className="text-[0.7rem] text-[var(--fg-tertiary)] font-mono italic px-2 py-2">
            loading…
          </div>
        ) : docs.length === 0 ? (
          <div className="text-[0.7rem] text-[var(--fg-tertiary)] italic px-2 py-3 text-center bg-[var(--bg-card)] border border-dashed border-[var(--border-subtle)] rounded-md">
            No documents yet.
            <br />
            Upload one to enable RAG search.
          </div>
        ) : (
          <ul className="space-y-1">
            {docs.map((doc) => (
              <li
                key={doc.filename}
                className={cn(
                  "group flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/30 transition",
                  deleting === doc.filename && "opacity-50",
                )}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--fg-tertiary)] shrink-0" />
                <div className="min-w-0 flex-1">
                  <div
                    className="text-xs font-medium text-[var(--fg-primary)] truncate"
                    title={doc.filename}
                  >
                    {doc.filename}
                  </div>
                  <div className="text-[0.62rem] text-[var(--fg-tertiary)] font-mono">
                    {formatBytes(doc.size_bytes)} · {doc.chunks_indexed} chunks
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(doc.filename)}
                  disabled={deleting !== null}
                  className="text-[var(--fg-tertiary)] hover:text-red-500 transition p-1 rounded shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Delete document"
                  aria-label={`Delete ${doc.filename}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Rebuild index (advanced / debugging) */}
      {docs.length > 0 && (
        <button
          onClick={handleReindex}
          disabled={reindexing || uploading !== null}
          className="mt-3 w-full flex items-center justify-center gap-2 text-[0.7rem] font-medium text-[var(--fg-secondary)] hover:text-[var(--accent)] border border-[var(--border-subtle)] hover:border-[var(--accent)]/40 rounded-md py-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {reindexing ? (
            <>
              <Database className="w-3 h-3 animate-pulse" />
              Rebuilding…
            </>
          ) : (
            <>
              <RotateCcw className="w-3 h-3" />
              Rebuild index
            </>
          )}
        </button>
      )}
    </div>
  );
}