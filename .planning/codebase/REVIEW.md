---
phase: codebase
reviewed: 2026-04-18T00:00:00Z
depth: deep
files_reviewed: 40
files_reviewed_list:
  - src/server/server.ts
  - src/server/middleware/auth.ts
  - src/server/middleware/appAuth.ts
  - src/server/middleware/anon.ts
  - src/server/lib/db.ts
  - src/server/lib/env.ts
  - src/server/lib/email.ts
  - src/server/lib/log.ts
  - src/server/lib/util.ts
  - src/server/controllers/accounts.controller.ts
  - src/server/controllers/users.controller.ts
  - src/server/controllers/requests.controller.ts
  - src/server/controllers/statements.controller.ts
  - src/server/controllers/trades.controller.ts
  - src/server/controllers/operations.controller.ts
  - src/server/controllers/documents.controller.ts
  - src/server/controllers/applications.controller.ts
  - src/server/controllers/bankAccounts.controller.ts
  - src/server/controllers/managers.controllers.ts
  - src/server/controllers/tradeLog.controller.ts
  - src/server/repositories/users.repository.ts
  - src/server/repositories/statements.repository.ts
  - src/server/repositories/operations.repository.ts
  - src/server/repositories/requests.repository.ts
  - src/server/repositories/trades.repository.ts
  - src/server/repositories/documents.repository.ts
  - src/server/repositories/bankData.repository.ts
  - src/server/repositories/application.repository.ts
  - src/server/repositories/auth.repository.helper.ts
  - src/server/repositories/receivingBank.repository.ts
  - src/server/repositories/tradeLog.repository.ts
  - src/server/repositories/tradeModel.repository.ts
  - src/server/repositories/tradeSymbol.repository.ts
  - src/server/sockets/statements.sockets.ts
  - src/server/jobs/request.jobs.ts
  - src/server/jobs/seed.jobs.ts
  - src/server/entities/User.ts
  - src/server/entities/Session.ts
  - src/shared/api/fetch.api.ts
  - src/shared/validation.ts
findings:
  critical: 9
  warning: 14
  info: 9
  total: 32
status: issues_found
---

# Codebase Security and Quality Review

**Reviewed:** 2026-04-18
**Depth:** deep
**Files Reviewed:** 40
**Status:** issues_found

## Summary

This is a financial account management platform handling accounts, statements, trades, wire transfers, and applicant onboarding. The codebase was written when the author was less experienced and shows a number of patterns common to that stage: security-by-convention rather than security-by-enforcement, inconsistent role-checking placement, error messages that leak internal state, and several critical authentication/authorization gaps.

The most serious concerns are:

1. **Applicant PIN stored and compared in plaintext** — the appPIN is never hashed. It lives in the database and session verbatim and is used directly in SQL queries.
2. **The applicant portal (application route) has no CSRF protection** — the session is shared with the main auth path and the login POST endpoint regenerates the session, but the application auth path skips the explicit `req.logout()` before `req.session.regenerate()`.
3. **Password hashing uses SHA-256 with a static env-var salt** — not bcrypt/argon2. This is inadequate for a financial system.
4. **The seed job executes raw SQL read directly from disk** — if the SQL file is tampered with (e.g., via path traversal of the filesystem, or a compromised container) this can result in arbitrary query execution against the live database.
5. **Hard-coded user IDs in a login whitelist** — `findByEmailAndHashedPassword` in users.repository.ts hard-codes specific user IDs (294, 443, 72, 762, 802) as always allowed to log in regardless of role. This is a persistent access bypass that will survive role changes and account status changes.
6. **`AuthenticateApplicant` middleware has a naming collision that silently swallows errors** — the local `error` parameter in the catch block shadows the imported `error` log function, so application auth errors are never logged.
7. **Missing authorization on several financial write endpoints** — `RequestsController.postOperationRequest`, `RequestsController.recurOperationRequest`, `RequestsController.cancelOperationRequest` do not call `AUTH_ALLOW_MANAGER` at the controller layer; authorization is only enforced inside the repository, meaning the controller-level role check is absent and the repository check is the only gate.
8. **`deserializeApplication` re-authenticates from session-stored PIN on every request** — every request to an applicant-authenticated endpoint performs a DB lookup using the appPIN stored verbatim in the session cookie.
9. **`getConnection` can return `null` and callers do not check** — when the DB is unavailable, `getConnection()` returns `null` and callers immediately call `.getCustomRepository()` on it, producing an unhandled runtime crash.

