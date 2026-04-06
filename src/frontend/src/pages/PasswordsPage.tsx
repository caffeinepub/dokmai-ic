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
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  Search,
  Shield,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import PasswordGenerator from "../components/passwords/PasswordGenerator";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useAddPassword,
  useDeletePassword,
  usePasswordEntries,
} from "../hooks/useQueries";
import { useTotpCode } from "../hooks/useTotpCode";

interface CustomField {
  name: string;
  value: string;
  fieldType: string;
}

// Internal form type with a stable id for list keys
interface CustomFieldWithId extends CustomField {
  _id: number;
}

// TotpDisplay: shows a live 6-digit TOTP code that updates every 30 seconds
function TotpDisplay({ secret }: { secret: string }) {
  const { code, secondsRemaining, isLoading } = useTotpCode(secret);

  const copyCode = useCallback(async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    toast.success("TOTP code copied");
  }, [code]);

  const progress = (secondsRemaining / 30) * 100;
  const isUrgent = secondsRemaining <= 5;
  const barColor = isUrgent ? "#ef4444" : "#A855F7";

  return (
    <div
      className="mt-2 rounded-lg px-3 py-2"
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
      {/* Countdown progress bar */}
      <div
        className="mt-1.5 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(168,85,247,0.15)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: barColor,
          }}
        />
      </div>
    </div>
  );
}

