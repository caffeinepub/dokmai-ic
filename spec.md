# Dokmai IC

## Current State
The app uses a "First Admin" pattern where the first principal to call `_initializeAccessControlWithSecret` with the correct `CAFFEINE_ADMIN_TOKEN` becomes admin. No principal is currently hardcoded as admin, making it impossible to access the admin panel without knowing the token.

## Requested Changes (Diff)

### Add
- `isHardcodedAdmin()` helper function in `access-control.mo` that checks against the fixed Principal ID `das6p-4z7ap-pfikd-uyqal-be35z-ijkl6-gqwz6-npfvx-7sf5b-ekchz-vqe`
- `initializeAdmin()` function that registers the hardcoded admin without a token check

### Modify
- `access-control.mo`: `isAdmin()`, `getUserRole()`, `initialize()` — all short-circuit to return admin for the hardcoded principal without any token or map lookup
- `MixinAuthorization.mo`: `_initializeAccessControlWithSecret()` — if caller is hardcoded admin, call `initializeAdmin()` directly (bypasses token check)

### Remove
- Nothing removed

## Implementation Plan
1. ✅ Add `HARDCODED_ADMIN` constant and `isHardcodedAdmin()` to `access-control.mo`
2. ✅ Add `initializeAdmin()` to register admin without token
3. ✅ Update `isAdmin()`, `getUserRole()`, `initialize()` to short-circuit for hardcoded admin
4. ✅ Update `MixinAuthorization.mo` to call `initializeAdmin()` when caller is hardcoded admin
5. No frontend changes needed — `useActor.ts` already calls `_initializeAccessControlWithSecret` on login which now correctly handles the hardcoded admin