---

## Critical Issues

### CR-01: Password hashing uses SHA-256 with a static salt, not a proper KDF

**File:** `src/server/middleware/auth.ts:28-29` and `src/server/repositories/users.repository.ts:233-237`
**Issue:** Passwords are hashed with `crypto.createHash('sha256').update(password + salt)`. SHA-256 is a fast hash and is not suitable for password storage. Even with a static salt (which is the same for all users), this is crackable with commodity GPU hardware in minutes for common passwords. A financial application must use bcrypt, scrypt, or argon2.
**Fix:**
```typescript
// Replace all password hashing with bcrypt
import bcrypt from 'bcrypt';

// When storing:
const hashedPassword = await bcrypt.hash(plainPassword, 12);

// When verifying:
const isValid = await bcrypt.compare(plainPassword, storedHash);
```
The `DB_PASSWORD_SALT` and `DB_PASSWORD_2FA_SALT` env vars would no longer be needed. A migration is required to re-hash all stored passwords on next login (reset-on-login pattern).

---

### CR-02: Applicant PIN stored and compared in plaintext

**File:** `src/server/middleware/appAuth.ts:12-21`, `src/server/repositories/application.repository.ts:176-201`, `src/server/entities/Session.ts:6-10`
**Issue:** The `appPIN` is stored verbatim in the `application` table and in the session. `deserializeApplication` and `findOneOrNull` both receive the raw PIN and pass it directly into SQL `WHERE` clauses. If the database or session store is compromised, all applicant PINs are exposed.
**Fix:**
```typescript
// Hash the PIN before storage (bcrypt or argon2)
// In createApplication:
const hashedPIN = await bcrypt.hash(appPIN, 10);
// Store hashedPIN, not appPIN

// In authentication:
const isValid = await bcrypt.compare(submittedPIN, storedHashedPIN);
```
Note: this requires changing how `deserializeApplication` works — it cannot reconstruct the application from a hash alone; it must look up by `authEmail` only and then bcrypt-compare the PIN.

---

### CR-03: Hard-coded user IDs in login whitelist bypass role enforcement

**File:** `src/server/repositories/users.repository.ts:111-112`
**Issue:** The login query contains `.orWhere('user.id IN (:userIds)', { userIds: [294, 443, 72, 762, 802] })`. These five user IDs are permanently allowed to log in regardless of their `role_id`, `status`, or `hasAccountsAccess` value. If any of these accounts are compromised or reassigned, there is no way to revoke access through normal account management. This is also a backdoor pattern.
**Fix:**
```typescript
// Remove the hard-coded ID list entirely.
// The correct gate is already expressed:
.andWhere(new Brackets((expression) => {
  expression
    .andWhere('user.role_id IN (:allowedRoles)', { allowedRoles: [RoleId.admin, RoleId.manager, RoleId.director, RoleId.seniorTrader] })
    .orWhere('user.hasAccountsAccess = 1');
}));
```

---

### CR-04: Seed job executes raw SQL read directly from an unvalidated file path

**File:** `src/server/jobs/seed.jobs.ts:14-16`
**Issue:** `reseedDatabase()` reads `demodata/prod/sontoco.sql` using `fs.readFileSync` and splits it on `;`, then executes every segment with `entityManager.query(stmt)`. The path is fixed at `process.cwd()`, but the SQL content is completely unvalidated. This function disables foreign key checks (`SET FOREIGN_KEY_CHECKS=0`) before running. If this file is ever replaced by an attacker with filesystem write access (e.g., a compromised build pipeline, a volume mount in Docker), it will execute arbitrary SQL as the database user — including `DROP TABLE`, `GRANT`, or data exfiltration.

