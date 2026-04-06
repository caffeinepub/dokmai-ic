import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  Loader2,
  SkipForward,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

export interface ParsedEntry {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  isDuplicate: boolean;
  action: "import" | "skip" | "overwrite";
}

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  existingTitles: string[];
  onImport: (entries: ParsedEntry[]) => Promise<void>;
  /** Called after import completes — use to navigate to passwords page */
  onComplete?: (importedCount: number) => void;
}

type Step = "upload" | "preview" | "importing" | "done";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map((h) => h.trim().toLowerCase());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function detectFormat(headers: string[]): {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
} {
  const h = headers.map((x) => x.toLowerCase());

  if (h.includes("login_username") || h.includes("login_password")) {
    return {
      title: h.includes("name") ? "name" : h[0],
      username: "login_username",
      password: "login_password",
      url: h.includes("login_uri") ? "login_uri" : "login_url",
      notes: h.includes("notes") ? "notes" : "",
    };
  }

  if (h.includes("username") && h.includes("password") && h.includes("name")) {
    return {
      title: "name",
      username: "username",
      password: "password",
      url: h.includes("url") ? "url" : "",
      notes: h.includes("extra") ? "extra" : h.includes("notes") ? "notes" : "",
    };
  }

  const titleCol =
    h.find((x) => x === "title") ||
    h.find((x) => x === "name") ||
    h.find((x) => x.includes("title")) ||
    h[0];
  const usernameCol =
    h.find((x) => x === "username") ||
    h.find((x) => x === "user") ||
    h.find((x) => x === "email") ||
    h.find((x) => x.includes("user")) ||
    "";
  const passwordCol =
    h.find((x) => x === "password") ||
    h.find((x) => x === "pass") ||
    h.find((x) => x.includes("password")) ||
    h.find((x) => x.includes("pass")) ||
    "";
  const urlCol =
    h.find((x) => x === "url") ||
    h.find((x) => x === "website") ||
    h.find((x) => x === "site") ||
    h.find((x) => x.includes("url")) ||
    "";
  const notesCol =
    h.find((x) => x === "notes") ||
    h.find((x) => x === "note") ||
    h.find((x) => x.includes("notes")) ||
    "";

  return {
    title: titleCol ?? h[0],
    username: usernameCol,
    password: passwordCol,
    url: urlCol,
    notes: notesCol,
  };
}

function parseEntries(
  rows: Record<string, string>[],
  existingTitles: string[],
): ParsedEntry[] {
  if (rows.length === 0) return [];
  const headers = Object.keys(rows[0]);
  const mapping = detectFormat(headers);
  const existingSet = new Set(existingTitles.map((t) => t.toLowerCase()));

  return rows
    .map((row) => {
      const title = (row[mapping.title] ?? "").trim();
      const username = (row[mapping.username] ?? "").trim();
      const password = (row[mapping.password] ?? "").trim();
      const url = (row[mapping.url] ?? "").trim();
      const notes = mapping.notes ? (row[mapping.notes] ?? "").trim() : "";
      if (!title && !password) return null;
      const isDuplicate = existingSet.has(title.toLowerCase());
      return {
        title: title || "(no title)",
        username,
        password,
        url,
        notes,
        isDuplicate,
        action: (isDuplicate ? "skip" : "import") as ParsedEntry["action"],
      };
    })
    .filter(Boolean) as ParsedEntry[];
}

