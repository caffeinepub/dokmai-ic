import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Download,
  HardDriveDownload,
  Loader2,
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
        version: "2.0.0",
        app: "Dokmai IC",
        data: {
          passwords: passwords.map((p) => ({
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
              (p.blob as any)?.filename ??
              (p.blob as any)?.name ??
              (p.blob as any)?.blobId ??
              null,
          })),
          notes: notes.map((n) => ({
            title: n.title,
            content: n.content,
            attachmentFilename:
              (n.blob as any)?.filename ??
              (n.blob as any)?.name ??
              (n.blob as any)?.blobId ??
              null,
          })),
        },
        summary: {
          passwordCount: passwords.length,
          noteCount: notes.length,
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
          Full vault backup including all passwords and notes
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

        {/* Security warning */}
        <div
          className="flex items-start gap-3 p-3 rounded-xl mb-5"
          style={{
            background: "rgba(234,179,8,0.06)",
            border: "1px solid rgba(234,179,8,0.25)",
          }}
        >
          <AlertTriangle
            size={16}
            className="flex-shrink-0 mt-0.5"
            style={{ color: "#f59e0b" }}
          />
          <p className="text-xs" style={{ color: "#d4a947" }}>
            This file contains sensitive data including passwords. Store it
            securely and do not share it.
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
