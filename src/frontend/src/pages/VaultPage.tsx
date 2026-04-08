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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Eye,
  FileText,
  Loader2,
  Paperclip,
  Plus,
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
  const { mutate: deleteNote } = useDeleteSecureNote();

  const [showAdd, setShowAdd] = useState(false);
  const [viewNote, setViewNote] = useState<SecureNote | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
            {t.vaultTitle}
          </h1>
          <p className="text-sm" style={{ color: "#9BB0C9" }}>
            Encrypted on-chain storage
          </p>
        </div>
      </div>

      <Tabs defaultValue="notes">
        <TabsList
          className="mb-4"
          style={{ background: "#0D1F3A", border: "1px solid #1A3354" }}
        >
          <TabsTrigger
            data-ocid="vault.notes.tab"
            value="notes"
            style={{ color: "#9BB0C9" }}
          >
            <FileText size={14} className="mr-1" />
            {t.vaultNotes} ({notes.length})
          </TabsTrigger>
          <TabsTrigger
            data-ocid="vault.files.tab"
            value="files"
            style={{ color: "#9BB0C9" }}
          >
            Files
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="flex justify-end mb-3">
            <Button
              data-ocid="vault.add_note.primary_button"
              onClick={() => setShowAdd(true)}
              className="rounded-full text-sm h-9 font-semibold"
              style={{ background: "#22D3EE", color: "#071427" }}
            >
              <Plus size={14} className="mr-1" />
              {t.vaultAddNote}
            </Button>
          </div>

          {isLoading ? (
            <div
              className="flex items-center gap-2 py-8"
              data-ocid="vault.loading_state"
            >
              <Loader2
                className="animate-spin"
                size={18}
                style={{ color: "#22D3EE" }}
              />
              <span style={{ color: "#9BB0C9" }}>{t.loading}</span>
            </div>
          ) : notes.length === 0 ? (
            <div
              className="text-center py-16"
              data-ocid="vault.notes.empty_state"
            >
              <FileText
                size={40}
                className="mx-auto mb-3 opacity-30"
                style={{ color: "#A855F7" }}
              />
              <p style={{ color: "#9BB0C9" }}>{t.noData}</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {notes.map((note, i) => (
                  <motion.div
                    key={note.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    data-ocid={`vault.notes.item.${i + 1}`}
                    className="card-gradient-border p-4"
                    style={{
                      boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
                      cursor: "pointer",
                    }}
                    onClick={() => setViewNote(note)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            background: "rgba(168,85,247,0.12)",
                            border: "1px solid rgba(168,85,247,0.2)",
                          }}
                        >
                          <FileText size={14} style={{ color: "#A855F7" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p
                              className="text-sm font-semibold"
                              style={{ color: "#EAF2FF" }}
                            >
                              {note.title}
                            </p>
                            {note.blob && (
                              <span
                                className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full"
                                style={{
                                  background: "rgba(34,211,238,0.1)",
                                  border: "1px solid rgba(34,211,238,0.25)",
                                  color: "#22D3EE",
                                }}
                              >
                                <Paperclip size={9} />
                                attachment
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs truncate max-w-48"
                            style={{ color: "#9BB0C9" }}
                          >
                            {note.content.slice(0, 60)}
                            {note.content.length > 60 ? "..." : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewNote(note);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5"
                          style={{ color: "#9BB0C9" }}
                          aria-label="View note"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNote(note.title, {
                              onSuccess: () => toast.success("Note deleted"),
                              onError: (err) => toast.error(err.message),
                            });
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-500/10"
                          style={{ color: "#9BB0C9" }}
                          data-ocid={`vault.notes.delete_button.${i + 1}`}
                          aria-label="Delete note"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>

        <TabsContent value="files">
          <div
            className="text-center py-16 rounded-2xl"
            data-ocid="vault.files.empty_state"
            style={{
              background: "rgba(13,31,58,0.5)",
              border: "1px dashed #1A3354",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.15)",
              }}
            >
              <FileText size={22} style={{ color: "#22D3EE" }} />
            </div>
            <p className="font-medium" style={{ color: "#EAF2FF" }}>
              File storage
            </p>
            <p className="text-sm mt-1" style={{ color: "#9BB0C9" }}>
              Secure file uploads powered by blob storage
            </p>
            <Button
              data-ocid="vault.upload_button"
              className="mt-4 rounded-full text-sm h-9"
              style={{
                background: "transparent",
                border: "1px solid rgba(34,211,238,0.3)",
                color: "#22D3EE",
              }}
            >
              {t.vaultUploadFile}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

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

              {/* Upload progress */}
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
                    style={{
                      background: "rgba(26,51,84,0.8)",
                    }}
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

      {/* View Note Dialog */}
      <Dialog open={!!viewNote} onOpenChange={() => setViewNote(null)}>
        <DialogContent
          data-ocid="vault.view_note.dialog"
          style={{
            background: "#0D1F3A",
            border: "1px solid rgba(168,85,247,0.2)",
            color: "#EAF2FF",
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              {viewNote?.title}
            </DialogTitle>
          </DialogHeader>
          <div
            className="mt-2 p-4 rounded-xl text-sm whitespace-pre-wrap"
            style={{
              background: "#071427",
              border: "1px solid #1A3354",
              color: "#EAF2FF",
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {viewNote?.content}
          </div>

          {/* Download attachment if present */}
          {viewNote?.blob && (
            <a
              href={viewNote.blob.getDirectURL()}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid="vault.view_note.secondary_button"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.25)",
                color: "#22D3EE",
                textDecoration: "none",
              }}
            >
              <Download size={14} />
              Download Attachment
            </a>
          )}

          <Button
            data-ocid="vault.view_note.close_button"
            onClick={() => setViewNote(null)}
            className="rounded-full mt-1"
            style={{
              background: "transparent",
              border: "1px solid #1A3354",
              color: "#9BB0C9",
            }}
          >
            {t.close}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
