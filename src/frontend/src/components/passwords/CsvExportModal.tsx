import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download } from "lucide-react";
import { useState } from "react";
import type { PasswordEntry } from "../../hooks/useQueries";

type ExportFormat = "chrome" | "lastpass" | "bitwarden" | "generic";

interface CsvExportModalProps {
  open: boolean;
  onClose: () => void;
  passwords: PasswordEntry[];
}

function escapeCsvValue(val: string): string {
  if (!val) return "";
  // If value contains comma, quote, or newline — wrap in quotes and escape internal quotes
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function buildCsv(entries: PasswordEntry[], format: ExportFormat): string {
  const e = escapeCsvValue;

  switch (format) {
    case "chrome": {
      const header = "name,url,username,password";
      const rows = entries.map(
        (p) => `${e(p.title)},${e(p.url)},${e(p.username)},${e(p.password)}`,
      );
      return [header, ...rows].join("\n");
    }
    case "lastpass": {
      const header = "url,username,password,totp,extra,name,grouping,fav";
      const rows = entries.map(
        (p) =>
          `${e(p.url)},${e(p.username)},${e(p.password)},${e(p.totp)},${e(p.notes)},${e(p.title)},${e(p.category)},0`,
      );
      return [header, ...rows].join("\n");
    }
    case "bitwarden": {
      const header =
        "folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp";
      const rows = entries.map(
        (p) =>
          `,0,login,${e(p.title)},${e(p.notes)},,0,${e(p.url)},${e(p.username)},${e(p.password)},${e(p.totp)}`,
      );
      return [header, ...rows].join("\n");
    }
    default: {
      const header = "title,url,username,email,password,notes,category,totp";
      const rows = entries.map(
        (p) =>
          `${e(p.title)},${e(p.url)},${e(p.username)},${e(p.email)},${e(p.password)},${e(p.notes)},${e(p.category)},${e(p.totp)}`,
      );
      return [header, ...rows].join("\n");
    }
  }
}

const FORMAT_INFO: Record<ExportFormat, { label: string; columns: string }> = {
  chrome: {
    label: "Google Chrome",
    columns: "name, url, username, password",
  },
  lastpass: {
    label: "LastPass",
    columns: "url, username, password, totp, notes, name, category, fav",
  },
  bitwarden: {
    label: "Bitwarden",
    columns:
      "folder, type, name, notes, login_uri, login_username, login_password, login_totp",
  },
  generic: {
    label: "Generic / Universal",
    columns: "title, url, username, email, password, notes, category, totp",
  },
};

export function CsvExportModal({
  open,
  onClose,
  passwords,
}: CsvExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("generic");

  const handleDownload = () => {
    const csv = buildCsv(passwords, format);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().split("T")[0];
    const filename = `dokmai-export-${format}-${today}.csv`;
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="csv_export.dialog"
        style={{
          background: "#0D1F3A",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "#EAF2FF",
          maxWidth: 480,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: "#EAF2FF" }}>
            Export Passwords as CSV
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-2">
          <p className="text-sm" style={{ color: "#9BB0C9" }}>
            Choose the format you want to export. You can import this file into
            most password managers.
          </p>

          {/* Format selector */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium" style={{ color: "#9BB0C9" }}>
              Export Format
            </span>
            <Select
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              <SelectTrigger
                data-ocid="csv_export.format.select"
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
                {(
                  Object.entries(FORMAT_INFO) as [
                    ExportFormat,
                    (typeof FORMAT_INFO)[ExportFormat],
                  ][]
                ).map(([key, info]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    style={{ color: "#EAF2FF" }}
                  >
                    {info.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Column preview */}
          <div
            className="rounded-lg p-3"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.12)",
            }}
          >
            <p
              className="text-xs font-medium mb-1"
              style={{ color: "#22D3EE" }}
            >
              Columns included:
            </p>
            <p className="text-xs font-mono" style={{ color: "#9BB0C9" }}>
              {FORMAT_INFO[format].columns}
            </p>
          </div>

          {/* Entry count */}
          <p className="text-xs" style={{ color: "#9BB0C9" }}>
            {passwords.length} password{passwords.length !== 1 ? "s" : ""} will
            be exported
          </p>

          <div className="flex gap-2 justify-end mt-2">
            <Button
              data-ocid="csv_export.cancel_button"
              variant="ghost"
              onClick={onClose}
              style={{ color: "#9BB0C9" }}
            >
              Cancel
            </Button>
            <Button
              data-ocid="csv_export.download.primary_button"
              onClick={handleDownload}
              disabled={passwords.length === 0}
              className="font-semibold"
              style={{
                background:
                  passwords.length === 0 ? "#1A3354" : "rgba(34,211,238,0.15)",
                border: "1px solid rgba(34,211,238,0.4)",
                color: passwords.length === 0 ? "#9BB0C9" : "#22D3EE",
              }}
            >
              <Download size={14} className="mr-2" />
              Download CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
