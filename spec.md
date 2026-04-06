# Dokmai IC

## Current State
- VaultPage has Add Note dialog with title + content fields only
- `addSecureNoteToVault` backend accepts `blob: ?Storage.ExternalBlob` (already implemented)
- `SecureNote` type has `blob?: ExternalBlob` in backend.d.ts
- `useAddSecureNote` hook currently passes `null` for blob
- blob-storage component is now selected and available
- `ExternalBlob` can be created from bytes via `ExternalBlob.fromBytes()`

## Requested Changes (Diff)

### Add
- File upload field in Add Note dialog (1 file per note, all file types)
- Upload progress indicator in the dialog
- File attachment display in note card (filename + download/open button)
- File attachment display in View Note dialog (filename + download button)
- `useAddSecureNoteWithFile` hook (or update existing) that accepts optional file and uploads blob

### Modify
- `useAddSecureNote` hook: accept optional `file: File | null` and upload via `ExternalBlob.fromBytes()`
- VaultPage Add Note dialog: add file input field below content textarea
- VaultPage note card: show file attachment badge if `note.blob` is present
- VaultPage View Note dialog: show file download link if `note.blob` is present
- `SecureNote` type handling: use `note.blob?.getDirectURL()` for download

### Remove
- Nothing removed

## Implementation Plan
1. Update `useAddSecureNote` hook in `useQueries.ts` to accept optional `file: File | null`; if file provided, read as bytes and create `ExternalBlob.fromBytes()`, pass to `addSecureNoteToVault`
2. Update VaultPage Add Note dialog: add file input, show selected filename, upload progress state
3. Update note card: show paperclip icon + filename badge if `note.blob` present
4. Update View Note dialog: show download button linking to `note.blob.getDirectURL()` if blob present
5. Import `ExternalBlob` from backend.d in hooks