More immediately: this job should never run in production against real data. The `RESEED_DB` env var gate exists, but there is no hard enforcement that prevents accidentally setting it in a non-demo environment.
**Fix:**
```typescript
// Add an explicit production guard:
if (env.isProduction && !env.var.RESEED_DB) {
  error('reseedDatabase: RESEED_DB is not set. Refusing to run in production.');
  return;
}
// Additionally validate the file path is inside the expected directory:
const sqlFilePath = path.resolve(process.cwd(), 'demodata/prod/sontoco.sql');
if (!sqlFilePath.startsWith(path.resolve(process.cwd(), 'demodata'))) {
  throw new Error('Invalid SQL file path');
}
```

---

### CR-05: `AuthenticateApplicant` middleware naming collision silently swallows errors

**File:** `src/server/middleware/appAuth.ts:79-81`
**Issue:** The catch block is:
```typescript
catch (error) {
  error(`Applicant auth middleware threw an error: ${error}`);
  return res.send({ noSession: true });
}
```
The parameter name `error` shadows the imported `error` log function. The log call invokes the caught error object as a function, which throws a `TypeError: error is not a function`. This exception is not caught, meaning: (a) errors in `AuthenticateApplicant` are never logged; and (b) in some Node.js/Express configurations this TypeError propagates as an unhandled promise rejection.
**Fix:**
```typescript
} catch (err) {
  error(`Applicant auth middleware threw an error: ${err}`);
  return res.send({ noSession: true });
}
```

---

### CR-06: `getConnection()` returns `null` and callers crash rather than returning an error

**File:** `src/server/lib/db.ts:93-100` (return value), and every controller/repository that calls it
**Issue:** `getConnection()` catches the TypeORM error and returns `null`. Every caller then immediately does `connection.getCustomRepository(...)` without a null check, producing an unhandled `TypeError: Cannot read properties of null`. In a financial system, a DB outage should return a 503, not crash the process.

Example of crash pattern at `src/server/controllers/accounts.controller.ts:27`:
```typescript
const connection = await getConnection();
const UsersRepo = connection.getCustomRepository(Users); // crashes if connection is null
```
**Fix:**
```typescript
// Option A: throw inside getConnection() instead of returning null
const getConnection = async () => {
  if (!connection) {
    connection = await createConnection(DBConfig as ConnectionOptions);
    // createConnection throws on failure; do not catch it here
  }
  return connection;
};

// Option B: add null checks at call sites
const connection = await getConnection();
if (!connection) { res.status(503); return { error: 'Service temporarily unavailable' }; }
```

---

### CR-07: Session cookie is not marked `secure` or `httpOnly`

**File:** `src/server/lib/db.ts:21-30`
**Issue:** The `sessionConfig` cookie object only sets `maxAge`. It does not set `secure: true` or `httpOnly: true`:
```typescript
cookie: {
  maxAge: 86400000, // 24HR
},
```
Without `httpOnly: true`, client-side JavaScript can read the session cookie, enabling cookie theft via XSS. Without `secure: true`, the cookie is sent over HTTP in addition to HTTPS, enabling session hijacking over plain HTTP connections (relevant during local development leaking into staging/prod configurations).
**Fix:**
```typescript
cookie: {
  maxAge: 86400000,
  httpOnly: true,
  secure: env.isProduction || env.isStaging,
  sameSite: 'lax',
},
```

---

### CR-08: `req.logout()` is missing before `req.session.regenerate()` in the applicant login path

