# Dokmai IC

## Current State

Admin Panel has 2 sections implemented:
- User Management (v19): view users with Principal ID, block/unblock, delete, usage stats
- Feedback Management (v20/v21): filter tabs, mark read/resolved, delete, admin reply visible to users

Backend has: `getActiveUserCount`, `listAllUsersWithPrincipals`, feedback CRUD with reply, password/notes CRUD.

No system-level stats or login activity tracking exists yet.

## Requested Changes (Diff)

### Add
- Backend: `getSystemStats` query — returns total users, blocked users count, total passwords, total notes, total feedback, unread feedback count
- Backend: `recordLoginActivity` shared call — records a login event (Principal, timestamp) in a stable log
- Backend: `getLoginActivityLog` query (admin only) — returns array of `LoginActivity` records (principal, timestamp, loginCount)
- Frontend: `SystemMonitoringSection` component added to AdminPage, positioned above UserManagement
  - Overview cards: Total Users, Blocked Users, Unread Feedback, Total Passwords, Total Notes, Total Feedback
  - Login Activity Log table: Principal ID (truncated + copy), timestamp of last login, login count

### Modify
- `AdminPage.tsx`: Add `SystemMonitoringSection` between stats row and UserManagementSection
- `useQueries.ts`: Add `useSystemStats` and `useLoginActivityLog` hooks
- `main.mo`: Add `SystemStats` type, `LoginActivity` type, `loginActivityLog` stable var, `getSystemStats`, `recordLoginActivity`, `getLoginActivityLog` functions

### Remove
- Nothing removed

## Implementation Plan

1. Add `LoginActivity` type and `loginActivityLog` stable map to backend
2. Add `getSystemStats` query (admin only): aggregates user/feedback/password/note counts across all vaults
3. Add `recordLoginActivity` shared call: upsert login record for caller (increment count, update timestamp)
4. Add `getLoginActivityLog` query (admin only): return sorted login activity array
5. Regenerate backend bindings
6. Add `useSystemStats` and `useLoginActivityLog` hooks to `useQueries.ts`
7. Build `SystemMonitoringSection` in AdminPage with overview stat cards and login activity table
