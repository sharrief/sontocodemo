---
phase: quick-260418-gmh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - package.json
  - package-lock.json
  - src/server/lib/db.ts
  - src/server/server.ts
  - src/server/repositories/users.repository.ts
  - src/server/repositories/application.repository.ts
  - src/server/middleware/auth.ts
  - src/server/middleware/appAuth.ts
autonomous: true
requirements:
  - CR-01
  - CR-02
  - CR-03
  - CR-07

must_haves:
  truths:
    - "User passwords are hashed with bcrypt (salt rounds=12) before storage and verified with bcrypt.compare"
    - "Existing SHA-256 hashed users are migrated transparently on next successful login (detect by hash prefix, verify with SHA-256+salt, re-hash with bcrypt on success)"
    - "Applicant PINs are hashed with bcrypt before storage and verified with bcrypt.compare; raw PIN never stored"
    - "Application sessions serialize uuid (not authEmail+appPIN); deserialize fetches by uuid"
    - "The hardcoded user ID list [294,443,72,762,802] is removed from findByEmailAndHashedPassword"
    - "Session cookie has httpOnly=true, secure=true in production, sameSite='strict'"
    - "Express trust proxy is set to 1 before session middleware"
  artifacts:
    - path: "src/server/repositories/users.repository.ts"
      provides: "findByEmailForAuth (email-only fetch), rehashUserPassword, bcrypt password ops"
    - path: "src/server/repositories/application.repository.ts"
      provides: "findByEmail, findByUuid, createApplication hashes PIN with bcrypt"
    - path: "src/server/middleware/auth.ts"
      provides: "dual-hash login: bcrypt compare + SHA-256 migration path + rehash"
    - path: "src/server/middleware/appAuth.ts"
      provides: "deserializeApplication(uuid), checkApplicantAuthEmailAndAppPIN uses bcrypt.compare"
    - path: "src/server/lib/db.ts"
      provides: "sessionConfig cookie with httpOnly, secure, sameSite flags"
    - path: "src/server/server.ts"
      provides: "trust proxy=1 before session middleware; serializeUser stores uuid for applications"
  key_links:
    - from: "src/server/middleware/auth.ts::checkUserEmailAndPass"
      to: "src/server/repositories/users.repository.ts::findByEmailForAuth"
      via: "returns user row with password hash for app-level comparison"
    - from: "src/server/server.ts::serializeUser"
      to: "src/server/middleware/appAuth.ts::deserializeApplication"
      via: "stores uuid in session; deserialize fetches by uuid only"
    - from: "src/server/repositories/application.repository.ts::createApplication"
      to: "bcrypt.hash"
      via: "PIN hashed before INSERT; raw PIN returned to caller for email/display"
---

<objective>
Fix four security issues identified in the codebase review: remove a login backdoor (CR-03), add session cookie security flags (CR-07), replace SHA-256 password hashing with bcrypt including a transparent migration path for existing users (CR-01), and hash applicant PINs with bcrypt while fixing the session serialization to store uuid instead of plaintext credentials (CR-02).

Purpose: Harden the authentication surface of a financial account management platform that is being exposed publicly via Cloudflare Tunnel.
Output: bcrypt-based password and PIN hashing, secure session cookies, no hardcoded user ID bypass.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/codebase/REVIEW.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install bcryptjs, fix CR-03 (backdoor), fix CR-07 (cookie flags + trust proxy)</name>
  <files>
    package.json
    src/server/lib/db.ts
    src/server/server.ts
    src/server/repositories/users.repository.ts
  </files>
  <action>
**Step 1 — Install bcryptjs (pure JS, no native compilation required):**