**File:** `src/server/middleware/appAuth.ts:51-56`
**Issue:** The commented-out `// req.logout();` on line 51 is the bug. When an already-authenticated user (standard user or a different applicant) submits the application login form, `req.session.regenerate()` is called without first calling `req.logout()`. The Passport `user` object from the previous session can survive the regeneration in some configurations, allowing session confusion where a new login inherits the previous user's identity. The correct pattern (used in `server.ts` line 191-204 for the accounts login) is `req.logout() -> req.session.regenerate() -> req.login()`.
**Fix:**
```typescript
return req.logout((logoutErr) => {
  if (logoutErr) return next(logoutErr);
  return req.session.regenerate(() => req.login(app, (loginError) => {
    if (loginError) return next(loginError);
    return next();
  }));
});
```

---

### CR-09: Error messages from internal exceptions are returned verbatim to clients

**File:** Multiple controllers, e.g. `src/server/controllers/accounts.controller.ts:34`, `src/server/controllers/users.controller.ts:43`
**Issue:** Nearly every controller catch block does:
```typescript
} catch ({ message: err }) {
  error(err);
  res.status(400);
  return { error: `An error occurred while trying to load accounts: ${err}` };
}
```
The raw `err` string (which is the exception `.message`) is sent to the client. Internal exception messages can contain database column names, table names, TypeORM query fragments, stack paths, and business logic details. Example: if TypeORM throws `Table 'db.users' doesn't exist`, that exact string is forwarded to the browser.
**Fix:**
```typescript
} catch ({ message: err }) {
  error(err); // log the real message server-side only
  res.status(500);
  return { error: 'An internal error occurred. Please try again or contact support.' };
}
```
Callers that need discriminated errors (e.g., "account not found" vs. "unauthorized") should use typed result objects, not exception messages, for flow control.

---

## Warnings

### WR-01: `AUTH_ALLOW_MANAGER` not called in several financial write controllers

**File:** `src/server/controllers/requests.controller.ts:237-354` (postOperationRequest, recurOperationRequest, cancelOperationRequest)
**Issue:** The "post", "make recurring", and "cancel" operations are high-value financial actions. The repository helpers `handleRequestPost`, `makeRequestRecurring`, and `cancelRequest` do call `AUTH_ALLOW_MANAGER` internally, but the controllers do not enforce this at the controller layer. The `@UseBefore(AuthMiddleware)` on the class only verifies authentication (logged in), not authorization (role). If the repository authorization is ever refactored away or bypassed, there is no controller-level safety net. The controller for `postOperationRequest` has no authorization check at all before reaching the repository.
**Fix:** Add an explicit role check at the controller layer:
```typescript
const { authUser } = req.user;
if (![RoleName.admin, RoleName.director, RoleName.manager].includes(authUser.role)) {
  res.status(403);
  return { error: 'Unauthorized', success: false };
}
```

---

### WR-02: `AUTH_ALLOW_MANAGER_TO_EDIT_USER` does not check for `manager` role, only `admin` and `director`

**File:** `src/server/repositories/auth.repository.helper.ts:23-33`
**Issue:** `AUTH_ALLOW_MANAGER_TO_EDIT_USER` checks `[RoleId.admin, RoleId.director]` but not `RoleId.manager`. The function name implies managers can edit users, but only directors and admins pass the check. This means a `manager` role calling `editAccount` will always receive `UNAUTHORIZED` even if they are the account's assigned manager.

This is either a bug (managers should be allowed to edit their own accounts) or a misnaming (the function should be called `AUTH_ALLOW_DIRECTOR_TO_EDIT_USER`). Either way, the intent is not clear and the behavior does not match the name.
**Fix:** Clarify intent and either:
```typescript
// If managers should be allowed:
if (![RoleId.admin, RoleId.director, RoleId.manager].includes(managerUser.roleId)) {
  throw new Error('UNAUTHORIZED');
}
// Or rename the function to AUTH_ALLOW_DIRECTOR_TO_EDIT_USER
```

---

### WR-03: `cancelRequest` and `makeRequestRecurring` do not check `AUTH_ALLOW_MANAGER` explicitly