export function CsvImportModal({
  open,
  onClose,
  existingTitles,
  onImport,
  onComplete,
}: CsvImportModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [entries, setEntries] = useState<ParsedEntry[]>([]);
  const [checked, setChecked] = useState<boolean[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [skippedCount, setSkippedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        setParseError(t.csvImportInvalid);
        return;
      }
      setParseError("");
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = parseCSV(text);
          if (rows.length === 0) {
            setParseError(t.csvImportInvalid);
            return;
          }
          const parsed = parseEntries(rows, existingTitles);
          if (parsed.length === 0) {
            setParseError(t.csvImportInvalid);
            return;
          }
          setEntries(parsed);
          setChecked(parsed.map(() => true));
          setStep("preview");
        } catch {
          setParseError(t.csvImportInvalid);
        }
      };
      reader.readAsText(file);
    },
    [existingTitles, t.csvImportInvalid],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const toggleRow = (idx: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const allChecked = checked.length > 0 && checked.every(Boolean);
  const someChecked = checked.some(Boolean) && !allChecked;
  const toggleAll = () => {
    if (allChecked) {
      setChecked(entries.map(() => false));
    } else {
      setChecked(entries.map(() => true));
    }
  };

  const setAllDuplicatesAction = (action: "skip" | "overwrite") => {
    setEntries((prev) =>
      prev.map((e) => (e.isDuplicate ? { ...e, action } : e)),
    );
  };

  const setEntryAction = (idx: number, action: ParsedEntry["action"]) => {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], action };
      return next;
    });
  };

  const handleImport = async () => {
    const toImport = entries.filter(
      (e, i) => checked[i] && e.action !== "skip",
    );
    const total = toImport.length;
    if (total === 0) {
      const skipped = entries.filter(
        (e, i) => !checked[i] || e.action === "skip",
      ).length;
      setImportedCount(0);
      setSkippedCount(skipped);
      setStep("done");
      return;
    }
    setStep("importing");
    setProgress(0);
    let imported = 0;
    for (const entry of toImport) {
      try {
        await onImport([entry]);
      } catch {
        // continue on error
      }
      imported++;
      setProgress(Math.round((imported / total) * 100));
      await new Promise((r) => setTimeout(r, 50));
    }
    const skipped =
      entries.length -
      entries.filter((e, i) => checked[i] && e.action !== "skip").length;
    setImportedCount(imported);
    setSkippedCount(skipped);
    setStep("done");
  };

  const resetState = () => {
    setStep("upload");
    setFileName("");
    setEntries([]);
    setChecked([]);
    setParseError("");
    setProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleGoToPasswords = () => {
    const count = importedCount;
    resetState();
    onClose();
    onComplete?.(count);
  };

  const duplicateCount = entries.filter((e) => e.isDuplicate).length;
  const newCount = entries.length - duplicateCount;
  const selectedCount = checked.filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="csv_import.dialog"
        className="w-[95vw] max-w-5xl p-0 overflow-hidden flex flex-col"
        style={{
          maxHeight: "92vh",
          background: "#0D1F3A",
          border: "1px solid rgba(34,211,238,0.2)",
          color: "#EAF2FF",
        }}
      >
        <DialogHeader className="p-6 pb-0 flex-shrink-0">
          <DialogTitle
            style={{ color: "#EAF2FF" }}
            className="flex items-center gap-2"
          >
            <FileUp size={18} style={{ color: "#22D3EE" }} />
            {t.csvImportTitle}
          </DialogTitle>
          <p className="text-sm mt-1" style={{ color: "#9BB0C9" }}>
            {t.csvImportDesc}
          </p>
        </DialogHeader>

        <div className="p-6 pt-4 flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Step 1: Upload */}
          {step === "upload" && (
            <div className="flex flex-col gap-4">
              <label
                data-ocid="csv_import.dropzone"
                htmlFor="csv-file-input"
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                className="cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-12 transition-all"
                style={{
                  borderColor: isDragOver ? "#22D3EE" : "rgba(34,211,238,0.25)",
                  background: isDragOver
                    ? "rgba(34,211,238,0.06)"
                    : "rgba(34,211,238,0.02)",
                }}
              >
                <Upload
                  size={32}
                  style={{
                    color: isDragOver ? "#22D3EE" : "rgba(34,211,238,0.5)",
                  }}
                />
                <p
                  className="text-sm font-medium"
                  style={{ color: isDragOver ? "#22D3EE" : "#9BB0C9" }}
                >
                  {fileName ? fileName : t.csvImportDrop}
                </p>
                {fileName && (
                  <Badge
                    style={{
                      background: "rgba(34,211,238,0.12)",
                      color: "#22D3EE",
                      border: "1px solid rgba(34,211,238,0.3)",
                    }}
                  >
                    {fileName}
                  </Badge>
                )}
                <input
                  id="csv-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={handleFileInput}
                  data-ocid="csv_import.upload_button"
                />
              </label>

              {parseError && (
                <div
                  data-ocid="csv_import.error_state"
                  className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
                  style={{
                    background: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    color: "#f87171",
                  }}
                >
                  <XCircle size={15} />
                  {parseError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  data-ocid="csv_import.cancel_button"
                  variant="outline"
                  onClick={handleClose}
                  style={{
                    background: "transparent",
                    border: "1px solid #1A3354",
                    color: "#9BB0C9",
                  }}
                >
                  {t.cancel}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === "preview" && (
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              {/* Stats + bulk actions row */}
              <div className="flex flex-wrap items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm" style={{ color: "#9BB0C9" }}>
                    {entries.length} items —{" "}
                    <span style={{ color: "#22D3EE" }}>{newCount} new</span>,{" "}
                    <span style={{ color: "#fbbf24" }}>
                      {duplicateCount} {t.csvImportDuplicates}
                    </span>
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(34,211,238,0.1)",
                      color: "#22D3EE",
                      border: "1px solid rgba(34,211,238,0.2)",
                    }}
                  >
                    {selectedCount} selected
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleAll}
                    className="text-xs h-7"
                    style={{
                      background: allChecked
                        ? "rgba(34,211,238,0.1)"
                        : "transparent",
                      border: "1px solid rgba(34,211,238,0.3)",
                      color: "#22D3EE",
                    }}
                  >
                    {allChecked ? "Deselect All" : "Select All"}
                  </Button>
                  {duplicateCount > 0 && (
                    <>
                      <Button
                        data-ocid="csv_import.skip_all.button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAllDuplicatesAction("skip")}
                        className="text-xs h-7"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(251,191,36,0.3)",
                          color: "#fbbf24",
                        }}
                      >
                        <SkipForward size={12} className="mr-1" />
                        {t.csvImportSkipAll}
                      </Button>
                      <Button
                        data-ocid="csv_import.overwrite_all.button"
                        size="sm"
                        variant="outline"
                        onClick={() => setAllDuplicatesAction("overwrite")}
                        className="text-xs h-7"
                        style={{
                          background: "transparent",
                          border: "1px solid rgba(34,211,238,0.3)",
                          color: "#22D3EE",
                        }}
                      >
                        {t.csvImportOverwriteAll}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Scrollable table container — both axes */}
              <div
                className="rounded-lg border flex-1 min-h-0"
                style={{
                  borderColor: "#1A3354",
                  overflow: "auto",
                  overflowX: "auto",
                  overflowY: "auto",
                }}
              >
                <table
                  style={{
                    minWidth: "800px",
                    width: "100%",
                    borderCollapse: "collapse",
                    tableLayout: "auto",
                  }}
                >
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      background: "#071427",
                    }}
                  >
                    <tr style={{ borderBottom: "1px solid #1A3354" }}>
                      <th
                        style={{
                          width: 44,
                          padding: "10px 12px",
                          color: "#9BB0C9",
                          fontWeight: 500,
                          fontSize: 13,
                          textAlign: "left",
                          position: "sticky",
                          left: 0,
                          background: "#071427",
                          zIndex: 11,
                        }}
                      >
                        <Checkbox
                          checked={allChecked}
                          data-state={
                            someChecked
                              ? "indeterminate"
                              : allChecked
                                ? "checked"
                                : "unchecked"
                          }
                          onCheckedChange={toggleAll}
                          aria-label="Select all"
                          style={{
                            borderColor:
                              allChecked || someChecked ? "#22D3EE" : "#1A3354",
                          }}
                        />
                      </th>
                      {[
                        { label: "Title", width: 180 },
                        { label: "Username", width: 160 },
                        { label: "URL", width: 220 },
                        { label: "Notes", width: 160 },
                        { label: "Status", width: 100 },
                        { label: "Action", width: 180 },
                      ].map(({ label, width }) => (
                        <th
                          key={label}
                          style={{
                            minWidth: width,
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontWeight: 500,
                            fontSize: 13,
                            textAlign: "left",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, idx) => (
                      <tr
                        key={`${entry.title}-${idx}`}
                        data-ocid={`csv_import.item.${idx + 1}`}
                        style={{
                          borderBottom: "1px solid rgba(26,51,84,0.6)",
                          background: !checked[idx]
                            ? "rgba(7,20,39,0.25)"
                            : entry.isDuplicate
                              ? "rgba(251,191,36,0.04)"
                              : idx % 2 === 0
                                ? "rgba(7,20,39,0.4)"
                                : "rgba(13,31,58,0.6)",
                          opacity: checked[idx] ? 1 : 0.4,
                          transition: "opacity 0.15s",
                        }}
                      >
                        {/* checkbox — sticky */}
                        <td
                          style={{
                            padding: "10px 12px",
                            position: "sticky",
                            left: 0,
                            background: "inherit",
                            zIndex: 2,
                          }}
                        >
                          <Checkbox
                            data-ocid={`csv_import.checkbox.${idx + 1}`}
                            checked={checked[idx]}
                            onCheckedChange={() => toggleRow(idx)}
                            style={{
                              borderColor: checked[idx] ? "#22D3EE" : "#1A3354",
                            }}
                          />
                        </td>
                        {/* Title */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: entry.isDuplicate ? "#fbbf24" : "#EAF2FF",
                            fontSize: 13,
                            fontWeight: 500,
                            maxWidth: 180,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.title}
                        >
                          {entry.title}
                        </td>
                        {/* Username */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontSize: 13,
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.username}
                        >
                          {entry.username || "—"}
                        </td>
                        {/* URL */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontSize: 12,
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.url}
                        >
                          {entry.url || "—"}
                        </td>
                        {/* Notes */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontSize: 12,
                            maxWidth: 160,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.notes}
                        >
                          {entry.notes || "—"}
                        </td>
                        {/* Status badge */}
                        <td style={{ padding: "10px 12px" }}>
                          {entry.isDuplicate ? (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                background: "rgba(251,191,36,0.12)",
                                color: "#fbbf24",
                                border: "1px solid rgba(251,191,36,0.3)",
                              }}
                            >
                              Duplicate
                            </span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 999,
                                fontSize: 11,
                                background: "rgba(34,211,238,0.1)",
                                color: "#22D3EE",
                                border: "1px solid rgba(34,211,238,0.25)",
                              }}
                            >
                              New
                            </span>
                          )}
                        </td>
                        {/* Action */}
                        <td style={{ padding: "10px 12px" }}>
                          {entry.isDuplicate && checked[idx] ? (
                            <div style={{ display: "flex", gap: 4 }}>
                              <button
                                type="button"
                                onClick={() => setEntryAction(idx, "skip")}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  cursor: "pointer",
                                  background:
                                    entry.action === "skip"
                                      ? "rgba(251,191,36,0.15)"
                                      : "transparent",
                                  border: `1px solid ${
                                    entry.action === "skip"
                                      ? "rgba(251,191,36,0.5)"
                                      : "rgba(251,191,36,0.2)"
                                  }`,
                                  color:
                                    entry.action === "skip"
                                      ? "#fbbf24"
                                      : "#9BB0C9",
                                  transition: "all 0.15s",
                                }}
                              >
                                {t.csvImportSkip}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEntryAction(idx, "overwrite")}
                                style={{
                                  fontSize: 11,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  cursor: "pointer",
                                  background:
                                    entry.action === "overwrite"
                                      ? "rgba(34,211,238,0.12)"
                                      : "transparent",
                                  border: `1px solid ${
                                    entry.action === "overwrite"
                                      ? "rgba(34,211,238,0.4)"
                                      : "rgba(34,211,238,0.15)"
                                  }`,
                                  color:
                                    entry.action === "overwrite"
                                      ? "#22D3EE"
                                      : "#9BB0C9",
                                  transition: "all 0.15s",
                                }}
                              >
                                {t.csvImportOverwrite}
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: "#4A6888" }}>
                              {!checked[idx]
                                ? "Not selected"
                                : entry.action === "skip"
                                  ? t.csvImportSkip
                                  : "—"}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between gap-2 flex-shrink-0 pt-1">
                <Button
                  data-ocid="csv_import.back.button"
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setEntries([]);
                    setFileName("");
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #1A3354",
                    color: "#9BB0C9",
                  }}
                >
                  {t.cancel}
                </Button>
                <Button
                  data-ocid="csv_import.start.primary_button"
                  onClick={handleImport}
                  disabled={selectedCount === 0}
                  style={{
                    background:
                      selectedCount === 0 ? "rgba(34,211,238,0.3)" : "#22D3EE",
                    color: "#071427",
                  }}
                  className="font-semibold"
                >
                  {t.csvImportStart} ({selectedCount})
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {step === "importing" && (
            <div
              data-ocid="csv_import.loading_state"
              className="flex flex-col items-center gap-6 py-10"
            >
              <Loader2
                size={40}
                className="animate-spin"
                style={{ color: "#22D3EE" }}
              />
              <div className="w-full max-w-sm flex flex-col gap-2">
                <div
                  className="flex justify-between text-sm"
                  style={{ color: "#9BB0C9" }}
                >
                  <span>Importing passwords...</span>
                  <span>{progress}%</span>
                </div>
                <Progress
                  value={progress}
                  className="h-2"
                  style={{ background: "rgba(34,211,238,0.1)" }}
                />
              </div>
            </div>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div
              data-ocid="csv_import.success_state"
              className="flex flex-col items-center gap-5 py-10"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,211,238,0.1)" }}
              >
                <CheckCircle2 size={32} style={{ color: "#22D3EE" }} />
              </div>
              <div className="text-center flex flex-col gap-1">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#EAF2FF" }}
                >
                  {t.csvImportSuccess}
                </h3>
                <p className="text-sm" style={{ color: "#9BB0C9" }}>
                  {importedCount} imported, {skippedCount} skipped
                </p>
              </div>
              <div className="flex gap-3">
                <div
                  className="px-4 py-2 rounded-lg text-sm text-center"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    color: "#22D3EE",
                    minWidth: 100,
                  }}
                >
                  <div className="text-2xl font-bold">{importedCount}</div>
                  <div className="text-xs" style={{ color: "#9BB0C9" }}>
                    Imported
                  </div>
                </div>
                <div
                  className="px-4 py-2 rounded-lg text-sm text-center"
                  style={{
                    background: "rgba(251,191,36,0.06)",
                    border: "1px solid rgba(251,191,36,0.2)",
                    color: "#fbbf24",
                    minWidth: 100,
                  }}
                >
                  <div className="text-2xl font-bold">{skippedCount}</div>
                  <div className="text-xs" style={{ color: "#9BB0C9" }}>
                    Skipped
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  data-ocid="csv_import.close.button"
                  variant="outline"
                  onClick={handleClose}
                  style={{
                    background: "transparent",
                    border: "1px solid #1A3354",
                    color: "#9BB0C9",
                  }}
                >
                  {t.close}
                </Button>
                {importedCount > 0 && (
                  <Button
                    data-ocid="csv_import.goto_passwords.button"
                    onClick={handleGoToPasswords}
                    style={{ background: "#22D3EE", color: "#071427" }}
                    className="font-semibold"
                  >
                    View Passwords
                    <ArrowRight size={14} className="ml-1" />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
