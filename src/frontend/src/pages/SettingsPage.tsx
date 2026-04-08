import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Key,
  Loader2,
  LogOut,
  Mail,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CsvExportModal } from "../components/passwords/CsvExportModal";
import {
  CsvImportModal,
  type ParsedEntry,
} from "../components/passwords/CsvImportModal";
import {
  LANGUAGE_OPTIONS,
  type LangCode,
  useLanguage,
} from "../contexts/LanguageContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddPassword,
  usePasswordEntries,
  useSecureNotes,
  useUpdateUserProfile,
  useUserProfile,
} from "../hooks/useQueries";
import { Language } from "../types";

const EMAIL_STORAGE_KEY = "dokmai-user-email";

export default function SettingsPage() {
  const { t, lang, setLang } = useLanguage();
  const { identity, clear } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const { mutate: updateProfile, isPending: isSavingProfile } =
    useUpdateUserProfile();
  const { data: passwords } = usePasswordEntries();
  const { data: notes } = useSecureNotes();
  const { mutateAsync: addPasswordAsync } = useAddPassword();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const principal = identity?.getPrincipal().toText() ?? "";

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState(
    () => localStorage.getItem(EMAIL_STORAGE_KEY) ?? "",
  );

  // Copy state for principal ID
  const [copied, setCopied] = useState(false);

  // Modal state
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showCsvExport, setShowCsvExport] = useState(false);
  const [isExportingJson, setIsExportingJson] = useState(false);

  // Pre-populate display name from backend
  useEffect(() => {
    if (profile?.name) {
      setDisplayName(profile.name);
    }
  }, [profile?.name]);

  const handleCopyPrincipal = () => {
    if (!principal) return;
    navigator.clipboard.writeText(principal).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveProfile = () => {
    const langMap: Record<LangCode, Language> = {
      en: Language.en,
      nl: Language.nl,
      pl: Language.pl,
      th: Language.th,
      zh: Language.zh,
    };

    // Save email to localStorage
    localStorage.setItem(EMAIL_STORAGE_KEY, email.trim());

    // Save display name to backend
    updateProfile(
      {
        name: displayName.trim() || (profile?.name ?? ""),
        language: langMap[lang],
      },
      {
        onSuccess: () => toast.success("Profile saved!"),
        onError: (e) => toast.error(`${t.error}: ${e.message}`),
      },
    );
  };

  const handleCsvImport = async (entries: ParsedEntry[]) => {
    for (const entry of entries) {
      try {
        await addPasswordAsync({
          title: entry.title,
          username: entry.username,
          password: entry.password,
          url: entry.url,
          notes: entry.notes,
          email: "",
          category: "",
          totp: "",
          customFields: [],
        });
      } catch (err) {
        console.error("CSV import entry failed:", entry.title, err);
      }
    }
    await qc.invalidateQueries({ queryKey: ["passwords"] });
    await qc.refetchQueries({ queryKey: ["passwords"] });
  };

  const handleJsonExport = async () => {
    setIsExportingJson(true);
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        version: "2.0.0",
        app: "Dokmai IC",
        data: {
          passwords: (passwords ?? []).map((p) => ({
            title: p.title,
            username: p.username,
            password: p.password,
            url: p.url,
            notes: p.notes,
            email: p.email,
            category: p.category,
            totp: p.totp,
            customFields: (p.customFields ?? []).map((cf) => ({
              name: cf.name,
              value: cf.value,
              fieldType: cf.fieldType,
            })),
            attachmentFilename:
              (p.blob as unknown as Record<string, unknown>)?.filename ??
              (p.blob as unknown as Record<string, unknown>)?.name ??
              (p.blob as unknown as Record<string, unknown>)?.blobId ??
              null,
          })),
          notes: (notes ?? []).map((n) => ({
            title: n.title,
            content: n.content,
            attachmentFilename:
              (n.blob as unknown as Record<string, unknown>)?.filename ??
              (n.blob as unknown as Record<string, unknown>)?.name ??
              (n.blob as unknown as Record<string, unknown>)?.blobId ??
              null,
          })),
        },
        summary: {
          passwordCount: (passwords ?? []).length,
          noteCount: (notes ?? []).length,
        },
      };

      const json = JSON.stringify(backup, null, 2);
      const fileBlob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dokmai-ic-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("JSON backup downloaded successfully!");
    } catch (_e) {
      toast.error(t.error);
    } finally {
      setIsExportingJson(false);
    }
  };

  const existingTitles = (passwords ?? []).map((p) => p.title);

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.settingsTitle}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Manage your profile, identity, and preferences
        </p>
      </div>

      {/* Profile Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "#22D3EE" }}>
          Profile
        </h3>
        <div className="flex flex-col gap-4">
          {/* Display Name */}
          <div>
            <Label
              htmlFor="settings-name"
              className="text-xs mb-1.5 flex items-center gap-1.5"
              style={{ color: "#9BB0C9" }}
            >
              <User size={12} />
              Display Name
            </Label>
            <Input
              id="settings-name"
              data-ocid="settings.profile_name.input"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveProfile();
              }}
              style={{
                background: "#071427",
                border: "1px solid #1A3354",
                color: "#EAF2FF",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
              Shown in the sidebar and avatar area.
            </p>
          </div>

          {/* Email Address */}
          <div>
            <Label
              htmlFor="settings-email"
              className="text-xs mb-1.5 flex items-center gap-1.5"
              style={{ color: "#9BB0C9" }}
            >
              <Mail size={12} />
              Email Address
            </Label>
            <Input
              id="settings-email"
              data-ocid="settings.profile_email.input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveProfile();
              }}
              style={{
                background: "#071427",
                border: "1px solid #1A3354",
                color: "#EAF2FF",
              }}
            />
            <p className="text-xs mt-1" style={{ color: "#9BB0C9" }}>
              Stored locally on this device. Shown in the avatar dropdown menu.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button
            data-ocid="settings.profile_save.primary_button"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
            className="rounded-full font-semibold text-sm px-6"
            style={{ background: "#22D3EE", color: "#071427" }}
          >
            {isSavingProfile ? (
              <Loader2 size={14} className="animate-spin mr-1.5" />
            ) : null}
            Save Profile
          </Button>
        </div>
      </motion.section>

      {/* Identity Section */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "#22D3EE" }}>
          Identity
        </h3>
        <div className="flex flex-col gap-4">
          {/* Principal ID */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Key size={12} style={{ color: "#9BB0C9" }} />
              <span className="text-xs" style={{ color: "#9BB0C9" }}>
                Principal ID
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="mono-id flex-1 min-w-0 truncate">
                {principal || "Not authenticated"}
              </div>
              {principal && (
                <button
                  type="button"
                  onClick={handleCopyPrincipal}
                  data-ocid="settings.identity_copy.button"
                  className="flex-shrink-0 p-2 rounded-lg transition-all"
                  style={{
                    background: copied
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(34,211,238,0.08)",
                    border: copied
                      ? "1px solid rgba(34,197,94,0.3)"
                      : "1px solid rgba(34,211,238,0.2)",
                    color: copied ? "#22c55e" : "#22D3EE",
                  }}
                  aria-label="Copy Principal ID"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
              )}
            </div>
          </div>

          {/* Authentication Status */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={12} style={{ color: "#9BB0C9" }} />
              <span className="text-xs" style={{ color: "#9BB0C9" }}>
                Authentication Status
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  background: identity ? "#22c55e" : "#ef4444",
                  boxShadow: identity ? "0 0 8px #22c55e" : undefined,
                }}
              />
              <span
                className="text-sm"
                style={{ color: identity ? "#22c55e" : "#ef4444" }}
              >
                {identity
                  ? "Authenticated via Internet Identity"
                  : "Not authenticated"}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Language */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-4 text-sm" style={{ color: "#22D3EE" }}>
          {t.settingsLanguage}
        </h3>
        <Select value={lang} onValueChange={(v) => setLang(v as LangCode)}>
          <SelectTrigger
            data-ocid="settings.language.select"
            className="max-w-xs"
            style={{
              background: "#071427",
              border: "1px solid #1A3354",
              color: "#EAF2FF",
            }}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            style={{ background: "#0D1F3A", borderColor: "#1A3354" }}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.code}
                value={opt.code}
                style={{ color: "#EAF2FF" }}
              >
                {opt.flag} {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.section>

      {/* Import & Export */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-3 text-sm" style={{ color: "#22D3EE" }}>
          Import & Export
        </h3>
        <p className="text-sm mb-4" style={{ color: "#9BB0C9" }}>
          {t.csvImportDesc}
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button
            data-ocid="settings.csv_import.open_modal_button"
            onClick={() => setShowCsvImport(true)}
            className="rounded-full text-sm font-medium"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.3)",
              color: "#22D3EE",
            }}
            variant="outline"
          >
            <Upload size={14} className="mr-2" />
            {t.csvImport}
          </Button>
          <Button
            data-ocid="settings.csv_export.open_modal_button"
            onClick={() => setShowCsvExport(true)}
            className="rounded-full text-sm font-medium"
            style={{
              background: "rgba(34,211,238,0.1)",
              border: "1px solid rgba(34,211,238,0.3)",
              color: "#22D3EE",
            }}
            variant="outline"
          >
            <Download size={14} className="mr-2" />
            Export CSV
          </Button>
          <Button
            data-ocid="settings.json_export.primary_button"
            onClick={handleJsonExport}
            disabled={isExportingJson}
            className="rounded-full text-sm font-medium"
            style={{
              background: "rgba(168,85,247,0.1)",
              border: "1px solid rgba(168,85,247,0.3)",
              color: "#A855F7",
            }}
            variant="outline"
          >
            {isExportingJson ? (
              <Loader2 size={14} className="mr-2 animate-spin" />
            ) : (
              <FileJson size={14} className="mr-2" />
            )}
            Export JSON
          </Button>
        </div>

        <CsvImportModal
          open={showCsvImport}
          onClose={() => setShowCsvImport(false)}
          existingTitles={existingTitles}
          onImport={handleCsvImport}
          onComplete={(count) => {
            setShowCsvImport(false);
            toast.success(`Import complete — ${count} passwords added`);
            navigate({ to: "/passwords" });
          }}
        />
        <CsvExportModal
          open={showCsvExport}
          onClose={() => setShowCsvExport(false)}
          passwords={passwords ?? []}
        />
      </motion.section>

      {/* Internet Identity & Logout */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-gradient-border p-5"
      >
        <h3 className="font-semibold mb-3 text-sm" style={{ color: "#22D3EE" }}>
          Internet Identity
        </h3>
        <p className="text-sm mb-3" style={{ color: "#9BB0C9" }}>
          Manage devices, recovery keys, and linked accounts.
        </p>
        <a
          href="https://identity.ic0.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all"
          style={{
            background: "rgba(34,211,238,0.08)",
            border: "1px solid rgba(34,211,238,0.25)",
            color: "#22D3EE",
          }}
          data-ocid="settings.manage_ii.link"
        >
          <ExternalLink size={14} />
          {t.settingsManageII}
        </a>
      </motion.section>

      {/* Logout */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center"
      >
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              data-ocid="settings.logout.open_modal_button"
              variant="outline"
              className="rounded-full text-sm"
              style={{
                borderColor: "rgba(239,68,68,0.4)",
                color: "#ef4444",
                background: "transparent",
              }}
            >
              <LogOut size={14} className="mr-1" />
              {t.settingsLogout}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent
            data-ocid="settings.logout.dialog"
            style={{
              background: "#0D1F3A",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#EAF2FF",
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle style={{ color: "#EAF2FF" }}>
                Confirm Logout
              </AlertDialogTitle>
              <AlertDialogDescription style={{ color: "#9BB0C9" }}>
                {t.settingsLogoutConfirm}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                data-ocid="settings.logout.cancel_button"
                style={{
                  background: "transparent",
                  borderColor: "#1A3354",
                  color: "#9BB0C9",
                }}
              >
                {t.cancel}
              </AlertDialogCancel>
              <AlertDialogAction
                data-ocid="settings.logout.confirm_button"
                onClick={clear}
                style={{ background: "#ef4444", color: "#fff" }}
              >
                {t.settingsLogout}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
}