**File:** `src/server/repositories/requests.repository.ts:381-438`
**Issue:** `cancelRequest` and `makeRequestRecurring` both rely entirely on the authorization subquery (`AppendAccountAuthorizationFilterQuery`) to scope what requests are visible. If the authorization subquery is satisfied by delegation (a delegated user can see the request), those users can also cancel or make recurring what they can view. The higher-privilege operations (`handleRequestPost`, `handleRequestUpdate`) do call `AUTH_ALLOW_MANAGER` first. The inconsistency means delegation can confer write-cancellation rights to non-manager accounts.
**Fix:** Add `await AUTH_ALLOW_MANAGER(authUserId, this.manager)` at the top of both `cancelRequest` and `makeRequestRecurring`, matching the pattern used in `handleRequestPost`.

---

### WR-04: Application `save` endpoint merges user-controlled input with the stored application using spread

**File:** `src/server/controllers/applications.controller.ts:298`
**Issue:**
```typescript
const updatedApplication = classToClass<Application>({ ...savedApplication, ...userInput });
```
A `restrictedFields` array is deleted from `userInput` before the merge, which is a denylist approach. Any field added to the `Application` entity in the future that is not also added to `restrictedFields` will be writable by the applicant. Additionally, `classToClass` performs a deep clone but does not strip unknown properties — if `userInput` contains TypeORM relation properties (e.g., `manager`, `user`), they will survive into the update.

The comment on line 290 acknowledges this: `// TODO saving user input needs security review`.
**Fix:** Invert to an allowlist:
```typescript
const allowedFields: (keyof Application)[] = [
  'entityType', 'applicantContact', 'representativeContact',
  'taxCountry', 'investmentExperience', /* ... other fields the applicant owns */
];
const sanitizedInput = allowedFields.reduce((acc, key) => {
  if (userInput[key] !== undefined) acc[key] = userInput[key];
  return acc;
}, {} as Partial<Application>);
const updatedApplication = classToClass<Application>({ ...savedApplication, ...sanitizedInput });
```

---

### WR-05: `startPasswordReset` timing side-channel reveals whether an email is registered

**File:** `src/server/controllers/users.controller.ts:174-194`
**Issue:** The controller returns the same message string whether an account exists or not. However, the `startPasswordReset` repository method short-circuits early (`return {}`) when no account is found, and only proceeds to generate a hash, write to the DB, and send an email when the account exists. The response time difference (DB write + SMTP call vs. immediate return) is measurable and allows an attacker to enumerate valid email addresses.
**Fix:** Add a constant-time delay on the non-account path:
```typescript
// In users.repository.ts startPasswordReset:
if (!account) {
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 200)); // normalize timing
  return {};
}
```
Or use a background job for all reset emails so the HTTP response always returns at the same time.

---

### WR-06: CSRF protection is absent — no CSRF tokens on state-mutating POST endpoints

**File:** `src/server/server.ts` (middleware setup, lines 47-67)
**Issue:** No CSRF middleware (e.g., `csurf`) is installed. All POST endpoints that mutate financial state (create requests, post operations, cancel requests) are vulnerable to cross-site request forgery. An attacker who tricks an authenticated admin into visiting a malicious page can submit forged requests on their behalf. The `sameSite` cookie attribute is also not set (see CR-07), so the browser's built-in CSRF mitigation is not active.
**Fix:**
```typescript
import csrf from 'csurf';
expressApp.use(csrf({ cookie: false })); // use session-based token
// Add CSRF token to HTML responses; include it in all POST requests
```
For API-first designs, verifying the `Origin` or `Referer` header is a lighter-weight alternative.

---

### WR-07: `openAccount` in `UsersController` uses `encodeURI` where `encodeURIComponent` is needed

