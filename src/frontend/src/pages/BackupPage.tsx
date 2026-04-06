import { Button } from "@/components/ui/button";
import {
  Download,
  HardDriveDownload,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { usePasswordEntries, useSecureNotes } from "../hooks/useQueries";

export default function BackupPage() {
  const { t } = useLanguage();
  const { data: passwords = [] } = usePasswordEntries();
  const { data: notes = [] } = useSecureNotes();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const backup = {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        app: "Dokmai IC",
        data: {
          passwords: passwords.map((p) => ({
            title: p.title,
            username: p.username,
            url: p.url,
            notes: p.notes,
          })),
          notes: notes.map((n) => ({
            title: n.title,
            content: n.content,
          })),
        },
        summary: {
          passwordCount: passwords.length,
          noteCount: notes.length,
        },
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dokmai-ic-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(t.backupSuccess);
    } catch (_e) {
      toast.error(t.error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#EAF2FF" }}>
          {t.backupTitle}
        </h1>
        <p className="text-sm" style={{ color: "#9BB0C9" }}>
          Export your vault data for safekeeping
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-gradient-border p-6"
      >
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(34,211,238,0.12)",
              border: "1px solid rgba(34,211,238,0.2)",
            }}
          >
            <HardDriveDownload size={24} style={{ color: "#22D3EE" }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: "#EAF2FF" }}>
              {t.backupTitle}
            </h3>
            <p className="text-sm" style={{ color: "#9BB0C9" }}>
              {t.backupDescription}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: "Passwords", value: passwords.length, color: "#22D3EE" },
            { label: "Secure Notes", value: notes.length, color: "#A855F7" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-3 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1A3354",
              }}
            >
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "#9BB0C9" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Security notice */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl mb-5"
          style={{
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.15)",
          }}
        >
          <ShieldCheck
            size={16}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "#eab308" }}
          />
          <p className="text-xs" style={{ color: "#9BB0C9" }}>
            Passwords are not included in the export for security. Copy
            passwords individually from the Password Manager. The exported file
            contains metadata, notes, and vault structure.
          </p>
        </div>

        <Button
          data-ocid="backup.export.primary_button"
          onClick={handleExport}
          disabled={isExporting}
          className="w-full rounded-full font-semibold text-sm h-11"
          style={{
            background: "#22D3EE",
            color: "#071427",
            boxShadow: "0 0 20px rgba(34,211,238,0.3)",
          }}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin mr-2" />
          ) : (
            <Download size={16} className="mr-2" />
          )}
          {t.backupExport}
        </Button>
      </motion.div>
    </div>
  );
}
