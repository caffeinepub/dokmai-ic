# Dokmai IC

## Current State
- SettingsPage has sections: Profile, Account IDs, Language, Internet Identity, and Save/Logout actions
- Password entries are stored via `addPasswordEntryToVault` (title, username, password, url, notes, blob)
- All 9 pages are live; no CSV import feature exists
- 5-language support via LanguageContext

## Requested Changes (Diff)

### Add
- CSV Import section in SettingsPage ("Import & Data" section)
- `CsvImportModal` component that:
  - Accepts file upload (drag & drop + click)
  - Parses CSV and auto-detects format (Chrome, LastPass, Bitwarden, generic)
  - Shows preview table of parsed entries before import
  - Detects duplicates (same title) against existing passwords
  - For duplicate entries: shows conflict resolution UI (Skip / Overwrite per row, or bulk Select All Skip / Select All Overwrite)
  - Imports selected entries via `addPasswordEntryToVault`
  - Shows import progress and success/error summary
- New translation keys for CSV import UI in all 5 languages

### Modify
- SettingsPage: add new "Import & Data" section with "Import CSV" button (above Save button)
- LanguageContext: add CSV import translation keys to all 5 language objects

### Remove
- Nothing removed

## Implementation Plan
1. Add CSV import translation keys to LanguageContext (all 5 languages)
2. Create `src/frontend/src/components/passwords/CsvImportModal.tsx`
   - File input (drag & drop + click to browse)
   - CSV parser with auto-detect for Chrome/LastPass/Bitwarden/generic column headers
   - Preview table with checkboxes per row
   - Duplicate detection logic (compare title against existing passwords prop)
   - Per-row conflict resolution: Skip / Overwrite radio buttons for duplicates
   - Bulk action buttons: "Skip All Duplicates" / "Overwrite All Duplicates"
   - Import button that calls addPasswordEntryToVault for each selected row
   - Progress indicator and final summary toast
3. Update SettingsPage: import CsvImportModal, add "Import & Data" section with trigger button