**File:** `src/server/controllers/users.controller.ts:133`
**Issue:**
```typescript
const encodedHash = encodeURI(hash);
const link = `...${endpoints.passwordReset}?resetKey=${encodedHash}`;
```
`encodeURI` does not encode `=`, `&`, `?`, `#`. If the SHA-256 hex hash happened to contain any of these characters (it cannot, but this pattern is brittle if the hash scheme changes), the resulting URL would be malformed. The sibling method `ApplicationsController.openAccount` on line 189 correctly uses `encodeURIComponent`. This inconsistency is a latent bug.
**Fix:**
```typescript
const encodedHash = encodeURIComponent(hash);
```

---

### WR-08: `ReceivingBanks.find()` silently drops the `id` filter when called with an ID

**File:** `src/server/repositories/receivingBank.repository.ts:9-16`
**Issue:**
```typescript
find(id? : number) {
  let query = this.createQueryBuilder('receivingBank');
  query = query.where('receivingBank.deleted=0');
  if (id) {
    query = query.where('receivingBank.id=:id', { id }); // .where() replaces the previous .where()
  }
  return query.getMany();
}
```
The second `.where()` call replaces the first, not appends to it. When `id` is provided, the `deleted=0` filter is dropped. A deleted receiving bank can be fetched by ID.
**Fix:**
```typescript
query = query.andWhere('receivingBank.id=:id', { id });
```

---

### WR-09: `operations.repository.ts` `setDeleted` returns `{ message: error }` on exception, not `{ error }`

**File:** `src/server/repositories/operations.repository.ts:105-107`
**Issue:**
```typescript
} catch (error) {
  return { message: error };
}
```
The return shape is `{ message: error }` where `error` is an `Error` object (not a string). Callers destructure `{ message, operations }` from the result, so `message` will be an `Error` object, not a string. When logged or returned to the client it will serialize as `[object Object]`. The consistent return shape for errors in this codebase is `{ error }` or `{ message: error.message }`.
**Fix:**
```typescript
} catch (e) {
  return { message: typeof e === 'string' ? e : (e as Error).message };
}
```

---

### WR-10: `deserializeApplication` re-authenticates from plaintext PIN stored in session on every request

**File:** `src/server/server.ts:111-115` and `src/server/middleware/appAuth.ts:59-64`
**Issue:** Every applicant-authenticated request triggers `deserializeApplication(authEmail, appPIN)` which calls `appRepo.findOneOrNull({ authEmail, appPIN })` — a full DB lookup using the PIN. This means the plaintext PIN must live in the session store permanently (not just during login). See also CR-02. This compounds the PIN exposure: even if authentication is fixed, the plaintext PIN must be removed from the session data.
**Fix:** After fixing CR-02 (hashing PINs), sessions should store the application UUID or numeric ID, not the PIN. `deserializeApplication` should look up by UUID/ID only:
```typescript
export async function deserializeApplication(appId: number) {
  if (!appId) return null;
  const connection = await getConnection();
  const appRepo = connection.getCustomRepository(Applications);
  return appRepo.findOneById(appId);
}
```

---

### WR-11: `request.jobs.ts` uses a hardcoded `authUserId` of 490

**File:** `src/server/jobs/request.jobs.ts:77`
**Issue:**
```typescript
const watchNewRequests = new CronJob(cronJobSchedule, () => processPendingRequests(490, entityManager));
```
The `processPendingRequests` function accepts an `authUserId` that is passed to `requestsRepo.find({ authUserId, ... })`. This hardcodes a specific user account (ID 490) as the authorization identity for the background job. If that account is deleted, deactivated, or its role changes, the job will silently fail to find any requests (because `AppendAccountAuthorizationFilterQuery` would return nothing for a non-existent user). The job should use an elevated admin query, or the system should have a dedicated service account.
**Fix:** Use a dedicated admin lookup or bypass the authorization filter for system-initiated background jobs:
```typescript
// Use a known admin ID from env var, with a fallback validation
const jobAuthUserId = parseInt(env.var.JOB_AUTH_USER_ID, 10);
if (!jobAuthUserId) {
  error('Cannot run watchNewRequests: JOB_AUTH_USER_ID not configured');
  return;
}
```

