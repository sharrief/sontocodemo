---
phase: quick
plan: 260418-gmh
subsystem: auth
tags: [security, bcrypt, session, cookie, auth]
dependency_graph:
  requires: []
  provides: [bcrypt-auth, secure-session-cookies, uuid-applicant-session]
  affects: [users.repository, application.repository, auth.ts, appAuth.ts, server.ts, applications.controller]
tech_stack:
  added: [bcryptjs@latest, @types/bcryptjs@latest]
  patterns: [bcrypt-cost-12, uuid-session-tokens, httponly-secure-samesite-cookies]
key_files:
  created: []
  modified:
    - src/server/repositories/users.repository.ts
    - src/server/repositories/application.repository.ts
    - src/server/middleware/auth.ts
    - src/server/middleware/appAuth.ts
    - src/server/server.ts
    - src/server/controllers/applications.controller.ts
    - src/server/lib/db.ts
decisions:
  - No migration path for existing password/PIN hashes — demo data invalidated by design
  - bcrypt cost factor 12 chosen for security/performance balance on Node.js
  - Applicant session now stores UUID (not authEmail+appPIN) — plain PIN survives only in memory during createApplication for email delivery
  - findOneOrNull now supports only manager UUID-based lookups; applicant lookups use findByEmail/findByUuid
metrics:
  duration: 18m
  completed: 2026-04-18
  tasks_completed: 3
  files_modified: 7
---

# Quick 260418-gmh: Fix Security Issues CR-01, CR-02, CR-03, CR-07 Summary

**One-liner:** Replaced SHA-256+salt password hashing with bcrypt(12) for users, hashed applicant PINs with bcrypt and stored UUID in session, removed hardcoded user ID backdoor, and added httpOnly/secure/sameSite=strict cookie flags.

## Tasks Completed

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | CR-03 remove backdoor, CR-07 cookie flags, install bcryptjs | 8c9773d | db.ts, server.ts, users.repository.ts, package.json |
| 2 | CR-01 replace SHA-256 with bcrypt for user passwords | d15c408 | users.repository.ts, auth.ts |
| 3 | CR-02 hash applicant PINs, store UUID in session | f336895 | application.repository.ts, appAuth.ts, server.ts, applications.controller.ts |

## What Was Changed

### CR-03: Hardcoded User ID Backdoor Removed
Deleted `.orWhere('user.id IN (:userIds)', { userIds: [294, 443, 72, 762, 802] })` from `findByEmailAndHashedPassword` (now `findByEmailForAuth`). Only role-based and `hasAccountsAccess` checks remain.

