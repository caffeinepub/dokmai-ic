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
}

type Step = "upload" | "preview" | "importing" | "done";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 2) return [];

  // Parse header
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

  // Bitwarden: has login_username or login_password
  if (h.includes("login_username") || h.includes("login_password")) {
    return {
      title: h.includes("name") ? "name" : h[0],
      username: "login_username",
      password: "login_password",
      url: h.includes("login_uri") ? "login_uri" : "login_url",
      notes: h.includes("notes") ? "notes" : "",
    };
  }

  // LastPass / Chrome both have: name, url, username, password
  // LastPass has 'extra' for notes
  if (h.includes("username") && h.includes("password") && h.includes("name")) {
    return {
      title: "name",
      username: "username",
      password: "password",
      url: h.includes("url") ? "url" : "",
      notes: h.includes("extra") ? "extra" : h.includes("notes") ? "notes" : "",
    };
  }

  // Generic fallback
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
    }
    const skipped =
      entries.length -
      entries.filter((e, i) => checked[i] && e.action !== "skip").length;
    setImportedCount(imported);
    setSkippedCount(skipped);
    setStep("done");
  };

  const handleClose = () => {
    setStep("upload");
    setFileName("");
    setEntries([]);
    setChecked([]);
    setParseError("");
    setProgress(0);
    setImportedCount(0);
    setSkippedCount(0);
    onClose();
  };

  const duplicateCount = entries.filter((e) => e.isDuplicate).length;
  const newCount = entries.length - duplicateCount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        data-ocid="csv_import.dialog"
        className="max-w-3xl w-full p-0 overflow-hidden flex flex-col max-h-[90vh]"
        style={{
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

        <div className="p-6 pt-4 overflow-y-auto flex-1">
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
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm" style={{ color: "#9BB0C9" }}>
                    {entries.length} {t.csvImportPreview}{" "}
                    <span style={{ color: "#22D3EE" }}>({newCount} new</span>,{" "}
                    <span style={{ color: "#fbbf24" }}>
                      {duplicateCount} {t.csvImportDuplicates}
                    </span>
                    )
                  </span>
                </div>
                {duplicateCount > 0 && (
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </div>

              <div
                className="rounded-lg border overflow-auto max-h-[45vh]"
                style={{ borderColor: "#1A3354" }}
              >
                <Table className="min-w-[640px]">
                  <TableHeader>
                    <TableRow
                      style={{
                        borderColor: "#1A3354",
                        background: "rgba(7,20,39,0.8)",
                      }}
                    >
                      <TableHead className="w-10" style={{ color: "#9BB0C9" }}>
                        ☐
                      </TableHead>
                      <TableHead style={{ color: "#9BB0C9" }}>Title</TableHead>
                      <TableHead style={{ color: "#9BB0C9" }}>
                        Username
                      </TableHead>
                      <TableHead style={{ color: "#9BB0C9" }}>URL</TableHead>
                      <TableHead style={{ color: "#9BB0C9" }}>Status</TableHead>
                      <TableHead style={{ color: "#9BB0C9" }}>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry, idx) => (
                      <TableRow
                        key={`${entry.title}-${idx}`}
                        data-ocid={`csv_import.item.${idx + 1}`}
                        style={{
                          borderColor: "#1A3354",
                          background: entry.isDuplicate
                            ? "rgba(251,191,36,0.04)"
                            : idx % 2 === 0
                              ? "rgba(7,20,39,0.4)"
                              : "rgba(13,31,58,0.6)",
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            data-ocid={`csv_import.checkbox.${idx + 1}`}
                            checked={checked[idx]}
                            onCheckedChange={() => toggleRow(idx)}
                            style={{
                              borderColor: checked[idx] ? "#22D3EE" : "#1A3354",
                            }}
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium text-sm max-w-[160px] truncate"
                          style={{
                            color: entry.isDuplicate ? "#fbbf24" : "#EAF2FF",
                          }}
                          title={entry.title}
                        >
                          {entry.title}
                        </TableCell>
                        <TableCell
                          className="text-sm max-w-[140px] truncate"
                          style={{ color: "#9BB0C9" }}
                          title={entry.username}
                        >
                          {entry.username || "—"}
                        </TableCell>
                        <TableCell
                          className="text-xs max-w-[140px] truncate"
                          style={{ color: "#9BB0C9" }}
                          title={entry.url}
                        >
                          {entry.url || "—"}
                        </TableCell>
                        <TableCell>
                          {entry.isDuplicate ? (
                            <Badge
                              className="text-xs"
                              style={{
                                background: "rgba(251,191,36,0.12)",
                                color: "#fbbf24",
                                border: "1px solid rgba(251,191,36,0.3)",
                              }}
                            >
                              Duplicate
                            </Badge>
                          ) : (
                            <Badge
                              className="text-xs"
                              style={{
                                background: "rgba(34,211,238,0.1)",
                                color: "#22D3EE",
                                border: "1px solid rgba(34,211,238,0.25)",
                              }}
                            >
                              New
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {entry.isDuplicate && checked[idx] ? (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEntryAction(idx, "skip")}
                                className="text-xs px-2 py-0.5 rounded-full transition-all"
                                style={{
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
                                }}
                              >
                                {t.csvImportSkip}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEntryAction(idx, "overwrite")}
                                className="text-xs px-2 py-0.5 rounded-full transition-all"
                                style={{
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
                                }}
                              >
                                {t.csvImportOverwrite}
                              </button>
                            </div>
                          ) : (
                            <span
                              className="text-xs"
                              style={{ color: "#4A6888" }}
                            >
                              {entry.action === "skip" ? t.csvImportSkip : "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between gap-2">
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
                  style={{ background: "#22D3EE", color: "#071427" }}
                  className="font-semibold"
                >
                  {t.csvImportStart} ({checked.filter(Boolean).length})
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
                  style={{
                    background: "rgba(34,211,238,0.1)",
                  }}
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
              <div className="flex gap-2">
                <div
                  className="px-4 py-2 rounded-lg text-sm text-center"
                  style={{
                    background: "rgba(34,211,238,0.08)",
                    border: "1px solid rgba(34,211,238,0.2)",
                    color: "#22D3EE",
                    minWidth: "100px",
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
                    minWidth: "100px",
                  }}
                >
                  <div className="text-2xl font-bold">{skippedCount}</div>
                  <div className="text-xs" style={{ color: "#9BB0C9" }}>
                    Skipped
                  </div>
                </div>
              </div>
              <Button
                data-ocid="csv_import.close.button"
                onClick={handleClose}
                style={{ background: "#22D3EE", color: "#071427" }}
                className="font-semibold mt-2"
              >
                {t.close}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
