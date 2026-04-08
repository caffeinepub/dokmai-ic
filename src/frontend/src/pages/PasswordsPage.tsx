import { Badge } from "@/components/ui/badge";
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Paperclip,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Shield,
  Square,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import PasswordGenerator from "../components/passwords/PasswordGenerator";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useAddPassword,
  useBulkDeletePasswords,
  useDeletePassword,
  usePasswordEntries,
  usePasswordHistory,
  useUpdatePassword,
} from "../hooks/useQueries";
import type { PasswordEntry } from "../hooks/useQueries";
import { useTotpCode } from "../hooks/useTotpCode";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface CustomField {
  name: string;
  value: string;
  fieldType: string;
}

interface CustomFieldWithId extends CustomField {
  _id: number;
}

// ─── TOTP Display ───────────────────────────────────────────────────────────

function TotpDisplay({ secret }: { secret: string }) {
  const { code, secondsRemaining, isLoading } = useTotpCode(secret);

  const copyCode = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success("TOTP code copied");
  }, [code]);

  const progress = (secondsRemaining / 30) * 100;
  const isUrgent = secondsRemaining <= 5;

  return (
    <div
      className="rounded-lg px-3 py-2"
      style={{
        background: "rgba(168,85,247,0.06)",
        border: "1px solid rgba(168,85,247,0.2)",
      }}
    >
      <div className="flex items-center gap-2">
        <Shield size={12} style={{ color: "#A855F7" }} />
        <span className="text-xs" style={{ color: "#A855F7" }}>
          2FA
        </span>
        <div className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <span
              className="text-xs font-mono tracking-widest"
              style={{ color: "#A855F7" }}
            >
              ···
            </span>
          ) : code ? (
            <span
              className="text-sm font-mono font-bold select-all"
              style={{ color: "#A855F7", letterSpacing: "0.25em" }}
            >
              {code.slice(0, 3)}&nbsp;{code.slice(3)}
            </span>
          ) : (
            <span className="text-xs font-mono" style={{ color: "#6b7280" }}>
              Invalid key
            </span>
          )}
        </div>
        <span
          className="text-xs tabular-nums"
          style={{ color: isUrgent ? "#ef4444" : "#9BB0C9" }}
        >
          {secondsRemaining}s
        </span>
        <button
          type="button"
          onClick={copyCode}
          disabled={!code}
          className="p-0.5 rounded hover:bg-white/5 transition-colors disabled:opacity-40"
          style={{ color: "#A855F7" }}
          aria-label="Copy TOTP code"
        >
          <Copy size={12} />
        </button>
      </div>
      <div
        className="mt-1.5 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(168,85,247,0.15)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: isUrgent ? "#ef4444" : "#A855F7",
          }}
        />
      </div>
    </div>
  );
}

// ─── Password History Panel ──────────────────────────────────────────────────