### CR-07: Session Cookie Security Flags
Added `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, and `sameSite: 'strict' as const` to `sessionConfig.cookie` in `src/server/lib/db.ts`. Added `expressApp.set('trust proxy', 1)` to `src/server/server.ts` so Express trusts the reverse proxy (Cloudflare Tunnel) when setting secure cookies.

### CR-01: SHA-256 Password Hashing Replaced with bcrypt
- Renamed `findByEmailAndHashedPassword(email, hash)` to `findByEmailForAuth(email)` — returns user by email only, with `user.password` and `user.otpSecret1` selected (both have `select: false` on the entity).
- `checkUserEmailAndPass` in `auth.ts` now calls `findByEmailForAuth(email)` then `bcrypt.compare(password, user.hashedPassword)`.
- `disableOTPRequirements`: removed SHA-256 with OTP salt; uses `bcrypt.compare` + `bcrypt.hash(password, 12)`.
- `validateTempOPTSecret`: removed SHA-256 with normal salt; uses `bcrypt.compare` + `bcrypt.hash(password, 12)` for the OTP-mode stored hash.
- `doPasswordReset`: removed `let salt = ...` and SHA-256; uses `bcrypt.hash(newPassword, 12)` directly.
- Removed `import crypto` and `import env` from `auth.ts` (no longer needed); kept `import crypto` in `users.repository.ts` for `startPasswordReset` (generates UUID-based reset hash).

### CR-02: Applicant PIN Hashing + UUID Session
**Repository changes (`application.repository.ts`):**
- Added `findByEmail(authEmail)` — looks up application by email without PIN (for bcrypt verification step).
- Added `findByUuid(uuid)` — looks up application by UUID without authorization filter (for session deserialization).
- `createApplication`: generates plain PIN, hashes it with `bcrypt.hash(plainPIN, 12)`, stores hash in DB. Returns `{ ...app, appPIN: plainPIN }` so the controller can email the plain PIN without storing it.
- `saveApplication(uuid, updatedApplication)` — signature changed from `(authEmail, appPIN, ...)` to `(uuid, ...)`.
- `findOneOrNull` simplified to manager UUID-only lookup (`LookupQuery = {authUserId, uuid}`); authEmail+appPIN branch removed.

**Middleware changes (`appAuth.ts`):**
- `checkApplicantAuthEmailAndAppPIN`: calls `findByEmail(authEmail)` then `bcrypt.compare(appPIN, app.appPIN)`.
- `deserializeApplication(uuid)`: accepts UUID, calls `findByUuid(uuid)`.

**Server changes (`server.ts`):**
- `serializeUser` for applications: stores `{ type, uuid }` instead of `{ type, authEmail, appPIN }`.
- `deserializeUser` for applications: reads `uuid`, calls `deserializeApplication(uuid)`.
- Updated `SerializedData` type to `{ type, id, uuid? }` (removed `authEmail`, `appPIN`).

**Controller changes (`applications.controller.ts`):**
- `load` and `loadFromSession`: use `req.user.application.uuid` + `findByUuid(uuid)` instead of `findOneOrNull({ authEmail, appPIN })`.
- `save`: checks `req.user.application?.uuid` instead of `authEmail && appPIN`; uses `findByUuid` for applicant session path; calls `saveApplication(savedApplication.uuid, updatedApplication)`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] createApplication uniqueness check was wrong after removing appPIN lookup**
- **Found during:** Task 3
- **Issue:** The original `do/while` loop checked uniqueness using `findOneOrNull({ appPIN, authEmail })` — since `findOneOrNull` no longer supports that signature, replaced with `findByEmail(authEmail)`. This actually changes semantics (one application per email, not one per email+PIN), which is the correct behavior since existing applications already prevent new ones.
- **Fix:** Changed `existingApp = await this.findOneOrNull({ appPIN, authEmail })` to `existingApp = await this.findByEmail(authEmail)`.
- **Files modified:** application.repository.ts

**2. [Rule 2 - Missing functionality] user.password has select:false — must be explicitly selected**
- **Found during:** Task 2
- **Issue:** The `User.hashedPassword` column is mapped to `password` column with `{ select: false }`. The new `findByEmailForAuth` method must explicitly add `.addSelect('user.password')` or bcrypt.compare would receive an empty string.
- **Fix:** Added `.addSelect('user.password')` to the query in `findByEmailForAuth`.
- **Files modified:** users.repository.ts

## Known Stubs

None — all auth paths are fully wired with bcrypt.

## Threat Flags

None — this task closes existing threat surface; no new surface introduced.

## Self-Check: PASSED

- `src/server/repositories/users.repository.ts` exists with `findByEmailForAuth` and bcrypt imports: VERIFIED
- `src/server/repositories/application.repository.ts` exists with `findByEmail`, `findByUuid`, bcrypt import: VERIFIED
- `src/server/middleware/auth.ts` exists with bcrypt import, no crypto/env: VERIFIED
- `src/server/middleware/appAuth.ts` exists with bcrypt import, UUID-based deserialize: VERIFIED
- `src/server/lib/db.ts` exists with cookie flags: VERIFIED
- `src/server/server.ts` exists with trust proxy and UUID session: VERIFIED
- Commits 8c9773d, d15c408, f336895 exist in git log: VERIFIED