function PasswordCard({
  entry,
  onDelete,
}: {
  entry: {
    title: string;
    username: string;
    password: string;
    url: string;
    notes: string;
    email: string;
    category: string;
    totp: string;
    customFields: CustomField[];
  };
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  // Map from stable key (name+index) to hidden state for password fields
  const [shownCustomFields, setShownCustomFields] = useState<Set<string>>(
    new Set(),
  );
  const { mutate: deleteEntry, isPending: isDeleting } = useDeletePassword();

  const copyPwd = useCallback(async () => {
    await navigator.clipboard.writeText(entry.password);
    setCopied(true);
    toast.success(t.pwdCopied);
    setTimeout(() => setCopied(false), 2000);
  }, [entry.password, t.pwdCopied]);

  const toggleCustomFieldVisibility = (key: string) => {
    setShownCustomFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="card-gradient-border p-4"
      style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: "#EAF2FF" }}
            >
              {entry.title}
            </span>
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
            {entry.url && (
              <a
                href={
                  entry.url.startsWith("http")
                    ? entry.url
                    : `https://${entry.url}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <ExternalLink size={12} style={{ color: "#9BB0C9" }} />
              </a>
            )}
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "#9BB0C9" }}>
            {entry.username}
          </p>
          {entry.email && (
            <p
              className="text-xs mt-0.5 truncate flex items-center gap-1"
              style={{ color: "#9BB0C9" }}
            >
              <Mail size={10} />
              {entry.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: "#9BB0C9" }}
            aria-label={showPwd ? t.pwdHide : t.pwdShow}
          >
            {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={copyPwd}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: copied ? "#22D3EE" : "#9BB0C9" }}
            aria-label={t.pwdCopy}
          >
            <Copy size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              deleteEntry(entry.title, {
                onSuccess: () => {
                  toast.success("Password deleted");
                  onDelete();
                },
                onError: (e) => toast.error(e.message),
              });
            }}
            disabled={isDeleting}
            className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
            style={{ color: "#9BB0C9" }}
            aria-label={t.pwdDelete}
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Password row */}
      <div className="mt-3 flex items-center gap-2">
        <div
          className="flex-1 px-3 py-1.5 rounded-lg font-mono text-xs"
          style={{
            background: "rgba(34,211,238,0.04)",
            border: "1px solid #1A3354",
            color: showPwd ? "#22D3EE" : "#9BB0C9",
          }}
        >
          {showPwd
            ? entry.password
            : "\u2022".repeat(Math.min(entry.password.length, 20))}
        </div>
      </div>

      {/* TOTP */}
      {entry.totp && <TotpDisplay secret={entry.totp} />}

      {/* Notes */}
      {entry.notes && (
        <p className="mt-2 text-xs" style={{ color: "#9BB0C9" }}>
          {entry.notes}
        </p>
      )}

      {/* Custom fields */}
      {entry.customFields && entry.customFields.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {entry.customFields.map((cf, pos) => {
            const cfKey = `${cf.name}-${pos}`;
            const isShown = shownCustomFields.has(cfKey);
            return (
              <div
                key={cfKey}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid #1A3354",
                }}
              >
                <span
                  className="font-medium shrink-0"
                  style={{ color: "#9BB0C9" }}
                >
                  {cf.name}:
                </span>
                <span
                  className="flex-1 font-mono truncate"
                  style={{ color: "#EAF2FF" }}
                >
                  {cf.fieldType === "password" && !isShown
                    ? "\u2022".repeat(Math.min(cf.value.length, 16))
                    : cf.value}
                </span>
                {cf.fieldType === "password" && (
                  <button
                    type="button"
                    onClick={() => toggleCustomFieldVisibility(cfKey)}
                    className="p-0.5 rounded hover:bg-white/5"
                    style={{ color: "#9BB0C9" }}
                    aria-label="Toggle visibility"
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
      )}
    </motion.div>
  );
}

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

export default function PasswordsPage() {
  const { t } = useLanguage();
  const { data: passwords = [], isLoading } = usePasswordEntries();
  const { mutate: addPassword, isPending: isAdding } = useAddPassword();

  const cfCounter = useRef(0);

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [newEntry, setNewEntry] = useState(makeEmptyEntry);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const [visibleCustomFields, setVisibleCustomFields] = useState<Set<number>>(
    new Set(),
  );

  const filtered = passwords.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.username.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAdd = () => {
    if (!newEntry.title || !newEntry.password) {
      toast.error("Title and password are required");
      return;
    }
    // Strip the internal _id before sending to backend
    const payload = {
      ...newEntry,
      customFields: newEntry.customFields.map(
        ({ _id: _dropped, ...rest }) => rest,
      ),
    };
    addPassword(payload, {
      onSuccess: () => {
        toast.success("Password saved!");
        setNewEntry(makeEmptyEntry());
        setShowAdd(false);
        setVisibleCustomFields(new Set());
      },
      onError: (e) => toast.error(`${t.error}: ${e.message}`),
    });
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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
            {t.pwdTitle}
          </h1>
          <p className="text-sm" style={{ color: "#9BB0C9" }}>
            {passwords.length} entries stored on-chain
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-ocid="passwords.generator.button"
            onClick={() => setShowGenerator(true)}
            variant="outline"
            className="rounded-full text-sm h-9"
            style={{
              borderColor: "rgba(168,85,247,0.4)",
              color: "#A855F7",
              background: "transparent",
            }}
          >
            Generator
          </Button>
          <Button
            data-ocid="passwords.add.primary_button"
            onClick={() => setShowAdd(true)}
            className="rounded-full text-sm h-9 font-semibold"
            style={{ background: "#22D3EE", color: "#071427" }}
          >
            <Plus size={16} className="mr-1" />
            {t.pwdAdd}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "#9BB0C9" }}
        />
        <Input
          data-ocid="passwords.search_input"
          placeholder={t.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
          style={{
            background: "#0D1F3A",
            border: "1px solid #1A3354",
            color: "#EAF2FF",
          }}
        />
      </div>

      {/* Password list */}
      {isLoading ? (
        <div
          className="flex items-center gap-2 py-8"
          data-ocid="passwords.loading_state"
        >
          <Loader2
            className="animate-spin"
            size={18}
            style={{ color: "#22D3EE" }}
          />
          <span style={{ color: "#9BB0C9" }}>{t.loading}</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" data-ocid="passwords.empty_state">
          <KeyRound
            size={40}
            className="mx-auto mb-3 opacity-30"
            style={{ color: "#22D3EE" }}
          />
          <p style={{ color: "#9BB0C9" }}>{t.noData}</p>
          <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
            Click "+" to add your first password
          </p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map((p, i) => (
              <div key={p.title} data-ocid={`passwords.item.${i + 1}`}>
                <PasswordCard
                  entry={{
                    ...p,
                    email: p.email ?? "",
                    category: p.category ?? "",
                    totp: p.totp ?? "",
                    customFields: p.customFields ?? [],
                  }}
                  onDelete={() => {}}
                />
              </div>
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add Password Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent
          data-ocid="passwords.add.dialog"
          style={{
            background: "#0D1F3A",
            border: "1px solid rgba(34,211,238,0.2)",
            color: "#EAF2FF",
            maxWidth: 520,
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
            {/* Title */}
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
                placeholder="e.g. GitHub"
                value={newEntry.title}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, title: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* Username */}
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
                placeholder="user@example.com"
                value={newEntry.username}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, username: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* Email */}
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
                placeholder="email@example.com"
                type="email"
                value={newEntry.email}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, email: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* URL */}
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
                placeholder="https://github.com"
                value={newEntry.url}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, url: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* Category */}
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
                placeholder="e.g. Social, Work, Finance"
                value={newEntry.category}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, category: e.target.value }))
                }
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* TOTP */}
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
                  placeholder="TOTP secret key"
                  value={newEntry.totp}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, totp: e.target.value }))
                  }
                  style={{
                    background: "#071427",
                    border: "1px solid #1A3354",
                    color: "#EAF2FF",
                    paddingRight: "2.5rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowTotp((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9BB0C9" }}
                  aria-label={showTotp ? "Hide TOTP" : "Show TOTP"}
                >
                  {showTotp ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Notes */}
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
                placeholder="Optional notes"
                value={newEntry.notes}
                onChange={(e) =>
                  setNewEntry((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className="resize-none text-sm"
                style={{
                  background: "#071427",
                  border: "1px solid #1A3354",
                  color: "#EAF2FF",
                }}
              />
            </div>

            {/* Custom Fields */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Separator
                  className="flex-1"
                  style={{ background: "#1A3354" }}
                />
                <span
                  className="text-xs font-medium shrink-0"
                  style={{ color: "#9BB0C9" }}
                >
                  Custom Fields
                </span>
                <Separator
                  className="flex-1"
                  style={{ background: "#1A3354" }}
                />
              </div>

              <div className="flex flex-col gap-2">
                {newEntry.customFields.map((cf) => (
                  <div key={cf._id} className="flex items-center gap-2">
                    {/* Field name */}
                    <Input
                      placeholder="Field name"
                      value={cf.name}
                      onChange={(e) =>
                        updateCustomField(cf._id, "name", e.target.value)
                      }
                      className="text-xs h-8"
                      style={{
                        background: "#071427",
                        border: "1px solid #1A3354",
                        color: "#EAF2FF",
                        width: "30%",
                        flex: "0 0 30%",
                      }}
                    />
                    {/* Field value */}
                    <div className="relative flex-1">
                      <Input
                        placeholder="Value"
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
                          background: "#071427",
                          border: "1px solid #1A3354",
                          color: "#EAF2FF",
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
                          aria-label="Toggle"
                        >
                          {visibleCustomFields.has(cf._id) ? (
                            <EyeOff size={12} />
                          ) : (
                            <Eye size={12} />
                          )}
                        </button>
                      )}
                    </div>
                    {/* Field type */}
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
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeCustomField(cf._id)}
                      className="p-1 rounded hover:bg-red-500/10 flex-shrink-0"
                      style={{ color: "#9BB0C9" }}
                      aria-label="Remove field"
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
                className="mt-2 flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
                style={{
                  color: "#22D3EE",
                  border: "1px dashed rgba(34,211,238,0.3)",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                <Plus size={12} />
                Add Custom Field
              </button>
            </div>

            {/* Password field with show/hide */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Separator
                  className="flex-1"
                  style={{ background: "#1A3354" }}
                />
                <span
                  className="text-xs font-medium shrink-0"
                  style={{ color: "#9BB0C9" }}
                >
                  {t.pwdPassword} *
                </span>
                <Separator
                  className="flex-1"
                  style={{ background: "#1A3354" }}
                />
              </div>
              <div className="relative">
                <Input
                  id="pwd-add-password"
                  data-ocid="passwords.add.password.input"
                  type={showNewPwd ? "text" : "password"}
                  placeholder="Enter or generate password"
                  value={newEntry.password}
                  onChange={(e) =>
                    setNewEntry((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  style={{
                    background: "#071427",
                    border: "1px solid #1A3354",
                    color: "#EAF2FF",
                    paddingRight: "2.5rem",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "#9BB0C9" }}
                  aria-label={showNewPwd ? t.pwdHide : t.pwdShow}
                >
                  {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-1">
              <Button
                data-ocid="passwords.add.cancel_button"
                variant="outline"
                onClick={() => setShowAdd(false)}
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

      {/* Generator Dialog */}
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
              setNewEntry((prev) => ({ ...prev, password: pwd }));
              setShowGenerator(false);
              setShowAdd(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
