# Dokmai IC

## Current State
- PasswordsPage.tsx: Password entries display in cards. TOTP field exists but only shows bullet dots + copy secret key button. No real-time code generation.
- SettingsPage.tsx: Has CSV Import modal. No Export functionality yet.
- Passwords are stored with fields: title, username, password, url, notes, email, category, totp (secret key), customFields.
- No TOTP library exists in the project — must implement RFC 6238 TOTP using Web Crypto API (client-side only).

## Requested Changes (Diff)

### Add
- **TOTP Real-time Code Generator** inside PasswordCard component:
  - When a password entry has a `totp` secret key, show a live 6-digit TOTP code (RFC 6238, SHA-1, 30-second period)
  - Countdown ring/bar showing seconds remaining before next code
  - Copy button for the live code (NOT the secret key)
  - Implemented 100% client-side using Web Crypto API (no external library)
  - Update every second via `useEffect` + `setInterval`
- **Export CSV** in SettingsPage:
  - Button next to Import CSV in the "Import & Data" section
  - Modal/dialog to choose export format: Chrome / LastPass / Bitwarden / Generic
  - Generates and downloads CSV file in chosen format
  - Column mappings per format:
    - Chrome: `name,url,username,password`
    - LastPass: `url,username,password,totp,extra,name,grouping,fav`
    - Bitwarden: `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp`
    - Generic: `title,url,username,email,password,notes,category,totp`

### Modify
- PasswordCard TOTP section: replace static bullet display with live code + countdown
- SettingsPage Import & Data section: add Export CSV button alongside Import CSV button

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/utils/totp.ts` — pure client-side TOTP code generator using Web Crypto API (RFC 6238)
2. Create `src/frontend/src/hooks/useTotpCode.ts` — React hook that uses the totp util, updates every second, returns `{ code, secondsRemaining }`
3. Update `PasswordsPage.tsx` — replace the TOTP section in PasswordCard with live code display using `useTotpCode` hook, countdown progress bar, and copy button
4. Create `src/frontend/src/components/passwords/CsvExportModal.tsx` — modal with format selector (Chrome/LastPass/Bitwarden/Generic) and download button
5. Update `SettingsPage.tsx` — add Export CSV button that opens CsvExportModal, passing passwords data
