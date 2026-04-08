import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  Edit2,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Save,
  Search,
  Shield,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useAddSecureNote,
  useDeleteSecureNote,
  useSecureNotes,
} from "../hooks/useQueries";
import type { SecureNote } from "../types";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VaultPage() {
  const { t } = useLanguage();
  const { data: notes = [], isLoading } = useSecureNotes();
  const { mutate: addNote, isPending: isAdding } = useAddSecureNote();
  const { mutate: deleteNote, isPending: isDeleting } = useDeleteSecureNote();

  // Panel state
  const [selectedNote, setSelectedNote] = useState<SecureNote | null>(null);
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Add note dialog
  const [showAdd, setShowAdd] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const resetAddForm = () => {
    setNewNote({ title: "", content: "" });
    setSelectedFile(null);
    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddNote = () => {
    if (!newNote.title || !newNote.content) {
      toast.error("Title and content required");
      return;
    }
    setUploadProgress(selectedFile ? 0 : null);
    addNote(
      {
        title: newNote.title,
        content: newNote.content,
        file: selectedFile,
        onUploadProgress: selectedFile
          ? (pct) => setUploadProgress(pct)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Note saved!");
          resetAddForm();
          setShowAdd(false);
        },
        onError: (e) => {
          setUploadProgress(null);
          toast.error(`${t.error}: ${e.message}`);
        },
      },
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File too large. Maximum size is 10 MB (your file: ${formatFileSize(file.size)})`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSelectNote = (note: SecureNote) => {
    setSelectedNote(note);
    setIsEditing(false);
    setMobileShowDetail(true);
  };

  const handleDeleteNote = (note: SecureNote) => {
    deleteNote(note.title, {
      onSuccess: () => {
        toast.success("Note deleted");
        if (selectedNote?.title === note.title) {
          setSelectedNote(null);
          setMobileShowDetail(false);
        }
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleStartEdit = () => {
    if (!selectedNote) return;
    setEditTitle(selectedNote.title);
    setEditContent(selectedNote.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    // Note: backend doesn't have updateSecureNote — we delete + re-add
    if (!selectedNote) return;
    deleteNote(selectedNote.title, {
      onSuccess: () => {
        addNote(
          {
            title: editTitle,
            content: editContent,
            file: null,
          },
          {
            onSuccess: () => {
              toast.success("Note updated!");
              setSelectedNote({
                ...selectedNote,
                title: editTitle,
                content: editContent,
              });
              setIsEditing(false);
            },
            onError: (e) => toast.error(`Save failed: ${e.message}`),
          },
        );
      },
      onError: (e) => toast.error(`Update failed: ${e.message}`),
    });
  };

  return (
    <div className="flex flex-col h-full gap-0" style={{ minHeight: 0 }}>
      {/* Page header */}
      <div className="flex items-center justify-between px-1 pb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
            {t.vaultTitle}
          </h1>
          <p className="text-sm" style={{ color: "#9BB0C9" }}>
            Encrypted on-chain storage
          </p>
        </div>
      </div>

      {/* 2-panel layout */}
      <div
        className="flex flex-1 rounded-2xl overflow-hidden"
        style={{
          background: "rgba(13,31,58,0.5)",
          border: "1px solid rgba(26,51,84,0.8)",
          minHeight: 0,
        }}
      >
        {/* LEFT PANEL — List */}
        <div
          className={`flex flex-col flex-shrink-0 ${mobileShowDetail ? "hidden md:flex" : "flex"} w-full md:w-80`}
          style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}
        >
          {/* List header */}
          <div
            className="flex items-center justify-between px-4 py-3 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "#9BB0C9" }}
            >
              Notes ({filteredNotes.length})
            </span>
            <button
              type="button"
              data-ocid="vault.add_note.primary_button"
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
              style={{
                background: "rgba(168,85,247,0.18)",
                color: "#C084FC",
                border: "1px solid rgba(168,85,247,0.35)",
              }}
            >
              <Plus size={12} />
              {t.vaultAddNote}
            </button>
          </div>

          {/* Search */}
          <div
            className="px-3 py-2.5 flex-shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#4A6480" }}
              />
              <input
                data-ocid="vault.search.input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all"
                style={{
                  background: "rgba(7,20,39,0.7)",
                  border: "1px solid rgba(26,51,84,0.8)",
                  color: "#EAF2FF",
                }}
              />
            </div>
          </div>

          {/* Note list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div
                className="flex items-center gap-2 px-4 py-8"
                data-ocid="vault.loading_state"
              >
                <Loader2
                  className="animate-spin"
                  size={16}
                  style={{ color: "#A855F7" }}
                />
                <span className="text-sm" style={{ color: "#9BB0C9" }}>
                  {t.loading}
                </span>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center py-12 px-4 text-center"
                data-ocid="vault.notes.empty_state"
              >
                <FileText
                  size={32}
                  className="mb-3 opacity-25"
                  style={{ color: "#A855F7" }}
                />
                <p className="text-sm" style={{ color: "#9BB0C9" }}>
                  {searchQuery ? "No notes match your search" : t.noData}
                </p>
                {!searchQuery && (
                  <button
                    type="button"
                    onClick={() => setShowAdd(true)}
                    className="mt-3 text-xs underline underline-offset-2"
                    style={{ color: "#A855F7" }}
                  >
                    Create your first note
                  </button>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredNotes.map((note, i) => {
                  const isActive = selectedNote?.title === note.title;
                  return (
                    <motion.button
                      key={note.title}
                      type="button"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ delay: i * 0.04 }}
                      data-ocid={`vault.notes.item.${i + 1}`}
                      onClick={() => handleSelectNote(note)}
                      className="w-full text-left px-4 py-3 transition-all relative"
                      style={{
                        background: isActive
                          ? "rgba(168,85,247,0.1)"
                          : "transparent",
                        borderLeft: isActive
                          ? "3px solid #A855F7"
                          : "3px solid transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p
                              className="text-sm font-semibold truncate"
                              style={{
                                color: isActive ? "#C084FC" : "#EAF2FF",
                              }}
                            >
                              {note.title}
                            </p>
                            {note.blob && (
                              <Paperclip
                                size={10}
                                className="flex-shrink-0"
                                style={{ color: "#22D3EE" }}
                              />
                            )}
                          </div>
                          <p
                            className="text-xs line-clamp-2 leading-relaxed"
                            style={{ color: "#6B8BA8" }}
                          >
                            {note.content.slice(0, 80)}
                            {note.content.length > 80 ? "…" : ""}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Detail */}
        <div
          className={`flex-1 flex flex-col min-w-0 ${!mobileShowDetail ? "hidden md:flex" : "flex"}`}
        >
          {/* Mobile back button */}
          {mobileShowDetail && (
            <div
              className="flex md:hidden items-center px-4 py-3 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setMobileShowDetail(false);
                  setIsEditing(false);
                }}
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "#9BB0C9" }}
              >
                <ArrowLeft size={15} />
                Back to list
              </button>
            </div>
          )}

          {!selectedNote ? (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: "rgba(168,85,247,0.08)",
                  border: "1px solid rgba(168,85,247,0.15)",
                }}
              >
                <Shield size={28} style={{ color: "rgba(168,85,247,0.5)" }} />
              </div>
              <p className="font-medium mb-1" style={{ color: "#EAF2FF" }}>
                Select a note to view details
              </p>
              <p className="text-sm" style={{ color: "#6B8BA8" }}>
                Your encrypted notes are stored securely on-chain
              </p>
            </div>
          ) : (
            /* Note detail */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Detail header */}
              <div
                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(168,85,247,0.12)",
                      border: "1px solid rgba(168,85,247,0.2)",
                    }}
                  >
                    <FileText size={16} style={{ color: "#A855F7" }} />
                  </div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="text-lg font-bold bg-transparent outline-none border-b min-w-0"
                      style={{
                        color: "#EAF2FF",
                        borderColor: "rgba(168,85,247,0.5)",
                        width: "100%",
                      }}
                    />
                  ) : (
                    <h2
                      className="text-lg font-bold truncate"
                      style={{ color: "#EAF2FF" }}
                    >
                      {selectedNote.title}
                    </h2>
                  )}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-all hover:bg-white/5"
                        style={{
                          color: "#9BB0C9",
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}
                      >
                        <X size={12} />
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(168,85,247,0.2)",
                          color: "#C084FC",
                          border: "1px solid rgba(168,85,247,0.35)",
                        }}
                      >
                        <Save size={12} />
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        data-ocid="vault.detail.edit_button"
                        onClick={handleStartEdit}
                        className="p-2 rounded-lg transition-all hover:bg-white/5"
                        style={{ color: "#9BB0C9" }}
                        aria-label="Edit note"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        data-ocid="vault.notes.delete_button"
                        onClick={() => handleDeleteNote(selectedNote)}
                        disabled={isDeleting}
                        className="p-2 rounded-lg transition-all hover:bg-red-500/10"
                        style={{ color: "#9BB0C9" }}
                        aria-label="Delete note"
                      >
                        {isDeleting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Note content */}
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {isEditing ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={14}
                    className="w-full resize-none text-sm leading-relaxed"
                    style={{
                      background: "rgba(7,20,39,0.6)",
                      border: "1px solid rgba(168,85,247,0.25)",
                      color: "#EAF2FF",
                    }}
                  />
                ) : (
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: "#CBD5E1" }}
                  >
                    {selectedNote.content}
                  </p>
                )}

                {/* Attachment */}
                {selectedNote.blob && !isEditing && (
                  <div
                    className="mt-6 pt-5"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p
                      className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: "#6B8BA8" }}
                    >
                      Attachment
                    </p>
                    <a
                      href={selectedNote.blob.getDirectURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="vault.view_note.secondary_button"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
                      style={{
                        background: "rgba(34,211,238,0.08)",
                        border: "1px solid rgba(34,211,238,0.2)",
                        color: "#22D3EE",
                        textDecoration: "none",
                      }}
                    >
                      <Download size={14} />
                      Download Attachment
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Note Dialog */}
      <Dialog
        open={showAdd}
        onOpenChange={(open) => {
          if (!open) resetAddForm();
          setShowAdd(open);
        }}
      >
        <DialogContent
          data-ocid="vault.add_note.dialog"
          style={{
            background: "#0D1F3A",
            border: "1px solid rgba(168,85,247,0.2)",
            color: "#EAF2FF",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              {t.vaultAddNote}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div>
              <Label
                htmlFor="vault-note-title"
                className="text-xs mb-1 block"
                style={{ color: "#9BB0C9" }}
              >
                {t.vaultNoteTitle}
              </Label>
              <Input
                id="vault-note-title"
                data-ocid="vault.note_title.input"
                value={newNote.title}
                onChange={(e) =>
                  setNewNote((p) => ({ ...p, title: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>
            <div>
              <Label
                htmlFor="vault-note-content"
                className="text-xs mb-1 block"
                style={{ color: "#9BB0C9" }}
              >
                {t.vaultNoteContent}
              </Label>
              <Textarea
                id="vault-note-content"
                data-ocid="vault.note_content.textarea"
                value={newNote.content}
                onChange={(e) =>
                  setNewNote((p) => ({ ...p, content: e.target.value }))
                }
                rows={6}
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                  resize: "none",
                }}
              />
            </div>

            {/* File Attachment Section */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs" style={{ color: "#9BB0C9" }}>
                  Attachment (optional)
                </Label>
                <span className="text-xs" style={{ color: "#4A6480" }}>
                  Max 10 MB · 1 file per note
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                className="hidden"
                onChange={handleFileChange}
                id="vault-note-file"
              />
              {selectedFile ? (
                <div
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg"
                  style={{
                    background: "rgba(34,211,238,0.06)",
                    border: "1px solid rgba(34,211,238,0.2)",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip
                      size={13}
                      style={{ color: "#22D3EE", flexShrink: 0 }}
                    />
                    <span
                      className="text-xs truncate"
                      style={{ color: "#EAF2FF" }}
                    >
                      {selectedFile.name}
                    </span>
                    <span
                      className="text-xs flex-shrink-0"
                      style={{ color: "#9BB0C9" }}
                    >
                      ({formatFileSize(selectedFile.size)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-0.5 rounded hover:bg-white/10 flex-shrink-0"
                    style={{ color: "#9BB0C9" }}
                    aria-label="Remove file"
                  >
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-ocid="vault.dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
                  style={{
                    background: "rgba(13,31,58,0.6)",
                    border: "1px dashed rgba(26,51,84,0.8)",
                    color: "#9BB0C9",
                  }}
                >
                  <Upload size={13} />
                  Choose file to attach
                </button>
              )}

              {uploadProgress !== null && (
                <div className="mt-2" data-ocid="vault.add_note.loading_state">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: "#9BB0C9" }}>
                      Uploading...
                    </span>
                    <span className="text-xs" style={{ color: "#22D3EE" }}>
                      {uploadProgress}%
                    </span>
                  </div>
                  <Progress
                    value={uploadProgress}
                    className="h-1.5"
                    style={{ background: "rgba(26,51,84,0.8)" }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                data-ocid="vault.add_note.cancel_button"
                variant="outline"
                onClick={() => {
                  resetAddForm();
                  setShowAdd(false);
                }}
                className="flex-1 rounded-full"
                style={{
                  borderColor: "#1A3354",
                  color: "#9BB0C9",
                  background: "transparent",
                }}
              >
                {t.cancel}
              </Button>
              <Button
                data-ocid="vault.add_note.submit_button"
                onClick={handleAddNote}
                disabled={isAdding}
                className="flex-1 rounded-full font-semibold"
                style={{ background: "#A855F7", color: "#fff" }}
              >
                {isAdding ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
