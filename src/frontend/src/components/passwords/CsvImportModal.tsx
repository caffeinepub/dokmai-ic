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
  category: string;
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

/**
 * Parse a full CSV text into rows.
 * Handles multiline quoted fields correctly — a newline inside "..." is part
 * of the field value, not a row boundary.
 * Strips BOM and normalises all line endings before scanning.
 */
function parseCSV(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present (NordPass exports include it)
  const stripped = text.startsWith("\uFEFF") ? text.slice(1) : text;
  // Normalise ALL line endings to \n
  const normalized = stripped.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into logical rows, respecting quoted multiline fields
  const logicalLines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (ch === '"') {
      // Escaped quote ("") inside a quoted field
      if (inQuotes && normalized[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
        current += ch;
      }
    } else if (ch === "\n" && !inQuotes) {
      logicalLines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) logicalLines.push(current);

  // Need at least a header row — return empty array only if no lines at all
  if (logicalLines.length === 0) return [];

  const headers = parseCSVLine(logicalLines[0]).map((h) =>
    h.trim().toLowerCase(),
  );

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < logicalLines.length; i++) {
    const line = logicalLines[i].trim();
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

interface ColumnMapping {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  category: string;
  /** When true, parseEntries will filter rows where type !== 'login' */
  isNordpass: boolean;
}

function detectFormat(headers: string[]): ColumnMapping {
  // Normalise to lowercase for all comparisons
  const h = headers.map((x) => x.trim().toLowerCase());

  // NordPass: identified by 'additional_urls' (unique to NordPass) plus either
  // 'cardholdername' or 'type' — accept either so partial exports still match.
  // NordPass notes column is "note" (singular), NOT "notes".
  if (
    h.includes("additional_urls") &&
    (h.includes("cardholdername") || h.includes("type"))
  ) {
    return {
      title: "name",
      username: "username",
      password: "password",
      url: "url",
      notes: "note",
      category: "folder",
      isNordpass: true,
    };
  }

  // Bitwarden: login_username / login_password
  if (h.includes("login_username") || h.includes("login_password")) {
    return {
      title: h.includes("name") ? "name" : h[0],
      username: "login_username",
      password: "login_password",
      url: h.includes("login_uri") ? "login_uri" : "login_url",
      notes: h.includes("notes") ? "notes" : "",
      category: "",
      isNordpass: false,
    };
  }

  // LastPass / Chrome / Generic with name+username+password
  if (h.includes("username") && h.includes("password") && h.includes("name")) {
    return {
      title: "name",
      username: "username",
      password: "password",
      url: h.includes("url") ? "url" : "",
      notes: h.includes("extra") ? "extra" : h.includes("notes") ? "notes" : "",
      category: h.includes("grouping")
        ? "grouping"
        : h.includes("group")
          ? "group"
          : h.includes("folder")
            ? "folder"
            : "",
      isNordpass: false,
    };
  }

  // Fully generic fallback
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
    category: "",
    isNordpass: false,
  };
}

function parseEntries(
  rows: Record<string, string>[],
  existingTitles: string[],
): { entries: ParsedEntry[]; skippedNonLogin: number; isNordpass: boolean } {
  if (rows.length === 0)
    return { entries: [], skippedNonLogin: 0, isNordpass: false };
  const headers = Object.keys(rows[0]);
  const mapping = detectFormat(headers);
  const existingSet = new Set(existingTitles.map((t) => t.toLowerCase()));

  // For NordPass: filter to login entries only — other types (card, identity,
  // secure note) are intentionally excluded from the password vault.
  let filteredRows = rows;
  let skippedNonLogin = 0;
  if (mapping.isNordpass) {
    const loginRows = rows.filter((r) => {
      const typeVal = (r.type ?? "").trim().toLowerCase();
      return typeVal === "password" || typeVal === "login";
    });
    skippedNonLogin = rows.length - loginRows.length;
    if (skippedNonLogin > 0) {
      console.warn(
        `[NordPass import] Skipped ${skippedNonLogin} non-login entries (cards, identities, notes).`,
      );
    }
    filteredRows = loginRows;
    // Return empty array gracefully — handleFile() will show a specific message
    if (filteredRows.length === 0) {
      return { entries: [], skippedNonLogin, isNordpass: true };
    }
  }

  const entries = filteredRows
    .map((row) => {
      const title = (row[mapping.title] ?? "").trim();
      const username = (row[mapping.username] ?? "").trim();
      const password = (row[mapping.password] ?? "").trim();
      const url = (row[mapping.url] ?? "").trim();
      const notes = mapping.notes ? (row[mapping.notes] ?? "").trim() : "";
      const category = mapping.category
        ? (row[mapping.category] ?? "").trim()
        : "";
      if (!title && !password) return null;
      const isDuplicate = existingSet.has(title.toLowerCase());
      return {
        title: title || "(no title)",
        username,
        password,
        url,
        notes,
        category,
        isDuplicate,
        action: (isDuplicate ? "skip" : "import") as ParsedEntry["action"],
      };
    })
    .filter(Boolean) as ParsedEntry[];

  return { entries, skippedNonLogin, isNordpass: mapping.isNordpass };
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
  const [skippedNonLogin, setSkippedNonLogin] = useState(0);
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
            // File is empty or could not be read as CSV
            setParseError(t.csvImportInvalid);
            return;
          }
          const {
            entries: parsed,
            skippedNonLogin: nonLogin,
            isNordpass,
          } = parseEntries(rows, existingTitles);
          if (parsed.length === 0) {
            if (isNordpass) {
              setParseError(
                "No password entries found. Make sure your NordPass export contains password-type entries.",
              );
            } else {
              setParseError(t.csvImportInvalid);
            }
            return;
          }
          setEntries(parsed);
          setChecked(parsed.map(() => true));
          setSkippedNonLogin(nonLogin);
          setStep("preview");
        } catch (err) {
          console.error("[CSV import] Unexpected parse error:", err);
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

  const handleImport = async () => {
    const toImport = entries.filter(
      (e, i) => checked[i] && e.action !== "skip",
    );
    const total = toImport.length;
    const skippedCount =
      entries.length -
      entries.filter((e, i) => checked[i] && e.action !== "skip").length;
    if (total === 0) {
      setImportedCount(0);
      setSkippedCount(skippedCount);
      setStep("done");
      return;
    }
    setStep("importing");
    setProgress(10);
    try {
      await onImport(toImport);
      setProgress(100);
    } catch {
      // continue — onImport handles error display
    }
    setImportedCount(total);
    setSkippedCount(skippedCount);
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
    setSkippedNonLogin(0);
    setSearchQuery("");
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

  const [searchQuery, setSearchQuery] = useState("");

  const duplicateCount = entries.filter((e) => e.isDuplicate).length;
  const newCount = entries.length - duplicateCount;
  const selectedCount = checked.filter(Boolean).length;

  const filteredEntries = searchQuery.trim()
    ? entries
        .map((entry, idx) => ({ entry, idx }))
        .filter(({ entry }) => {
          const q = searchQuery.toLowerCase();
          return (
            entry.title.toLowerCase().includes(q) ||
            entry.username.toLowerCase().includes(q)
          );
        })
    : entries.map((entry, idx) => ({ entry, idx }));

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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm" style={{ color: "#9BB0C9" }}>
                    {entries.length} items —{" "}
                    <span style={{ color: "#22D3EE" }}>{newCount} new</span>,{" "}
                    <span style={{ color: "#fbbf24" }}>
                      {duplicateCount} {t.csvImportDuplicates}
                    </span>
                  </span>
                  {skippedNonLogin > 0 && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(148,163,184,0.08)",
                        color: "#94a3b8",
                        border: "1px solid rgba(148,163,184,0.2)",
                      }}
                      title="Cards, identities, and secure notes from NordPass were excluded — only login entries are imported"
                    >
                      {skippedNonLogin} non-login skipped
                    </span>
                  )}
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
                    className="text-xs h-8 min-h-[36px]"
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
                        className="text-xs h-8 min-h-[36px]"
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
                        className="text-xs h-8 min-h-[36px]"
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

              {/* Search bar */}
              <div className="flex-shrink-0">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or username..."
                  data-ocid="csv_import.search_input"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 8,
                    background: "#071427",
                    border: "1px solid #1A3354",
                    color: "#EAF2FF",
                    fontSize: 13,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(34,211,238,0.5)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#1A3354";
                  }}
                />
              </div>

              {/* Scrollable table container */}
              <div
                className="rounded-lg border flex-1 min-h-0"
                style={{
                  borderColor: "#1A3354",
                  overflow: "auto",
                }}
              >
                <table
                  style={{
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
                      {/* Select checkbox header */}
                      <th
                        style={{
                          width: 44,
                          padding: "10px 12px",
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
                      {["Name", "Username"].map((label) => (
                        <th
                          key={label}
                          style={{
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontWeight: 500,
                            fontSize: 13,
                            textAlign: "left",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map(({ entry, idx }) => (
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
                        {/* Checkbox — sticky */}
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
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.title}
                        >
                          <span>{entry.title}</span>
                          {entry.isDuplicate && (
                            <span
                              style={{
                                marginLeft: 6,
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "1px 6px",
                                borderRadius: 999,
                                fontSize: 10,
                                background: "rgba(251,191,36,0.12)",
                                color: "#fbbf24",
                                border: "1px solid rgba(251,191,36,0.3)",
                                verticalAlign: "middle",
                              }}
                              title={`"${entry.title}" already exists in your vault — will be skipped`}
                            >
                              Duplicate
                            </span>
                          )}
                        </td>

                        {/* Username */}
                        <td
                          style={{
                            padding: "10px 12px",
                            color: "#9BB0C9",
                            fontSize: 13,
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={entry.username}
                        >
                          {entry.username || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between gap-2 flex-shrink-0 pt-1 flex-wrap">
                <Button
                  data-ocid="csv_import.back.button"
                  variant="outline"
                  onClick={() => {
                    setStep("upload");
                    setEntries([]);
                    setFileName("");
                  }}
                  className="min-h-[44px]"
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
                  className="font-semibold min-h-[44px]"
                  style={{
                    background:
                      selectedCount === 0 ? "rgba(34,211,238,0.3)" : "#22D3EE",
                    color: "#071427",
                  }}
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
              <div className="flex gap-2 mt-2 flex-wrap justify-center">
                <Button
                  data-ocid="csv_import.close.button"
                  variant="outline"
                  onClick={handleClose}
                  className="min-h-[44px]"
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
                    className="font-semibold min-h-[44px]"
                    style={{ background: "#22D3EE", color: "#071427" }}
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