```bash
cd /home/sharrief/repos/sontocodemo
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

**Step 2 — Fix CR-03: Remove hardcoded user ID backdoor from `findByEmailAndHashedPassword` in `src/server/repositories/users.repository.ts`.**

The current Brackets block at lines 108-113 is:
```typescript
.andWhere(new Brackets((expression) => {
  expression
    .andWhere('user.role_id IN (:allowedRoles)', { allowedRoles: [RoleId.admin, RoleId.manager, RoleId.director, RoleId.seniorTrader] })
    .orWhere('user.id IN (:userIds)', { userIds: [294, 443, 72, 762, 802] })
    .orWhere('user.hasAccountsAccess = 1');
}));
```

Remove the `.orWhere('user.id IN (:userIds)', ...)` line entirely. Result:
```typescript
.andWhere(new Brackets((expression) => {
  expression
    .andWhere('user.role_id IN (:allowedRoles)', { allowedRoles: [RoleId.admin, RoleId.manager, RoleId.director, RoleId.seniorTrader] })
    .orWhere('user.hasAccountsAccess = 1');
}));
```

**Step 3 — Fix CR-07 in `src/server/lib/db.ts`: add httpOnly, secure, sameSite to sessionConfig cookie.**

Current:
```typescript
cookie: {
  maxAge: 86400000, // 24HR
},
```

Replace with:
```typescript
cookie: {
  maxAge: 86400000, // 24HR
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
},
```

**Step 4 — Fix CR-07 in `src/server/server.ts`: add `expressApp.set('trust proxy', 1)` immediately after `const expressApp = express();` (line 47) and before any middleware.**

Add this line after `const expressApp = express();`:
```typescript
expressApp.set('trust proxy', 1); // Required: app runs behind Cloudflare Tunnel
```

This must appear before `expressApp.use(sessionMiddleware)` to ensure `secure` cookies are set correctly when the `X-Forwarded-Proto: https` header is present from Cloudflare.
  </action>
  <verify>
    <automated>
      cd /home/sharrief/repos/sontocodemo && node -e "require('./node_modules/bcryptjs')" && echo "bcryptjs OK" &&
      grep -n "trust proxy" src/server/server.ts &&
      grep -n "httpOnly" src/server/lib/db.ts &&
      grep -n "sameSite" src/server/lib/db.ts &&
      grep -n "secure" src/server/lib/db.ts &&
      ! grep -n "userIds.*294" src/server/repositories/users.repository.ts && echo "Backdoor removed OK"
    </automated>
  </verify>
  <done>
    bcryptjs installed; `trust proxy` set in server.ts; sessionConfig cookie has httpOnly=true, secure=production-only, sameSite='strict'; hardcoded userIds list removed from users.repository.ts.
  </done>
</task>

<task type="auto">
  <name>Task 2: CR-01 — Replace SHA-256 with bcrypt for user passwords (with migration path)</name>
  <files>
    src/server/repositories/users.repository.ts
    src/server/middleware/auth.ts
  </files>
  <action>
This task modifies `users.repository.ts` to support bcrypt and updates `auth.ts` to use dual-hash verification with transparent migration. The SHA-256 salts (DB_PASSWORD_SALT, DB_PASSWORD_2FA_SALT) remain in env.ts for the migration path — do NOT remove them.

**Changes to `src/server/repositories/users.repository.ts`:**

1. Add import at top:
```typescript
import bcrypt from 'bcryptjs';
```

2. Add a new method `findByEmailForAuth` that fetches the user by email only (does NOT filter on password hash). This is used by `auth.ts` to retrieve the stored hash for app-level comparison:
```typescript
async findByEmailForAuth(email: User['email']) {
  if (!email) return undefined;
  return this.createQueryBuilder('user')
    .addSelect('user.otpSecret1')
    .addSelect('user.hashedPassword')
    .where('user.email = :email', { email })
    .andWhere('user.deleted = 0')
    .andWhere('user.status = :userStatusActive', { userStatusActive: UserAccountStatus.active })
    .andWhere(new Brackets((expression) => {
      expression
        .andWhere('user.role_id IN (:allowedRoles)', { allowedRoles: [RoleId.admin, RoleId.manager, RoleId.director, RoleId.seniorTrader] })
        .orWhere('user.hasAccountsAccess = 1');
    }))
    .getOne();
}
```

3. Add a method `rehashUserPassword` for the migration path — called after a successful SHA-256 login to upgrade the stored hash to bcrypt:
```typescript
async rehashUserPassword(id: User['id'], plainPassword: string): Promise<void> {
  const newHash = await bcrypt.hash(plainPassword, 12);
  await this.manager.createQueryBuilder(User, 'User').update({
    hashedPassword: newHash,
  }).whereInIds([id]).execute();
}
```

4. Update `doPasswordReset` to use bcrypt. Replace the SHA-256 section:
```typescript
// OLD:
let salt = env.var.DB_PASSWORD_SALT;
if (user.otpSecret1) { salt = env.var.DB_PASSWORD_2FA_SALT; }
const newHashedPassword = crypto.createHash('sha256')
  .update(newPassword + salt, 'utf-8').digest('hex');