---

### WR-12: `AnonymousMiddleware` calls `passport.authenticate('anonymous')` without registering the strategy

**File:** `src/server/middleware/anon.ts:16-22`
**Issue:** `passport.authenticate('anonymous')` is called but the `anonymous` strategy is never registered with `passport.use('anonymous', ...)` in `server.ts`. This call returns a middleware function but does not execute it (the result is not invoked). The `AnonymousMiddleware` effectively does nothing in both branches — it calls `req.logout()` for authenticated users then falls through, but never actually establishes an anonymous identity. This is dead/broken code.
**Fix:** Either remove `AnonymousMiddleware` entirely if it is unused, or register the `passport-anonymous` strategy and invoke the returned middleware:
```typescript
import AnonymousStrategy from 'passport-anonymous';
passport.use('anonymous', new AnonymousStrategy());

// In AnonymousMiddleware.use():
return passport.authenticate('anonymous', { session: false })(req, res, next);
```

---

### WR-13: `fetch.api.ts` client-side fetcher passes POST credentials without `credentials: 'same-origin'`

**File:** `src/shared/api/fetch.api.ts:13-16`
**Issue:** GET requests include `{ credentials: 'same-origin' }` (line 16), but POST requests created via `createRequest` do not include a `credentials` field. Depending on the browser default (which changed in some versions), POST requests may not send the session cookie, causing unexpected 401/redirect responses for POST endpoints.
**Fix:**
```typescript
const createRequest = function post<T>(postData: T) {
  return {
    method: 'POST',
    credentials: 'same-origin' as RequestCredentials,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  };
};
```

---

### WR-14: `statements.repository.ts` `generate()` silently skips statement saves inside the loop but bulk-saves at the end, losing error context

**File:** `src/server/repositories/statements.repository.ts:100-175`
**Issue:** Inside the month loop (line 100), each generated statement is pushed to `previousStatements` (line 169) and the callback `onEachStatement` is fired (line 170), but the statement is not yet persisted. Only after the entire loop completes is `this.createQueryBuilder('s').insert().values(previousStatements).execute()` called (line 175). If any single statement fails to insert (e.g., a unique constraint violation), the entire batch may silently fail or only partially insert, while the caller has already received `PopulatedStatement` events for all statements. The `onEachStatementError` callback fires for in-loop calculation errors, but not for the bulk insert failure.
**Fix:** Persist each statement individually within the loop (accepting the slower performance), or wrap the bulk insert in a transaction and propagate errors:
```typescript
try {
  await this.createQueryBuilder('s').insert().values(previousStatements).execute();
} catch (insertError) {
  if (onEachStatementError) onEachStatementError(`Bulk insert failed: ${insertError.message}`);
}
```

---

## Info

### IN-01: `findByEmailAndHashedPassword` has inconsistent column alias usage

**File:** `src/server/repositories/users.repository.ts:100-115`
**Issue:** The query uses `user.password` (the column alias `password` as defined in the entity) to match hashed passwords, but the column is mapped to `hashedPassword` in the entity. TypeORM translates the property name, so this works, but mixing column names and property names in query builder conditions is fragile and confusing. The `user.otpSecret1` references on line 103 and `user.otpRequired` on line 66 are property names. Consistent use of property names throughout is preferred.

---

### IN-02: `userOTPEnabled` runs a second DB query when the OTP check could be folded into `findByEmailAndHashedPassword`

**File:** `src/server/middleware/auth.ts:23-36` and `src/server/repositories/users.repository.ts:217-228`
**Issue:** `checkUserEmailAndPass` first calls `usersRepo.userOTPEnabled(email)` (one query), then calls `usersRepo.findByEmailAndHashedPassword(email, hashedPassword)` (second query). The OTP secret is already selectable in the second query (and is, via `.addSelect('user.otpSecret1')`). The first query exists only to determine which salt to use, but this doubles the login query count for every login attempt.