function PasswordHistoryPanel({
  title,
  currentEntry,
  onRestored,
}: {
  title: string;
  currentEntry: PasswordEntry;
  onRestored: () => void;
}) {
  const { data: history = [], isLoading } = usePasswordHistory(title, true);
  const { mutate: updatePassword, isPending: isRestoring } =
    useUpdatePassword();
  const [shownEntries, setShownEntries] = useState<Set<string>>(new Set());

  const toggleShow = (key: string) => {
    setShownEntries((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleCopy = async (password: string) => {
    await navigator.clipboard.writeText(password);
    toast.success("Password copied from history");
  };

  const handleRestore = (password: string) => {
    updatePassword(
      {
        title: currentEntry.title,
        username: currentEntry.username,
        password,
        url: currentEntry.url,
        notes: currentEntry.notes,
        email: currentEntry.email,
        category: currentEntry.category,
        totp: currentEntry.totp,
        customFields: currentEntry.customFields,
        existingBlob: currentEntry.blob,
      },
      {
        onSuccess: () => {
          toast.success("Password restored!");
          onRestored();
        },
        onError: (e) => toast.error(`Restore failed: ${e.message}`),
      },
    );
  };

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: "#071427", border: "1px solid #1A3354" }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderBottom: "1px solid #1A3354" }}
      >
        <Clock size={12} style={{ color: "#22D3EE" }} />
        <span className="text-xs font-semibold" style={{ color: "#22D3EE" }}>
          Password History
        </span>
        <span className="ml-auto text-xs" style={{ color: "#9BB0C9" }}>
          Up to 10 versions
        </span>
      </div>
      <div className="px-3 py-2">
        {isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-4"
            data-ocid="passwords.history.loading_state"
          >
            <Loader2
              size={14}
              className="animate-spin"
              style={{ color: "#22D3EE" }}
            />
            <span className="text-xs" style={{ color: "#9BB0C9" }}>
              Loading history...
            </span>
          </div>
        ) : history.length === 0 ? (
          <div
            className="flex items-center justify-center py-4"
            data-ocid="passwords.history.empty_state"
          >
            <p className="text-xs" style={{ color: "#9BB0C9" }}>
              No history yet. Updates are recorded here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {history.map((entry, idx) => {
              const histKey = entry.changedAt.toString();
              const isShown = shownEntries.has(histKey);
              const dateStr = new Date(
                Number(entry.changedAt / BigInt(1_000_000)),
              ).toLocaleString();
              const maskedPwd = "•".repeat(Math.min(entry.password.length, 20));
              return (
                <div
                  key={histKey}
                  data-ocid={`passwords.history.item.${idx + 1}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(26,51,84,0.6)",
                  }}
                >
                  <span
                    className="flex-1 font-mono text-xs truncate"
                    style={{ color: isShown ? "#22D3EE" : "#9BB0C9" }}
                  >
                    {isShown ? entry.password : maskedPwd}
                  </span>
                  <span
                    className="text-xs shrink-0 tabular-nums"
                    style={{ color: "#9BB0C9", fontSize: "0.65rem" }}
                  >
                    {dateStr}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleShow(histKey)}
                    className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
                    style={{ color: "#9BB0C9" }}
                    aria-label={isShown ? "Hide" : "Show"}
                    data-ocid={`passwords.history.toggle.${idx + 1}`}
                  >
                    {isShown ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(entry.password)}
                    className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
                    style={{ color: "#9BB0C9" }}
                    aria-label="Copy"
                    data-ocid={`passwords.history.copy.${idx + 1}`}
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestore(entry.password)}
                    disabled={isRestoring}
                    className="p-1 rounded hover:bg-cyan-500/10 transition-colors shrink-0 disabled:opacity-40"
                    style={{ color: "#22D3EE" }}
                    aria-label="Restore"
                    data-ocid={`passwords.history.restore.${idx + 1}`}
                  >
                    {isRestoring ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <RotateCcw size={12} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailPanel({
  entry,
  onClose,
  onDeleted,
  onEditRequest,
}: {
  entry: PasswordEntry;
  onClose?: () => void;
  onDeleted: () => void;
  onEditRequest: (entry: PasswordEntry) => void;
}) {
  const { t } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [shownCustomFields, setShownCustomFields] = useState<Set<string>>(
    new Set(),
  );
  const { mutate: deleteEntry, isPending: isDeleting } = useDeletePassword();

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const toggleCustomField = (key: string) => {
    setShownCustomFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleDelete = () => {
    deleteEntry(entry.title, {
      onSuccess: () => {
        toast.success("Password deleted");
        onDeleted();
      },
      onError: (e) => toast.error(`${t.error}: ${e.message}`),
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Detail header */}
      <div
        className="flex items-center gap-3 px-5 py-4 shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors mr-1"
            style={{ color: "#9BB0C9" }}
            aria-label="Back to list"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2
            className="font-bold text-base truncate"
            style={{ color: "#EAF2FF" }}
          >
            {entry.title}
          </h2>
          {entry.url && (
            <a
              href={
                entry.url.startsWith("http")
                  ? entry.url
                  : `https://${entry.url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs mt-0.5 hover:underline truncate"
              style={{ color: "#22D3EE" }}
            >
              <ExternalLink size={11} />
              <span className="truncate">{entry.url}</span>
            </a>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {entry.category && (
            <Badge
              className="text-[10px] px-1.5 py-0 h-4 font-normal"
              style={{
                background: "rgba(34,211,238,0.1)",
                color: "#22D3EE",
                border: "1px solid rgba(34,211,238,0.2)",
              }}
            >
              <Tag size={8} className="mr-0.5" />
              {entry.category}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => onEditRequest(entry)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#9BB0C9" }}
            aria-label="Edit password"
            data-ocid="passwords.detail.edit_button"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-40"
            style={{ color: "#ef4444" }}
            aria-label={t.pwdDelete}
            data-ocid="passwords.detail.delete_button"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#1A3354 transparent",
        }}
      >
        {/* Username + Email */}
        <div className="flex flex-col gap-3">
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Username
            </p>
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1A3354",
              }}
            >
              <span
                className="flex-1 text-sm font-mono truncate"
                style={{ color: "#EAF2FF" }}
              >
                {entry.username || <span style={{ color: "#9BB0C9" }}>—</span>}
              </span>
              {entry.username && (
                <button
                  type="button"
                  onClick={() => copyText(entry.username, "Username")}
                  className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
                  style={{ color: "#9BB0C9" }}
                  aria-label="Copy username"
                  data-ocid="passwords.detail.copy_username"
                >
                  <Copy size={12} />
                </button>
              )}
            </div>
          </div>

          {entry.email && (
            <div>
              <p
                className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
                style={{ color: "#9BB0C9" }}
              >
                Email
              </p>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #1A3354",
                }}
              >
                <Mail
                  size={12}
                  style={{ color: "#9BB0C9" }}
                  className="shrink-0"
                />
                <span
                  className="flex-1 text-sm truncate"
                  style={{ color: "#EAF2FF" }}
                >
                  {entry.email}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(entry.email, "Email")}
                  className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
                  style={{ color: "#9BB0C9" }}
                  aria-label="Copy email"
                  data-ocid="passwords.detail.copy_email"
                >
                  <Copy size={12} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Password */}
        <div>
          <p
            className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
            style={{ color: "#9BB0C9" }}
          >
            Password
          </p>
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid #1A3354",
            }}
          >
            <span
              className="flex-1 font-mono text-sm truncate"
              style={{ color: showPwd ? "#22D3EE" : "#9BB0C9" }}
            >
              {showPwd
                ? entry.password
                : "•".repeat(Math.min(entry.password.length, 24))}
            </span>
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
              style={{ color: "#9BB0C9" }}
              aria-label={showPwd ? t.pwdHide : t.pwdShow}
              data-ocid="passwords.detail.toggle_password"
            >
              {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              type="button"
              onClick={() => copyText(entry.password, "Password")}
              className="p-1 rounded hover:bg-white/5 transition-colors shrink-0"
              style={{ color: "#9BB0C9" }}
              aria-label={t.pwdCopy}
              data-ocid="passwords.detail.copy_password"
            >
              <Copy size={13} />
            </button>
          </div>
        </div>

        {/* TOTP */}
        {entry.totp && (
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Two-Factor Auth (TOTP)
            </p>
            <TotpDisplay secret={entry.totp} />
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Notes
            </p>
            <div
              className="px-3 py-2.5 rounded-lg text-sm"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1A3354",
                color: "#EAF2FF",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {entry.notes}
            </div>
          </div>
        )}

        {/* Custom Fields */}
        {entry.customFields && entry.customFields.length > 0 && (
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Custom Fields
            </p>
            <div className="flex flex-col gap-2">
              {entry.customFields.map((cf, pos) => {
                const cfKey = `${cf.name}-${pos}`;
                const isShown = shownCustomFields.has(cfKey);
                return (
                  <div
                    key={cfKey}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid #1A3354",
                    }}
                  >
                    <span
                      className="text-xs font-medium shrink-0"
                      style={{ color: "#9BB0C9" }}
                    >
                      {cf.name}:
                    </span>
                    <span
                      className="flex-1 font-mono truncate"
                      style={{ color: "#EAF2FF" }}
                    >
                      {cf.fieldType === "password" && !isShown
                        ? "•".repeat(Math.min(cf.value.length, 16))
                        : cf.value}
                    </span>
                    {cf.fieldType === "password" && (
                      <button
                        type="button"
                        onClick={() => toggleCustomField(cfKey)}
                        className="p-0.5 rounded hover:bg-white/5"
                        style={{ color: "#9BB0C9" }}
                        aria-label="Toggle"
                      >
                        {isShown ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                    )}
                    {cf.fieldType === "url" && (
                      <a
                        href={
                          cf.value.startsWith("http")
                            ? cf.value
                            : `https://${cf.value}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink size={11} style={{ color: "#9BB0C9" }} />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* File Attachment */}
        {entry.blob && (
          <div>
            <p
              className="text-[10px] uppercase tracking-wider mb-1.5 font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Attachment
            </p>
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{
                background: "rgba(34,211,238,0.04)",
                border: "1px solid rgba(34,211,238,0.15)",
              }}
            >
              <Paperclip size={13} style={{ color: "#22D3EE" }} />
              <span
                className="flex-1 text-sm truncate"
                style={{ color: "#EAF2FF" }}
              >
                Attached file
              </span>
              <button
                type="button"
                onClick={() =>
                  window.open(entry.blob!.getDirectURL(), "_blank")
                }
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors hover:bg-cyan-500/20"
                style={{
                  background: "rgba(34,211,238,0.1)",
                  color: "#22D3EE",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}
                aria-label="Download attachment"
                data-ocid="passwords.detail.download_attachment"
              >
                <Download size={11} />
                Download
              </button>
            </div>
          </div>
        )}

        {/* Password History (collapsible) */}
        <div>
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex items-center gap-2 w-full text-left"
            data-ocid="passwords.detail.history_toggle"
          >
            <Clock size={12} style={{ color: "#22D3EE" }} />
            <span
              className="text-[10px] uppercase tracking-wider font-medium"
              style={{ color: "#9BB0C9" }}
            >
              Password History
            </span>
            <span className="ml-auto" style={{ color: "#9BB0C9" }}>
              {showHistory ? (
                <ChevronDown size={13} />
              ) : (
                <ChevronRight size={13} />
              )}
            </span>
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}
                className="mt-2"
              >
                <PasswordHistoryPanel
                  title={entry.title}
                  currentEntry={entry}
                  onRestored={() => setShowHistory(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Dialog ─────────────────────────────────────────────────────────────

function EditPasswordDialog({
  entry,
  open,
  onOpenChange,
}: {
  entry: PasswordEntry | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { t } = useLanguage();
  const { mutate: updatePassword, isPending: isSaving } = useUpdatePassword();
  const cfCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toFormFields = (e: PasswordEntry): CustomFieldWithId[] =>
    (e.customFields ?? []).map((cf) => ({ ...cf, _id: ++cfCounter.current }));

  const [form, setForm] = useState<{
    title: string;
    username: string;
    password: string;
    url: string;
    notes: string;
    email: string;
    category: string;
    totp: string;
    customFields: CustomFieldWithId[];
  }>(() =>
    entry
      ? { ...entry, customFields: toFormFields(entry) }
      : {
          title: "",
          username: "",
          password: "",
          url: "",
          notes: "",
          email: "",
          category: "",
          totp: "",
          customFields: [],
        },
  );
  const [showPwd, setShowPwd] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [visibleCustomFields, setVisibleCustomFields] = useState<Set<number>>(
    new Set(),
  );

  // Sync form when entry changes
  const prevEntryRef = useRef<PasswordEntry | null>(null);
  if (entry && entry !== prevEntryRef.current) {
    prevEntryRef.current = entry;
    setForm({ ...entry, customFields: toFormFields(entry) });
    setAttachedFile(null);
    setUploadProgress(null);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File too large. Maximum size is 10 MB (${formatFileSize(file.size)})`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachedFile(file);
  };

  const handleSave = () => {
    if (!form.title || !form.password) {
      toast.error("Title and password are required");
      return;
    }
    if (attachedFile) setUploadProgress(0);
    updatePassword(
      {
        title: form.title,
        username: form.username,
        password: form.password,
        url: form.url,
        notes: form.notes,
        email: form.email,
        category: form.category,
        totp: form.totp,
        customFields: form.customFields.map(
          ({ _id: _dropped, ...rest }) => rest,
        ),
        existingBlob: entry?.blob,
        file: attachedFile,
        onUploadProgress: attachedFile
          ? (pct) => setUploadProgress(pct)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Password updated!");
          onOpenChange(false);
        },
        onError: (e) => {
          setUploadProgress(null);
          toast.error(`${t.error}: ${e.message}`);
        },
      },
    );
  };

  const addCustomField = () => {
    const id = ++cfCounter.current;
    setForm((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { _id: id, name: "", value: "", fieldType: "text" },
      ],
    }));
  };

  const removeCustomField = (id: number) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((cf) => cf._id !== id),
    }));
    setVisibleCustomFields((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateCustomField = (
    id: number,
    field: keyof CustomField,
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      customFields: prev.customFields.map((cf) =>
        cf._id === id ? { ...cf, [field]: value } : cf,
      ),
    }));
  };

  const inputStyle = {
    background: "#071427",
    border: "1px solid #1A3354",
    color: "#EAF2FF",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="passwords.edit.dialog"
        className="w-[95vw] max-w-[520px]"
        style={{
          background: "#0D1F3A",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "#EAF2FF",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#EAF2FF" }}>Edit Password</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-3 mt-2 max-h-[65vh] overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#1A3354 transparent",
          }}
        >
          {/* Title */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              {t.pwdEntryTitle} *
            </Label>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
              style={inputStyle}
              data-ocid="passwords.edit.title.input"
            />
          </div>
          {/* Username */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              {t.pwdUsername}
            </Label>
            <Input
              value={form.username}
              onChange={(e) =>
                setForm((p) => ({ ...p, username: e.target.value }))
              }
              style={inputStyle}
              data-ocid="passwords.edit.username.input"
            />
          </div>
          {/* Email */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              Email
            </Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              style={inputStyle}
              data-ocid="passwords.edit.email.input"
            />
          </div>
          {/* URL */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              {t.pwdUrl}
            </Label>
            <Input
              value={form.url}
              onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              style={inputStyle}
              data-ocid="passwords.edit.url.input"
            />
          </div>
          {/* Category */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              Category / Tag
            </Label>
            <Input
              value={form.category}
              onChange={(e) =>
                setForm((p) => ({ ...p, category: e.target.value }))
              }
              style={inputStyle}
              data-ocid="passwords.edit.category.input"
            />
          </div>
          {/* TOTP */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              TOTP Secret (2FA)
            </Label>
            <div className="relative">
              <Input
                type={showTotp ? "text" : "password"}
                value={form.totp}
                onChange={(e) =>
                  setForm((p) => ({ ...p, totp: e.target.value }))
                }
                style={{ ...inputStyle, paddingRight: "2.5rem" }}
                data-ocid="passwords.edit.totp.input"
              />
              <button
                type="button"
                onClick={() => setShowTotp((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9BB0C9" }}
              >
                {showTotp ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {/* Notes */}
          <div>
            <Label className="text-xs mb-1 block" style={{ color: "#9BB0C9" }}>
              {t.pwdNotes}
            </Label>
            <Textarea
              value={form.notes}
              onChange={(e) =>
                setForm((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              className="resize-none text-sm"
              style={inputStyle}
              data-ocid="passwords.edit.notes.textarea"
            />
          </div>
          {/* Attachment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs" style={{ color: "#9BB0C9" }}>
                Attachment
              </Label>
              <span className="text-xs" style={{ color: "#6b7280" }}>
                Max 10 MB · 1 file
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {attachedFile ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}
              >
                <Paperclip size={13} style={{ color: "#22D3EE" }} />
                <span
                  className="flex-1 text-xs truncate"
                  style={{ color: "#EAF2FF" }}
                >
                  {attachedFile.name}
                </span>
                <span className="text-xs" style={{ color: "#9BB0C9" }}>
                  {formatFileSize(attachedFile.size)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-0.5 rounded hover:bg-white/10"
                  style={{ color: "#9BB0C9" }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : entry?.blob ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #1A3354",
                }}
              >
                <Paperclip size={13} style={{ color: "#9BB0C9" }} />
                <span
                  className="flex-1 text-xs truncate"
                  style={{ color: "#9BB0C9" }}
                >
                  Existing attachment (will be kept)
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs px-2 py-0.5 rounded hover:bg-white/5"
                  style={{ color: "#22D3EE" }}
                >
                  Replace
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ border: "1px dashed #1A3354", color: "#9BB0C9" }}
              >
                <Paperclip size={13} />
                <span className="text-xs">Attach File</span>
              </button>
            )}
            {uploadProgress !== null && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="h-1" />
                <p className="text-xs mt-1" style={{ color: "#22D3EE" }}>
                  Uploading… {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          {/* Custom Fields */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: "#9BB0C9" }}
              >
                Custom Fields
              </span>
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
            </div>
            <div className="flex flex-col gap-2">
              {form.customFields.map((cf) => (
                <div key={cf._id} className="flex items-center gap-2">
                  <Input
                    placeholder=""
                    value={cf.name}
                    onChange={(e) =>
                      updateCustomField(cf._id, "name", e.target.value)
                    }
                    className="text-xs h-8"
                    style={{ ...inputStyle, width: "30%", flex: "0 0 30%" }}
                  />
                  <div className="relative flex-1">
                    <Input
                      placeholder=""
                      type={
                        cf.fieldType === "password" &&
                        !visibleCustomFields.has(cf._id)
                          ? "password"
                          : "text"
                      }
                      value={cf.value}
                      onChange={(e) =>
                        updateCustomField(cf._id, "value", e.target.value)
                      }
                      className="text-xs h-8"
                      style={{
                        ...inputStyle,
                        paddingRight:
                          cf.fieldType === "password" ? "2rem" : undefined,
                      }}
                    />
                    {cf.fieldType === "password" && (
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleCustomFields((p) => {
                            const n = new Set(p);
                            n.has(cf._id) ? n.delete(cf._id) : n.add(cf._id);
                            return n;
                          })
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        style={{ color: "#9BB0C9" }}
                      >
                        {visibleCustomFields.has(cf._id) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    )}
                  </div>
                  <Select
                    value={cf.fieldType}
                    onValueChange={(v) =>
                      updateCustomField(cf._id, "fieldType", v)
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs w-24 flex-shrink-0"
                      style={{
                        background: "#071427",
                        border: "1px solid #1A3354",
                        color: "#9BB0C9",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "#0D1F3A",
                        border: "1px solid #1A3354",
                        color: "#EAF2FF",
                      }}
                    >
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeCustomField(cf._id)}
                    className="p-1 rounded hover:bg-red-500/10 flex-shrink-0"
                    style={{ color: "#9BB0C9" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addCustomField}
              className="mt-2 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 w-full justify-center"
              style={{
                color: "#22D3EE",
                border: "1px dashed rgba(34,211,238,0.3)",
              }}
            >
              <Plus size={12} />
              Add Custom Field
            </button>
          </div>
          {/* Password */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: "#9BB0C9" }}
              >
                {t.pwdPassword} *
              </span>
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
            </div>
            <div className="relative">
              <Input
                type={showPwd ? "text" : "password"}
                value={form.password}
                onChange={(e) =>
                  setForm((p) => ({ ...p, password: e.target.value }))
                }
                style={{ ...inputStyle, paddingRight: "2.5rem" }}
                data-ocid="passwords.edit.password.input"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9BB0C9" }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full"
              style={{
                borderColor: "#1A3354",
                color: "#9BB0C9",
                background: "transparent",
              }}
              data-ocid="passwords.edit.cancel_button"
            >
              {t.pwdCancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 rounded-full font-semibold"
              style={{ background: "#22D3EE", color: "#071427" }}
              data-ocid="passwords.edit.submit_button"
            >
              {isSaving ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {t.pwdSave}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Password Dialog ──────────────────────────────────────────────────────

const makeEmptyEntry = () => ({
  title: "",
  username: "",
  password: "",
  url: "",
  notes: "",
  email: "",
  category: "",
  totp: "",
  customFields: [] as CustomFieldWithId[],
});

function AddPasswordDialog({
  open,
  onOpenChange,
  onGeneratorRequest,
  generatedPassword,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onGeneratorRequest: () => void;
  generatedPassword?: string;
}) {
  const { t } = useLanguage();
  const { mutate: addPassword, isPending: isAdding } = useAddPassword();
  const cfCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newEntry, setNewEntry] = useState(makeEmptyEntry);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [visibleCustomFields, setVisibleCustomFields] = useState<Set<number>>(
    new Set(),
  );
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const resetAddForm = () => {
    setNewEntry(makeEmptyEntry());
    setAttachedFile(null);
    setUploadProgress(null);
    setVisibleCustomFields(new Set());
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // When generator produces a password, inject it into the form
  useEffect(() => {
    if (generatedPassword) {
      setNewEntry((p) => ({ ...p, password: generatedPassword }));
    }
  }, [generatedPassword]);

  const handleAdd = () => {
    if (!newEntry.title || !newEntry.password) {
      toast.error("Title and password are required");
      return;
    }
    const payload = {
      ...newEntry,
      customFields: newEntry.customFields.map(
        ({ _id: _dropped, ...rest }) => rest,
      ),
      file: attachedFile,
      onUploadProgress: attachedFile
        ? (pct: number) => setUploadProgress(pct)
        : undefined,
    };
    if (attachedFile) setUploadProgress(0);
    addPassword(payload, {
      onSuccess: () => {
        toast.success("Password saved!");
        resetAddForm();
        onOpenChange(false);
      },
      onError: (e) => {
        setUploadProgress(null);
        toast.error(`${t.error}: ${e.message}`);
      },
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File too large. Maximum size is 10 MB (${formatFileSize(file.size)})`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachedFile(file);
  };

  const addCustomField = () => {
    const id = ++cfCounter.current;
    setNewEntry((prev) => ({
      ...prev,
      customFields: [
        ...prev.customFields,
        { _id: id, name: "", value: "", fieldType: "text" },
      ],
    }));
  };

  const removeCustomField = (id: number) => {
    setNewEntry((prev) => ({
      ...prev,
      customFields: prev.customFields.filter((cf) => cf._id !== id),
    }));
    setVisibleCustomFields((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateCustomField = (
    id: number,
    field: keyof CustomField,
    value: string,
  ) => {
    setNewEntry((prev) => ({
      ...prev,
      customFields: prev.customFields.map((cf) =>
        cf._id === id ? { ...cf, [field]: value } : cf,
      ),
    }));
  };

  const toggleCustomFieldVisible = (id: number) => {
    setVisibleCustomFields((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const inputStyle = {
    background: "#071427",
    border: "1px solid #1A3354",
    color: "#EAF2FF",
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetAddForm();
        onOpenChange(v);
      }}
    >
      <DialogContent
        data-ocid="passwords.add.dialog"
        className="w-[95vw] max-w-[520px]"
        style={{
          background: "#0D1F3A",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "#EAF2FF",
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#EAF2FF" }}>{t.pwdAdd}</DialogTitle>
        </DialogHeader>
        <div
          className="flex flex-col gap-3 mt-2 max-h-[65vh] overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#1A3354 transparent",
          }}
        >
          <div>
            <Label
              htmlFor="pwd-add-title"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              {t.pwdEntryTitle} *
            </Label>
            <Input
              id="pwd-add-title"
              data-ocid="passwords.add.title.input"
              value={newEntry.title}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, title: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <Label
              htmlFor="pwd-add-username"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              {t.pwdUsername}
            </Label>
            <Input
              id="pwd-add-username"
              data-ocid="passwords.add.username.input"
              value={newEntry.username}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, username: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <Label
              htmlFor="pwd-add-email"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              Email
            </Label>
            <Input
              id="pwd-add-email"
              data-ocid="passwords.add.email.input"
              type="email"
              value={newEntry.email}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, email: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <Label
              htmlFor="pwd-add-url"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              {t.pwdUrl}
            </Label>
            <Input
              id="pwd-add-url"
              data-ocid="passwords.add.url.input"
              value={newEntry.url}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, url: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <Label
              htmlFor="pwd-add-category"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              Category / Tag
            </Label>
            <Input
              id="pwd-add-category"
              data-ocid="passwords.add.category.input"
              value={newEntry.category}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, category: e.target.value }))
              }
              style={inputStyle}
            />
          </div>
          <div>
            <Label
              htmlFor="pwd-add-totp"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              TOTP Secret (2FA)
            </Label>
            <div className="relative">
              <Input
                id="pwd-add-totp"
                data-ocid="passwords.add.totp.input"
                type={showTotp ? "text" : "password"}
                value={newEntry.totp}
                onChange={(e) =>
                  setNewEntry((p) => ({ ...p, totp: e.target.value }))
                }
                style={{ ...inputStyle, paddingRight: "2.5rem" }}
              />
              <button
                type="button"
                onClick={() => setShowTotp((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "#9BB0C9" }}
              >
                {showTotp ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <Label
              htmlFor="pwd-add-notes"
              className="text-xs mb-1 block"
              style={{ color: "#9BB0C9" }}
            >
              {t.pwdNotes}
            </Label>
            <Textarea
              id="pwd-add-notes"
              data-ocid="passwords.add.notes.textarea"
              value={newEntry.notes}
              onChange={(e) =>
                setNewEntry((p) => ({ ...p, notes: e.target.value }))
              }
              rows={2}
              className="resize-none text-sm"
              style={inputStyle}
            />
          </div>
          {/* Attachment */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs" style={{ color: "#9BB0C9" }}>
                Attachment
              </Label>
              <span className="text-xs" style={{ color: "#6b7280" }}>
                Max 10 MB · 1 file per entry
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="passwords.add.dropzone"
            />
            {attachedFile ? (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}
              >
                <Paperclip size={13} style={{ color: "#22D3EE" }} />
                <span
                  className="flex-1 text-xs truncate"
                  style={{ color: "#EAF2FF" }}
                >
                  {attachedFile.name}
                </span>
                <span className="text-xs" style={{ color: "#9BB0C9" }}>
                  {formatFileSize(attachedFile.size)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="p-0.5 rounded hover:bg-white/10"
                  style={{ color: "#9BB0C9" }}
                  data-ocid="passwords.add.attachment.close_button"
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5"
                style={{ border: "1px dashed #1A3354", color: "#9BB0C9" }}
                data-ocid="passwords.add.upload_button"
              >
                <Paperclip size={13} />
                <span className="text-xs">Attach File</span>
              </button>
            )}
            {uploadProgress !== null && (
              <div className="mt-2">
                <Progress value={uploadProgress} className="h-1" />
                <p
                  className="text-xs mt-1"
                  style={{ color: "#22D3EE" }}
                  data-ocid="passwords.add.upload.loading_state"
                >
                  Uploading… {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          {/* Custom Fields */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: "#9BB0C9" }}
              >
                Custom Fields
              </span>
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
            </div>
            <div className="flex flex-col gap-2">
              {newEntry.customFields.map((cf) => (
                <div key={cf._id} className="flex items-center gap-2">
                  <Input
                    value={cf.name}
                    onChange={(e) =>
                      updateCustomField(cf._id, "name", e.target.value)
                    }
                    className="text-xs h-8"
                    style={{ ...inputStyle, width: "30%", flex: "0 0 30%" }}
                  />
                  <div className="relative flex-1">
                    <Input
                      type={
                        cf.fieldType === "password" &&
                        !visibleCustomFields.has(cf._id)
                          ? "password"
                          : "text"
                      }
                      value={cf.value}
                      onChange={(e) =>
                        updateCustomField(cf._id, "value", e.target.value)
                      }
                      className="text-xs h-8"
                      style={{
                        ...inputStyle,
                        paddingRight:
                          cf.fieldType === "password" ? "2rem" : undefined,
                      }}
                    />
                    {cf.fieldType === "password" && (
                      <button
                        type="button"
                        onClick={() => toggleCustomFieldVisible(cf._id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        style={{ color: "#9BB0C9" }}
                      >
                        {visibleCustomFields.has(cf._id) ? (
                          <EyeOff size={12} />
                        ) : (
                          <Eye size={12} />
                        )}
                      </button>
                    )}
                  </div>
                  <Select
                    value={cf.fieldType}
                    onValueChange={(v) =>
                      updateCustomField(cf._id, "fieldType", v)
                    }
                  >
                    <SelectTrigger
                      className="h-8 text-xs w-24 flex-shrink-0"
                      style={{
                        background: "#071427",
                        border: "1px solid #1A3354",
                        color: "#9BB0C9",
                      }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      style={{
                        background: "#0D1F3A",
                        border: "1px solid #1A3354",
                        color: "#EAF2FF",
                      }}
                    >
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="password">Password</SelectItem>
                      <SelectItem value="url">URL</SelectItem>
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeCustomField(cf._id)}
                    className="p-1 rounded hover:bg-red-500/10 flex-shrink-0"
                    style={{ color: "#9BB0C9" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              data-ocid="passwords.add.custom_field.button"
              onClick={addCustomField}
              className="mt-2 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 w-full justify-center"
              style={{
                color: "#22D3EE",
                border: "1px dashed rgba(34,211,238,0.3)",
              }}
            >
              <Plus size={12} />
              Add Custom Field
            </button>
          </div>
          {/* Password */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: "#9BB0C9" }}
              >
                {t.pwdPassword} *
              </span>
              <Separator className="flex-1" style={{ background: "#1A3354" }} />
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="pwd-add-password"
                  data-ocid="passwords.add.password.input"
                  type={showNewPwd ? "text" : "password"}
                  value={newEntry.password}
                  onChange={(e) =>
                    setNewEntry((p) => ({ ...p, password: e.target.value }))
                  }
                  style={{ ...inputStyle, paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9BB0C9" }}
                >
                  {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={onGeneratorRequest}
                className="shrink-0 text-xs h-9 px-3 rounded-lg"
                style={{
                  borderColor: "rgba(168,85,247,0.4)",
                  color: "#A855F7",
                  background: "transparent",
                }}
                data-ocid="passwords.add.generator_button"
              >
                Generate
              </Button>
            </div>
          </div>
          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <Button
              data-ocid="passwords.add.cancel_button"
              variant="outline"
              onClick={() => {
                resetAddForm();
                onOpenChange(false);
              }}
              className="flex-1 rounded-full"
              style={{
                borderColor: "#1A3354",
                color: "#9BB0C9",
                background: "transparent",
              }}
            >
              {t.pwdCancel}
            </Button>
            <Button
              data-ocid="passwords.add.submit_button"
              onClick={handleAdd}
              disabled={isAdding}
              className="flex-1 rounded-full font-semibold"
              style={{ background: "#22D3EE", color: "#071427" }}
            >
              {isAdding ? (
                <Loader2 size={14} className="animate-spin mr-1" />
              ) : null}
              {t.pwdSave}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PasswordsPage() {
  const { t } = useLanguage();
  const { data: passwords = [], isLoading } = usePasswordEntries();
  const { mutate: bulkDelete, isPending: isBulkDeleting } =
    useBulkDeletePasswords();

  const [search, setSearch] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<
    string | undefined
  >();
  const [editEntry, setEditEntry] = useState<PasswordEntry | null>(null);
  // On mobile: show detail panel (true) or list panel (false)
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [checkedTitles, setCheckedTitles] = useState<Set<string>>(new Set());
  const [showBulkConfirmDialog, setShowBulkConfirmDialog] = useState(false);

  const filtered = passwords.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase()) ||
      (p.url ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const selectedEntry =
    passwords.find((p) => p.title === selectedTitle) ?? null;

  const allFilteredChecked =
    filtered.length > 0 && filtered.every((p) => checkedTitles.has(p.title));
  const someFilteredChecked = filtered.some((p) => checkedTitles.has(p.title));

  const handleSelectEntry = (title: string) => {
    if (selectMode) return; // don't open detail in select mode
    setSelectedTitle(title);
    setMobileShowDetail(true);
  };

  const handleDeleted = () => {
    setSelectedTitle(null);
    setMobileShowDetail(false);
  };

  const toggleCheck = (title: string) => {
    setCheckedTitles((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allFilteredChecked) {
      setCheckedTitles((prev) => {
        const next = new Set(prev);
        for (const p of filtered) next.delete(p.title);
        return next;
      });
    } else {
      setCheckedTitles((prev) => {
        const next = new Set(prev);
        for (const p of filtered) next.add(p.title);
        return next;
      });
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setCheckedTitles(new Set());
  };

  const handleBulkDeleteConfirm = () => {
    const titles = Array.from(checkedTitles);
    bulkDelete(titles, {
      onSuccess: ({ deleted, failed }) => {
        const msg =
          failed > 0
            ? `Deleted ${deleted}, failed ${failed}`
            : `${deleted} password${deleted !== 1 ? "s" : ""} deleted`;
        toast.success(msg);
        // Clear detail panel if current entry was deleted
        if (selectedTitle && checkedTitles.has(selectedTitle)) {
          setSelectedTitle(null);
          setMobileShowDetail(false);
        }
        exitSelectMode();
        setShowBulkConfirmDialog(false);
      },
      onError: (e) => {
        toast.error(`Bulk delete failed: ${e.message}`);
        setShowBulkConfirmDialog(false);
      },
    });
  };

  const panelBg = "rgba(10,15,30,0.7)";
  const borderColor = "rgba(255,255,255,0.06)";

  // Persist panel sizes in localStorage
  const STORAGE_KEY = "passwords-panel-sizes";
  const defaultLayout = (() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as number[];
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      }
    } catch {
      // ignore
    }
    return [28, 72];
  })();

  const handleLayout = (sizes: number[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="flex overflow-hidden -m-4 md:-m-6"
      style={{ minHeight: 0, height: "calc(100% + 2rem)", flex: "1 1 0" }}
    >
      <ResizablePanelGroup
        direction="horizontal"
        onLayout={handleLayout}
        className="w-full h-full"
      >
        {/* ── LEFT: List Panel ── */}
        <ResizablePanel
          defaultSize={defaultLayout[0]}
          minSize={18}
          maxSize={42}
          className={[
            "flex flex-col",
            mobileShowDetail ? "hidden md:flex" : "flex",
          ].join(" ")}
          style={{ background: panelBg, minHeight: 0 }}
          data-ocid="passwords.list_panel"
        >
          {/* List header */}
          <div
            className="px-4 pt-4 pb-3 shrink-0 flex flex-col gap-3"
            style={{ borderBottom: `1px solid ${borderColor}` }}
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h1
                  className="text-base font-bold"
                  style={{ color: "#EAF2FF" }}
                >
                  {t.pwdTitle}
                </h1>
                <p className="text-xs" style={{ color: "#9BB0C9" }}>
                  {passwords.length} entries
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {!selectMode && (
                  <>
                    <Button
                      data-ocid="passwords.generator.button"
                      onClick={() => setShowGenerator(true)}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs px-2.5 rounded-lg"
                      style={{
                        borderColor: "rgba(168,85,247,0.4)",
                        color: "#A855F7",
                        background: "transparent",
                      }}
                      aria-label="Password Generator"
                    >
                      <Shield size={13} />
                    </Button>
                    <Button
                      data-ocid="passwords.add.primary_button"
                      onClick={() => setShowAdd(true)}
                      size="sm"
                      className="h-8 text-xs px-2.5 rounded-lg font-semibold"
                      style={{ background: "#22D3EE", color: "#071427" }}
                    >
                      <Plus size={13} className="mr-1" />
                      {t.pwdAdd}
                    </Button>
                  </>
                )}
                {/* Select mode toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectMode) exitSelectMode();
                    else setSelectMode(true);
                  }}
                  className="h-8 px-2.5 text-xs rounded-lg transition-colors hover:bg-white/5 flex items-center gap-1.5"
                  style={{
                    color: selectMode ? "#22D3EE" : "#9BB0C9",
                    border: `1px solid ${selectMode ? "rgba(34,211,238,0.3)" : "#1A3354"}`,
                    background: selectMode
                      ? "rgba(34,211,238,0.06)"
                      : "transparent",
                  }}
                  data-ocid="passwords.select_mode_button"
                  aria-label={
                    selectMode ? "Exit select mode" : "Enter select mode"
                  }
                >
                  <CheckSquare size={13} />
                  {selectMode && <span>Done</span>}
                </button>
              </div>
            </div>

            {/* Select-all row — visible only in select mode */}
            {selectMode && (
              <div
                className="flex items-center gap-3 px-1 py-1.5 rounded-lg"
                style={{
                  background: "rgba(34,211,238,0.04)",
                  border: "1px solid rgba(34,211,238,0.12)",
                }}
              >
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 flex-1 text-left"
                  data-ocid="passwords.select_all_checkbox"
                  aria-label={
                    allFilteredChecked ? "Deselect all" : "Select all"
                  }
                >
                  {allFilteredChecked ? (
                    <CheckSquare
                      size={15}
                      style={{ color: "#22D3EE", flexShrink: 0 }}
                    />
                  ) : someFilteredChecked ? (
                    <CheckSquare
                      size={15}
                      style={{ color: "rgba(34,211,238,0.5)", flexShrink: 0 }}
                    />
                  ) : (
                    <Square
                      size={15}
                      style={{ color: "#9BB0C9", flexShrink: 0 }}
                    />
                  )}
                  <span className="text-xs" style={{ color: "#9BB0C9" }}>
                    {allFilteredChecked ? "Deselect all" : "Select all"}
                  </span>
                </button>
                <span
                  className="text-xs font-medium"
                  style={{ color: "#22D3EE" }}
                >
                  {checkedTitles.size} selected
                </span>
              </div>
            )}

            {/* Bulk action toolbar */}
            <AnimatePresence>
              {selectMode && checkedTitles.size > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ overflow: "hidden" }}
                >
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{
                      background: "rgba(239,68,68,0.06)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <span
                      className="text-xs font-semibold flex-1"
                      style={{ color: "#EAF2FF" }}
                    >
                      {checkedTitles.size} selected
                    </span>
                    <button
                      type="button"
                      onClick={exitSelectMode}
                      className="text-xs px-2 py-1 rounded-lg hover:bg-white/5 transition-colors"
                      style={{ color: "#9BB0C9" }}
                      data-ocid="passwords.bulk_cancel_button"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBulkConfirmDialog(true)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors hover:bg-red-500/20"
                      style={{
                        background: "rgba(239,68,68,0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.3)",
                      }}
                      data-ocid="passwords.bulk_delete_button"
                    >
                      <Trash2 size={12} />
                      Delete
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#9BB0C9" }}
              />
              <Input
                data-ocid="passwords.search_input"
                placeholder={t.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-8 text-sm"
                style={{
                  background: "#0D1F3A",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>
          </div>

          {/* List entries */}
          <div
            className="flex-1 overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#1A3354 transparent",
            }}
          >
            {isLoading ? (
              <div
                className="flex items-center gap-2 p-5"
                data-ocid="passwords.loading_state"
              >
                <Loader2
                  className="animate-spin"
                  size={16}
                  style={{ color: "#22D3EE" }}
                />
                <span className="text-sm" style={{ color: "#9BB0C9" }}>
                  {t.loading}
                </span>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="text-center py-12 px-4"
                data-ocid="passwords.empty_state"
              >
                <KeyRound
                  size={32}
                  className="mx-auto mb-3 opacity-30"
                  style={{ color: "#22D3EE" }}
                />
                <p className="text-sm" style={{ color: "#9BB0C9" }}>
                  {search ? "No results" : t.noData}
                </p>
                {!search && (
                  <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
                    Click "+" to add your first password
                  </p>
                )}
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((p, i) => {
                  const isSelected = p.title === selectedTitle;
                  const isChecked = checkedTitles.has(p.title);
                  return (
                    <motion.div
                      key={p.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      className="group relative w-full"
                      style={{
                        borderBottom: `1px solid ${borderColor}`,
                      }}
                    >
                      {/* Checkbox — visible in select mode, fades in on hover otherwise */}
                      <div
                        className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 transition-opacity ${
                          selectMode
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!selectMode) setSelectMode(true);
                            toggleCheck(p.title);
                          }}
                          className="p-0.5 rounded transition-colors hover:bg-white/10"
                          aria-label={isChecked ? "Uncheck" : "Check"}
                          aria-checked={isChecked}
                          data-ocid={`passwords.item.checkbox.${i + 1}`}
                        >
                          {isChecked ? (
                            <CheckSquare
                              size={15}
                              style={{ color: "#22D3EE" }}
                            />
                          ) : (
                            <Square size={15} style={{ color: "#9BB0C9" }} />
                          )}
                        </button>
                      </div>

                      {/* Main row button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (selectMode) {
                            toggleCheck(p.title);
                          } else {
                            handleSelectEntry(p.title);
                          }
                        }}
                        data-ocid={`passwords.item.${i + 1}`}
                        className="w-full text-left flex items-center gap-3 py-3 transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400"
                        style={{
                          paddingLeft: selectMode ? "2.5rem" : "1rem",
                          paddingRight: "1rem",
                          borderLeft: isChecked
                            ? "3px solid #22D3EE"
                            : isSelected
                              ? "3px solid #22D3EE"
                              : "3px solid transparent",
                          background: isChecked
                            ? "rgba(34,211,238,0.08)"
                            : isSelected
                              ? "rgba(34,211,238,0.06)"
                              : "transparent",
                        }}
                      >
                        {/* Icon */}
                        <div
                          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{
                            background:
                              isChecked || isSelected
                                ? "rgba(34,211,238,0.12)"
                                : "rgba(255,255,255,0.05)",
                          }}
                        >
                          <Lock
                            size={14}
                            style={{
                              color:
                                isChecked || isSelected ? "#22D3EE" : "#9BB0C9",
                            }}
                          />
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold truncate"
                            style={{
                              color:
                                isChecked || isSelected ? "#EAF2FF" : "#CBD5E1",
                            }}
                          >
                            {p.title}
                          </p>
                          <p
                            className="text-xs truncate mt-0.5"
                            style={{ color: "#9BB0C9" }}
                          >
                            {p.username || p.email || p.url || "—"}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {p.totp && (
                            <span
                              className="text-[9px] px-1 rounded"
                              style={{
                                background: "rgba(168,85,247,0.15)",
                                color: "#A855F7",
                              }}
                            >
                              2FA
                            </span>
                          )}
                          {p.blob && (
                            <Paperclip size={10} style={{ color: "#9BB0C9" }} />
                          )}
                        </div>
                      </button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </div>
        </ResizablePanel>

        {/* Drag handle between panels — desktop only */}
        <ResizableHandle className="hidden md:flex" />

        {/* RIGHT: Detail Panel */}
        <ResizablePanel
          defaultSize={defaultLayout[1]}
          className={[
            "flex flex-col",
            mobileShowDetail ? "flex" : "hidden md:flex",
          ].join(" ")}
          style={{
            background: "rgba(10,15,30,0.45)",
            minHeight: 0,
            overflow: "hidden",
          }}
          data-ocid="passwords.detail_panel"
        >
          {selectedEntry ? (
            <DetailPanel
              entry={{
                ...selectedEntry,
                email: selectedEntry.email ?? "",
                category: selectedEntry.category ?? "",
                totp: selectedEntry.totp ?? "",
                customFields: selectedEntry.customFields ?? [],
              }}
              onClose={() => setMobileShowDetail(false)}
              onDeleted={handleDeleted}
              onEditRequest={(entry) => setEditEntry(entry)}
            />
          ) : (
            <div
              className="flex-1 flex flex-col items-center justify-center gap-3 px-6"
              data-ocid="passwords.detail.empty_state"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.12)",
                }}
              >
                <KeyRound size={28} style={{ color: "rgba(34,211,238,0.4)" }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium" style={{ color: "#9BB0C9" }}>
                  Select a password to view details
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "rgba(155,176,201,0.5)" }}
                >
                  Click any entry from the list on the left
                </p>
              </div>
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ── Dialogs ── */}
      <AddPasswordDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onGeneratorRequest={() => {
          setShowAdd(false);
          setShowGenerator(true);
        }}
        generatedPassword={generatedPassword}
      />

      <EditPasswordDialog
        entry={editEntry}
        open={!!editEntry}
        onOpenChange={(v) => {
          if (!v) setEditEntry(null);
        }}
      />

      <Dialog open={showGenerator} onOpenChange={setShowGenerator}>
        <DialogContent
          data-ocid="passwords.generator.dialog"
          style={{
            background: "#0D1F3A",
            border: "1px solid rgba(168,85,247,0.2)",
            color: "#EAF2FF",
            maxWidth: 460,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              Password Generator
            </DialogTitle>
          </DialogHeader>
          <PasswordGenerator
            onUse={(pwd) => {
              setShowGenerator(false);
              setShowAdd(true);
              setGeneratedPassword(pwd);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation Dialog ── */}
      <Dialog
        open={showBulkConfirmDialog}
        onOpenChange={setShowBulkConfirmDialog}
      >
        <DialogContent
          data-ocid="passwords.bulk_delete.dialog"
          style={{
            background: "#0D1F3A",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#EAF2FF",
            maxWidth: 400,
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>
              Delete {checkedTitles.size} password
              {checkedTitles.size !== 1 ? "s" : ""}?
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-2">
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              This will permanently delete{" "}
              <span className="font-semibold" style={{ color: "#EAF2FF" }}>
                {checkedTitles.size} password
                {checkedTitles.size !== 1 ? "s" : ""}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowBulkConfirmDialog(false)}
                disabled={isBulkDeleting}
                className="flex-1 rounded-full"
                style={{
                  borderColor: "#1A3354",
                  color: "#9BB0C9",
                  background: "transparent",
                }}
                data-ocid="passwords.bulk_delete.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkDeleteConfirm}
                disabled={isBulkDeleting}
                className="flex-1 rounded-full font-semibold"
                style={{
                  background: "#ef4444",
                  color: "#fff",
                  opacity: isBulkDeleting ? 0.7 : 1,
                }}
                data-ocid="passwords.bulk_delete.confirm_button"
              >
                {isBulkDeleting ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : (
                  <Trash2 size={14} className="mr-1" />
                )}
                {isBulkDeleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
