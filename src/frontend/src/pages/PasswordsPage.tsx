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
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import PasswordGenerator from "../components/passwords/PasswordGenerator";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useAddPassword,
  useDeletePassword,
  usePasswordEntries,
} from "../hooks/useQueries";

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
  };
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [copied, setCopied] = useState(false);
  const { mutate: deleteEntry, isPending: isDeleting } = useDeletePassword();

  const copyPwd = useCallback(async () => {
    await navigator.clipboard.writeText(entry.password);
    setCopied(true);
    toast.success(t.pwdCopied);
    setTimeout(() => setCopied(false), 2000);
  }, [entry.password, t.pwdCopied]);

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
          <div className="flex items-center gap-2">
            <span
              className="font-semibold text-sm truncate"
              style={{ color: "#EAF2FF" }}
            >
              {entry.title}
            </span>
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
            : "•".repeat(Math.min(entry.password.length, 20))}
        </div>
      </div>

      {entry.notes && (
        <p className="mt-2 text-xs" style={{ color: "#9BB0C9" }}>
          {entry.notes}
        </p>
      )}
    </motion.div>
  );
}

export default function PasswordsPage() {
  const { t } = useLanguage();
  const { data: passwords = [], isLoading } = usePasswordEntries();
  const { mutate: addPassword, isPending: isAdding } = useAddPassword();

  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    notes: "",
  });
  const [showNewPwd, setShowNewPwd] = useState(false);

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
    addPassword(newEntry, {
      onSuccess: () => {
        toast.success("Password saved!");
        setNewEntry({
          title: "",
          username: "",
          password: "",
          url: "",
          notes: "",
        });
        setShowAdd(false);
      },
      onError: (e) => toast.error(`${t.error}: ${e.message}`),
    });
  };

  const entryFields: {
    key: keyof typeof newEntry;
    label: string;
    placeholder: string;
    type?: string;
  }[] = [
    { key: "title", label: t.pwdEntryTitle, placeholder: "e.g. GitHub" },
    { key: "username", label: t.pwdUsername, placeholder: "user@example.com" },
    { key: "url", label: t.pwdUrl, placeholder: "https://github.com" },
    { key: "notes", label: t.pwdNotes, placeholder: "Optional notes" },
  ];

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
                <PasswordCard entry={p} onDelete={() => {}} />
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
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ color: "#EAF2FF" }}>{t.pwdAdd}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            {entryFields.map(({ key, label, placeholder }) => (
              <div key={key}>
                <Label
                  htmlFor={`pwd-add-${key}`}
                  className="text-xs mb-1 block"
                  style={{ color: "#9BB0C9" }}
                >
                  {label}
                </Label>
                <Input
                  id={`pwd-add-${key}`}
                  data-ocid={`passwords.add.${key}.input`}
                  placeholder={placeholder}
                  value={newEntry[key]}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  style={{
                    background: "#071427",
                    border: "1px solid #1A3354",
                    color: "#EAF2FF",
                  }}
                />
              </div>
            ))}
            {/* Password field with show/hide */}
            <div>
              <Label
                htmlFor="pwd-add-password"
                className="text-xs mb-1 block"
                style={{ color: "#9BB0C9" }}
              >
                {t.pwdPassword}
              </Label>
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