```
With:
```typescript
const newHashedPassword = await bcrypt.hash(newPassword, 12);
```

5. Update `validateTempOPTSecret` to use bcrypt for the password verification step. The method currently calls `findByEmailAndHashedPassword` with a SHA-256 hash. Change it to call `findByEmailForAuth` and then bcrypt.compare:
```typescript
// OLD:
const salt = env.var.DB_PASSWORD_SALT;
const hashedPassword = crypto.createHash('sha256')
  .update(password + salt, 'utf8').digest('hex');
const validUser = await this.findByEmailAndHashedPassword(user.email, hashedPassword);
if (!validUser) throw new Error('Double check you entered the correct password');
```
Replace with:
```typescript
const userForAuth = await this.findByEmailForAuth(user.email);
if (!userForAuth) throw new Error('Double check you entered the correct password');
const storedHash = userForAuth.hashedPassword;
let validPassword = false;
if (storedHash && storedHash.startsWith('$2b$')) {
  validPassword = await bcrypt.compare(password, storedHash);
} else {
  // Legacy SHA-256 migration path
  const sha256Hash = crypto.createHash('sha256').update(password + env.var.DB_PASSWORD_SALT, 'utf8').digest('hex');
  validPassword = storedHash === sha256Hash;
}
if (!validPassword) throw new Error('Double check you entered the correct password');
```

After the OTP is confirmed valid, store the new bcrypt-hashed password for OTP users. In the `if (isValid)` block, update how the new hash is generated:
```typescript
// OLD:
const otpSalt = env.var.DB_PASSWORD_2FA_SALT;
const otpHashedPassword = crypto.createHash('sha256')
  .update(password + otpSalt, 'utf8').digest('hex');