---

### IN-03: `getHtml` template in server.ts has no CSP header

**File:** `src/server/server.ts:128-147`
**Issue:** The `getHtml` function generates HTML served for development hot-reload. It sets no Content Security Policy meta tag or header. While this is development-only, the same server can be used in staging, and no CSP header is set for production-served HTML pages either. A CSP would significantly reduce XSS impact.

---

### IN-04: `log.ts` uses `http` level for the `info` function

**File:** `src/server/lib/log.ts:41-44`
**Issue:** `export const info = (message: string) => log.log({ level: 'http', message })`. Winston's `http` level sits between `verbose` and `warn`. Using `http` for general info messages means info-level messages are filtered out if log level is set to `info` or above, since `http` is lower priority than `info` in Winston's default ordering. This causes missing log output in some configurations.
**Fix:**
```typescript
export const info = (message: string) => !env.isTest && log.log({ level: 'info', message });
```

---

### IN-05: Commented-out code throughout the codebase

**Files:** `src/server/repositories/users.repository.ts:76-77`, `src/server/repositories/statements.repository.ts:116-123`, `src/server/repositories/requests.repository.ts:208-209`, `src/server/controllers/applications.controller.ts:193`
**Issue:** Multiple files contain large blocks of commented-out code (alternative queries, debug prints, previous implementations). This makes the code harder to read and understand. Some contain debug `console.log` calls that are commented out.
**Fix:** Remove all commented-out code. If old implementations need to be preserved for reference, use git history.

---

### IN-06: Magic number `490` and magic array `[294, 443, 72, 762, 802]` in production code

**File:** `src/server/jobs/request.jobs.ts:77`, `src/server/repositories/users.repository.ts:112`
**Issue:** Numeric user IDs are hard-coded in production logic with no explanation of who these users are. These will silently break if the database is reseeded with different IDs (which the seed job in `seed.jobs.ts` does).
**Fix:** Move to named constants with comments, or to environment variables.

---

### IN-07: `ApplicationsController.list` returns the raw `appPIN` to the admin

**File:** `src/server/controllers/applications.controller.ts:119-123`
**Issue:** The `list` endpoint response includes `appPIN` in the application summary objects returned to the admin UI:
```typescript
const applications = apps.map(({
  id, uuid, fmId, authEmail, appPIN, Started, ...
}) => ({ id, uuid, fmId, authEmail, appPIN, ... }));
```
Even if an admin legitimately needs to view the PIN to share it with an applicant, returning all PINs for all applications in a list response is an overshare. If this page is ever cached or logged, all PINs are exposed. After fixing CR-02, only the plain PIN should be displayed immediately after creation; the stored value should be the hash.

---

### IN-08: `sleep()` in `statements.sockets.ts` to avoid SMTP throttling is fragile

**File:** `src/server/sockets/statements.sockets.ts:90`
**Issue:** `await sleep(3000)` is used to stay under Office365's 30-msg/min limit. This blocks the socket handler for the duration of the email batch (e.g., 100 accounts * 3 seconds = 5 minutes). The comment states the minimum is 2000ms but 3000ms is used. This is not resilient to SMTP throttle errors (which would still occur if the sleep is slightly off), and it ties up the socket connection for the entire batch operation.
**Fix:** Use a proper rate-limited queue (e.g., `bottleneck` npm package) rather than a fixed sleep.

---

### IN-09: `fetch.api.ts` does not set a request timeout

**File:** `src/shared/api/fetch.api.ts:13-37`
**Issue:** All client-side fetches go through `fetchRoute` with no timeout configured. A slow or hung server response will leave the browser in a loading state indefinitely. On the server side, no request timeout middleware (e.g., `connect-timeout`) is installed.
**Fix:**
```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);
const res = await fetch(endpoint, { ...options, signal: controller.signal });
clearTimeout(timeoutId);
```

---

_Reviewed: 2026-04-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