if (isValid) {
  await this.manager.createQueryBuilder(User, 'User').update({
    hashedPassword: otpHashedPassword,
    ...
```
Replace with:
```typescript
const bcryptHashedPassword = await bcrypt.hash(password, 12);
if (isValid) {
  await this.manager.createQueryBuilder(User, 'User').update({
    hashedPassword: bcryptHashedPassword,
    ...
```

6. Update `disableOTPRequirements` similarly — both password operations should use bcrypt. Replace the two SHA-256 blocks:
```typescript
// OTP verification (first check):
const otpSalt = env.var.DB_PASSWORD_2FA_SALT;
const otpHashedPassword = crypto.createHash('sha256').update(password + otpSalt, 'utf8').digest('hex');
const validUser = await this.findByEmailAndHashedPassword(user.email, otpHashedPassword);
if (!validUser) throw new Error('Double check you entered the correct password');

// New hash to store:
const salt = env.var.DB_PASSWORD_SALT;
const hashedPassword = crypto.createHash('sha256').update(password + salt, 'utf8').digest('hex');
```
Replace with:
```typescript
const userForAuth = await this.findByEmailForAuth(user.email);
if (!userForAuth) throw new Error('Double check you entered the correct password');
const storedHash = userForAuth.hashedPassword;
let validPassword = false;
if (storedHash && storedHash.startsWith('$2b$')) {
  validPassword = await bcrypt.compare(password, storedHash);
} else {
  const sha256OTPHash = crypto.createHash('sha256').update(password + env.var.DB_PASSWORD_2FA_SALT, 'utf8').digest('hex');
  const sha256RegHash = crypto.createHash('sha256').update(password + env.var.DB_PASSWORD_SALT, 'utf8').digest('hex');
  validPassword = storedHash === sha256OTPHash || storedHash === sha256RegHash;
}
if (!validPassword) throw new Error('Double check you entered the correct password');

const hashedPassword = await bcrypt.hash(password, 12);
```

**Changes to `src/server/middleware/auth.ts`:**

Replace `checkUserEmailAndPass` entirely with a version that:
- Fetches the user by email only via `findByEmailForAuth`
- Detects hash type by prefix (`$2b$` = bcrypt, else = legacy SHA-256)
- On SHA-256 match: calls `rehashUserPassword` to upgrade
- Returns the user object and otpRequired flag

```typescript
async function checkUserEmailAndPass(email: string, password: string) {
  try {
    const connection = await getConnection();
    if (!connection) throw new Error(`Unable to establish the connection to the database while authenticating ${email}.`);
    const usersRepo = connection.getCustomRepository(Users);

    const user = await usersRepo.findByEmailForAuth(email);
    if (!user) return { user: null };

    const storedHash = user.hashedPassword;
    let isValid = false;

    if (storedHash && storedHash.startsWith('$2b$')) {
      // bcrypt path
      isValid = await bcrypt.compare(password, storedHash);
    } else if (storedHash && storedHash.length === 64) {
      // Legacy SHA-256 migration path — try both salts (OTP users use 2FA salt)
      const salt = user.otpSecret1 ? env.var.DB_PASSWORD_2FA_SALT : env.var.DB_PASSWORD_SALT;
      const sha256Hash = crypto.createHash('sha256').update(password + salt, 'utf8').digest('hex');
      isValid = storedHash === sha256Hash;
      if (isValid) {
        // Transparently upgrade to bcrypt on successful login
        try {
          await usersRepo.rehashUserPassword(user.id, password);
        } catch (rehashErr) {
          // Non-fatal: log but continue — user is authenticated
          serverError(`Failed to rehash password for user ${user.id}: ${rehashErr}`);
        }
      }
    }

    if (!isValid) return { user: null };

    return { user, otpRequired: !!user.otpSecret1 };
  } catch (error) {
    return { error };
  }
}
```

Add the bcrypt import at the top of `auth.ts`:
```typescript
import bcrypt from 'bcryptjs';
```

Update `authenticateUser` to use the new return shape (no longer `{ user, otpRequired }` as a nested object — `otpRequired` is returned alongside `user`):
```typescript
const { error, user, otpRequired } = await checkUserEmailAndPass(email, password);
if (error) throw new Error(error);
if (user) {
  if (otpRequired) {
    if (!otp) return done('', false, { message: loginLabels.otpRequired, otpRequired });
    const otpValid = authenticator.verify({
      token: otp, secret: user.otpSecret1,
    });
    if (!otpValid) return done('', false, { message: loginLabels.authFail });
    delete user.otpSecret1;
  }
  await updateUserLastAccess(user.id);
  return done('', { type: 'user', authUser: user }, { message: loginLabels.authSuccess });
}
return done('', false, { message: loginLabels.authFail });
```

Note: the old `checkUserEmailAndPass` called `usersRepo.userOTPEnabled(email)` first to select the salt. The new version detects this from the stored hash prefix and `user.otpSecret1`. This eliminates the double-query pattern (IN-02 from the review) as a side benefit.
  </action>
  <verify>
    <automated>
      cd /home/sharrief/repos/sontocodemo &&
      grep -n "bcrypt" src/server/middleware/auth.ts &&
      grep -n "findByEmailForAuth" src/server/repositories/users.repository.ts &&
      grep -n "rehashUserPassword" src/server/repositories/users.repository.ts &&
      grep -n "bcrypt.hash" src/server/repositories/users.repository.ts &&
      ! grep -n "createHash.*sha256" src/server/repositories/users.repository.ts | grep "doPasswordReset" &&
      npx tsc --noEmit --project tsconfig.server.json 2>&1 | head -30
    </automated>
  </verify>
  <done>
    findByEmailForAuth and rehashUserPassword exist in users.repository.ts; doPasswordReset uses bcrypt.hash; auth.ts uses bcrypt.compare with SHA-256 fallback + rehash; TypeScript compiles without errors.
  </done>
</task>

<task type="auto">
  <name>Task 3: CR-02 — Hash applicant PINs with bcrypt; store uuid in session instead of plaintext PIN</name>
  <files>
    src/server/repositories/application.repository.ts
    src/server/middleware/appAuth.ts
    src/server/server.ts
  </files>
  <action>
**Changes to `src/server/repositories/application.repository.ts`:**

1. Add import at top:
```typescript
import bcrypt from 'bcryptjs';
```

2. Add `findByEmail` method (fetch application by email only, for auth verification):
```typescript
async findByEmail(authEmail: Application['authEmail']): Promise<Application | null> {
  try {
    if (!authEmail) return null;
    const app = await this.createQueryBuilder(this.alias)
      .where(`${this.alias}.authEmail = :authEmail`, { authEmail })
      .andWhere(`${this.alias}.deleted = 0`)
      .getOne();
    return app || null;
  } catch (e) {
    error(`Error in application.repository.ts->Applications->findByEmail: ${e}`);
    throw e;
  }
}
```

3. Add `findByUuid` method (fetch application by uuid for session deserialization):
```typescript
async findByUuid(uuid: Application['uuid']): Promise<Application | null> {
  try {
    if (!uuid) return null;
    const app = await this.createQueryBuilder(this.alias)
      .where(`${this.alias}.uuid = :uuid`, { uuid })
      .andWhere(`${this.alias}.deleted = 0`)
      .getOne();
    return app || null;
  } catch (e) {
    error(`Error in application.repository.ts->Applications->findByUuid: ${e}`);
    throw e;
  }
}
```

4. In `createApplication`: hash the PIN before storing it. After the PIN uniqueness loop generates a plain `appPIN`, hash it before putting it in `newAppSubmission`, but keep the raw PIN available to return to the caller (so it can be emailed/displayed to the applicant once — it will never be recoverable after this point).

Change the `newAppSubmission` block:
```typescript
// Hash PIN for storage (raw PIN is returned to caller for email/display)
const hashedPIN = await bcrypt.hash(appPIN, 12);
const newAppSubmission = {
  ...DefaultApplication,
  uuid,
  appPIN: hashedPIN,   // store hash, not raw PIN
  manager,
  authEmail,
  managerEmail: manager.email,
  managerName: manager.username,
  dateCreated: Date.now(),
};
```

The method's return value `app` will contain `appPIN` as the bcrypt hash. Callers that need to display/email the plain PIN to the applicant must save the raw `appPIN` value before this point. Check `src/server/controllers/applications.controller.ts` for any callers of `createApplication` — if the controller returns `appPIN` to the admin UI (IN-07 from review), it will now return the hash. This is acceptable behavior; after fix the PIN is single-use-display at creation time only. The controller can be updated separately (IN-07 is a separate task).

5. In `saveApplication`: currently looks up by `authEmail + appPIN`. Change to look up by `authEmail` only using `findByEmail`, then update by ID. This avoids passing the raw PIN to lookup after it is hashed:
```typescript
async saveApplication(uuid: Application['uuid'], updatedApplication: Partial<Application>) {
  try {
    const app = await this.findByUuid(uuid);
    if (!app?.id) {
      throw new Error('The application was not found.');
    }
    const updates = { ...updatedApplication };
    delete updates.id;
    await this.manager.createQueryBuilder(Application, 'Application').update({ ...updates }).whereInIds([app.id]).execute();
    const application = await this.findByUuid(uuid);
    return { application };
  } catch (e) {
    error(`Error in application.repository.ts->Applications->saveApplication: ${e}`);
    throw e;
  }
}
```

Note: `saveApplication` signature change (removes `authEmail` and `appPIN` parameters, adds `uuid`). Check callers — `src/server/controllers/applications.controller.ts` calls `saveApplication`. Update that call site to pass `uuid` instead of `authEmail, appPIN`. The application uuid is available in the session (`req.user.application.uuid`) in the controller context.

**Changes to `src/server/middleware/appAuth.ts`:**

1. Add bcrypt import:
```typescript
import bcrypt from 'bcryptjs';
```

2. Replace `checkApplicantAuthEmailAndAppPIN` to use `findByEmail` and bcrypt.compare:
```typescript
async function checkApplicantAuthEmailAndAppPIN(authEmail: string, appPIN: string) {
  try {
    const connection = await getConnection();
    const appRepo = connection.getCustomRepository(Applications);
    const application = await appRepo.findByEmail(authEmail);
    if (!application) return { application: null };
    const isValid = await bcrypt.compare(appPIN, application.appPIN);
    if (!isValid) return { application: null };
    return { application };
  } catch (error) {
    return { error };
  }
}
```

3. Replace `deserializeApplication` to take `uuid` instead of `authEmail + appPIN`:
```typescript
export async function deserializeApplication(uuid: string) {
  if (!uuid) { return null; }
  const connection = await getConnection();
  const appRepo = connection.getCustomRepository(Applications);
  const app = await appRepo.findByUuid(uuid);
  return app;
}
```

**Changes to `src/server/server.ts`:**

1. In `passport.serializeUser`, change the application branch to store `uuid` instead of `authEmail + appPIN`:
```typescript
passport.serializeUser(async ({ type, ...rest }, done) => {
  if (type === 'user' && rest.authUser) {
    const { authUser } = rest;
    done(null, { type, id: authUser.id });
  }
  if (type === 'application' && rest.application) {
    const { application: { uuid } } = rest;
    done(null, { type, uuid });
  }
});
```

2. In `passport.deserializeUser`, change the application branch to call `deserializeApplication(uuid)`:
```typescript
if (serializedData.type === 'application') {
  const { uuid } = serializedData;
  const app = await deserializeApplication(uuid);
  return done(null, { application: app });
}
```

Also update the TypeScript type annotation on the `serializedData` parameter — add `uuid?: string` and remove `authEmail` and `appPIN` from the inline type (or just use `any` for the serialized shape if the inline type is causing friction; the important thing is the runtime behavior):
```typescript
passport.deserializeUser(async (serializedData: { type: string; id?: number; uuid?: string }, done) => {
```

**Also update the caller of `saveApplication` in `src/server/controllers/applications.controller.ts`:**

Find the call to `appRepo.saveApplication(authEmail, appPIN, updatedApplication)` (or similar). Change it to pass `uuid`:
```typescript
// Get uuid from the authenticated session
const uuid = req.user?.application?.uuid;
if (!uuid) { res.status(401); return { error: 'Not authenticated' }; }
const { application } = await appRepo.saveApplication(uuid, updatedApplication);
```

Note: existing applicant sessions will be invalidated by this change because the session cookie contains `authEmail + appPIN` in the old format. Users will be logged out and must re-authenticate. This is acceptable — it is documented behavior when fixing a security issue.
  </action>
  <verify>
    <automated>
      cd /home/sharrief/repos/sontocodemo &&
      grep -n "findByUuid\|findByEmail" src/server/repositories/application.repository.ts &&
      grep -n "bcrypt.compare" src/server/middleware/appAuth.ts &&
      grep -n "deserializeApplication(uuid)" src/server/server.ts &&
      grep -qv "authEmail.*appPIN" src/server/server.ts && echo "No authEmail+appPIN in serialize OK" || true &&
      grep -n "type.*uuid" src/server/server.ts &&
      npx tsc --noEmit --project tsconfig.server.json 2>&1 | head -30
    </automated>
  </verify>
  <done>
    findByEmail and findByUuid exist in application.repository.ts; createApplication hashes PIN with bcrypt; saveApplication takes uuid; deserializeApplication(uuid) in appAuth.ts; serializeUser stores uuid for applications; deserializeUser calls deserializeApplication(uuid); TypeScript compiles without errors.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→POST /login | Untrusted email+password enters checkUserEmailAndPass |
| client→POST /application/login | Untrusted authEmail+appPIN enters checkApplicantAuthEmailAndAppPIN |
| session store→deserializeUser | Session cookie content used to reconstruct identity on every request |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-gmh-01 | Spoofing | users.repository.ts::findByEmailAndHashedPassword | mitigate | CR-03: remove hardcoded user ID bypass; only role_id and hasAccountsAccess gate login |
| T-gmh-02 | Information Disclosure | session cookie | mitigate | CR-07: httpOnly prevents JS access; secure prevents HTTP transmission; sameSite=strict blocks CSRF cookie leakage |
| T-gmh-03 | Spoofing | password verification (SHA-256 static salt) | mitigate | CR-01: bcrypt with salt rounds=12; transparent migration on next login for legacy users |
| T-gmh-04 | Information Disclosure | session store stores plaintext appPIN | mitigate | CR-02: session stores uuid only; PIN never leaves authentication boundary after initial creation |
| T-gmh-05 | Spoofing | appPIN stored plaintext in DB | mitigate | CR-02: bcrypt.hash(appPIN, 12) before INSERT in createApplication |
| T-gmh-06 | Elevation of Privilege | trust proxy not set; secure cookie not sent through Cloudflare | mitigate | CR-07: expressApp.set('trust proxy', 1) ensures X-Forwarded-Proto respected; secure flag activates correctly |
</threat_model>

<verification>
After all three tasks complete:

1. TypeScript compiles: `npx tsc --noEmit --project tsconfig.server.json` exits 0 with no errors
2. No hardcoded user IDs in users.repository.ts: `grep "294\|443.*72\|762\|802" src/server/repositories/users.repository.ts` returns nothing
3. bcrypt in use: `grep -r "bcrypt" src/server/middleware/auth.ts src/server/middleware/appAuth.ts src/server/repositories/` shows imports and calls in all three files
4. Session cookie flags present: `grep "httpOnly\|sameSite\|secure" src/server/lib/db.ts` shows all three
5. Trust proxy set: `grep "trust proxy" src/server/server.ts` shows the line
6. UUID in session: `grep "uuid" src/server/server.ts` shows both serializeUser and deserializeUser using uuid for applications
7. No plaintext PIN in session serialization: `grep "appPIN" src/server/server.ts` returns nothing (or only in a comment)
</verification>

<success_criteria>
- CR-03: `findByEmailAndHashedPassword` has no `.orWhere('user.id IN ...')` clause
- CR-07: sessionConfig.cookie has httpOnly=true, secure=production-only, sameSite='strict'; expressApp.set('trust proxy', 1) appears before session middleware
- CR-01: auth.ts uses bcrypt.compare for $2b$ hashes and SHA-256 fallback for 64-char hex hashes, calling rehashUserPassword on successful legacy login; doPasswordReset and validateTempOPTSecret use bcrypt.hash
- CR-02: createApplication hashes PIN with bcrypt before INSERT; serializeUser stores uuid; deserializeApplication takes uuid parameter; checkApplicantAuthEmailAndAppPIN uses bcrypt.compare against stored hash
- TypeScript compiler reports zero errors
</success_criteria>

<output>
After completion, create `.planning/quick/260418-gmh-fix-security-issues-cr-01-cr-02-cr-03-cr/260418-gmh-SUMMARY.md` using the summary template.
</output>
