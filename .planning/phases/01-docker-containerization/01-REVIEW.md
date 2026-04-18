---
phase: 01-docker-containerization
reviewed: 2026-04-17T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - .env.example
  - Dockerfile
  - .dockerignore
  - Dockerfile.database
  - docker-compose.yml
  - demodata/prod/zzz-admin-seed.sh
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-17
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

These six files form the Docker containerization layer for sontocodemo. The overall structure is sound — multi-service compose, a healthcheck-gated dependency, an init-script-based database seeder. However there are three critical issues: a SQL injection vector in the seed script, a hardcoded demo credential in the same script, and the `*.yml` glob in `.dockerignore` that silently excludes `docker-compose.yml` from the build context (breaking bind-mount-free builds). Four warnings address correctness gaps: the `npm run build` step in the Dockerfile only builds the client bundle (server bundle is missing), the `node` user is set after `npm install` runs as root, the `COPY . .` in the Dockerfile happens after `USER node` is dropped but the `--chown` is only on that one COPY, and the healthcheck uses shell variable interpolation syntax that Docker Compose may not expand inside the YAML array form.

---

## Critical Issues

### CR-01: SQL injection in seed script via unquoted shell variable

**File:** `demodata/prod/zzz-admin-seed.sh:20-23`
**Issue:** `DEMO_EMAIL` and `DEMO_PASS` are injected directly into a heredoc SQL statement without any escaping or parameterisation. Although both values are currently hardcoded literals, the pattern is dangerous: if either variable were ever sourced from the environment or a file, an attacker-controlled value could break out of the string and execute arbitrary SQL. Because this script runs as root inside the MySQL init container with no password prompt suppressed, the blast radius is the entire database.

**Fix:** Use a prepared statement via the `--execute` flag with proper quoting, or use `mysql_real_escape_string`-equivalent handling. For a seed script the safest approach is to keep the values as shell literals and document that they must never come from external input — and add a comment making this explicit. Additionally, single-quote the variables in the SQL heredoc to prevent accidental word-splitting:

```bash
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" sontocodb <<SQL
UPDATE users SET email='$(printf '%s' "${DEMO_EMAIL}" | sed "s/'/\\\\'/g")',
  password='$(printf '%s' "${HASH}" | sed "s/'/\\\\'/g")'
WHERE id=1;
SQL
```

Or, simpler and safer for a script where both values are compile-time constants, keep them as true shell literals (no variable expansion inside the SQL):

```bash
mysql -u root -p"${MYSQL_ROOT_PASSWORD}" sontocodb \
  --execute="UPDATE users SET email='sontocodemoadmin@sharrief.com', password='${HASH}' WHERE id=1;"
```

---

### CR-02: Hardcoded plaintext demo credential in version-controlled file

**File:** `demodata/prod/zzz-admin-seed.sh:10-11`
**Issue:** `DEMO_PASS="fhb.yez7cyt-PDB8cgd"` is a real password committed to the repository. Even though it is described as a "demo" password, it is the credential used to authenticate to the admin account of the running application. Anyone with read access to this repository can log in as admin once the stack is running. Because `Dockerfile.database` copies this script into the image (`COPY demodata/prod/ /docker-entrypoint-initdb.d/`), the password is also baked into every built database image.

**Fix:** Accept the demo password via an environment variable (with a safe default only for CI/demo purposes) and document that it must be changed before any non-throwaway deployment:

```bash
DEMO_EMAIL="${DEMO_ADMIN_EMAIL:-sontocodemoadmin@sharrief.com}"
DEMO_PASS="${DEMO_ADMIN_PASS:?ERROR: DEMO_ADMIN_PASS must be set}"
```

If the intent is truly a fixed public demo credential, add a prominent warning comment and ensure the `.gitignore` excludes any production copy of this file.

---

### CR-03: `*.yml` in `.dockerignore` excludes `docker-compose.yml` — breaks non-bind-mount builds

**File:** `.dockerignore:9`
**Issue:** The glob `*.yml` matches `docker-compose.yml` (and any other YAML file at the repo root). This is benign when the `web` service mounts the host directory as a bind volume (current `docker-compose.yml` does so), because the running container sees the host filesystem anyway. However it means any standalone `docker build .` — or a CI build without a bind mount — will silently exclude compose files and any other YAML config present at the root. More concretely, if `docker-compose.yml` or related YAML files are ever needed during the image build steps themselves, they will be absent with no error.

**Fix:** Replace the broad glob with an explicit exclusion of only what should be ignored:

```
docker-compose.yml
docker-compose.*.yml
```

Or, if the intent was to exclude all YAML, document the reason and verify no YAML file is needed during `docker build`.

---

## Warnings

### WR-01: `npm run build` only builds the client bundle — server bundle is not built inside the image

**File:** `Dockerfile:9`
**Issue:** `package.json` defines `"build": "rm -rf ./build && npm run build:client"`. It does **not** build the server bundle (`build:server`). The `CMD` runs `npm run dev:server` which uses `nodemon src/server/server.ts` — so `ts-node` is used at runtime and a pre-built server bundle is not required. However, the `Dockerfile` `RUN npm run build` step therefore only places the client bundle in `build/`. This is consistent with the dev-server intent but the mismatch between the label "build" and what actually happens (client only) is a latent trap: a future change to the CMD to use the pre-built server will fail silently because `build/server.js` will not exist.

**Fix:** Either rename the build step to make the intent explicit, or add a comment in the Dockerfile:

```dockerfile
# Builds the production client bundle only (server runs via ts-node / nodemon)
RUN npm run build
```

---

### WR-02: `npm install` runs as root; files are owned by root before `USER node`

**File:** `Dockerfile:3-8`
**Issue:** The `RUN npm install` on line 6 executes as root (the default Docker user at that point). The `chown -R node:node /home/node/app` on line 3 covers the directory but `npm install` re-populates `node_modules` afterwards, and those files will be owned by root. Combined with the named volume `node_modules` in `docker-compose.yml`, the `node` user (set on line 8) may be unable to write to `node_modules` when the volume is first created, causing cryptic permission errors.

**Fix:** Move `USER node` before the `npm install` step, or explicitly set ownership after install:

```dockerfile
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
USER node
RUN npm install --legacy-peer-deps
COPY --chown=node:node . .
RUN npm run build
```

---

### WR-03: Healthcheck uses `${DB_USER}` / `${DB_PASSWORD}` in YAML array form — Docker does not expand shell variables in exec-form commands

**File:** `docker-compose.yml:43`
**Issue:** The healthcheck is declared as:
```yaml
test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "${DB_USER}", "--password=${DB_PASSWORD}"]
```
Docker Compose does expand `${VAR}` substitutions in the `test` array (unlike a plain `docker run` healthcheck), so this works with Compose. However, if this compose file is ever used with `docker stack deploy` or with a plain `docker inspect`-based healthcheck, the literal strings `${DB_USER}` and `${DB_PASSWORD}` will be passed to mysqladmin and the ping will fail. The safer form is the shell form, which guarantees expansion:

```yaml
test: ["CMD-SHELL", "mysqladmin ping -h localhost -u $${DB_USER} --password=$${DB_PASSWORD} --silent"]
```

The `$$` escaping prevents Compose from trying to substitute (since the value will already be in the container environment), or use the already-expanded environment variables directly.

---

### WR-04: Bind-mounting the entire host repo into the container overwrites the image's `node_modules`

**File:** `docker-compose.yml:14-16`
**Issue:** The volume mount `- .:/home/node/app` overlays the host directory on top of `/home/node/app`, which would shadow `node_modules` installed inside the image. The named volume `- node_modules:/home/node/app/node_modules` on line 15 is correctly placed after the bind mount to prevent this. This is the standard Docker workaround, and it works — but it means the `node_modules` inside the image (built by `npm install` in the Dockerfile) are never used at runtime; the named volume's contents are used instead. On a fresh named volume the container will start without `node_modules`, because the volume is empty and the bind mount has already hidden the image's copy.

The first `docker compose up` will populate the named volume from the image layer (Docker does copy image contents into an empty named volume on first mount), so this typically works. However it is order-sensitive and non-obvious, and will break if the named volume already exists from a previous (possibly different-version) install. This should be documented with a note about when to run `docker compose down -v` to reset it.

**Fix:** Add a comment in `docker-compose.yml`:

```yaml
volumes:
  # node_modules volume prevents the host bind-mount from shadowing the image's node_modules.
  # If dependencies change, run: docker compose down -v && docker compose up --build
  - node_modules:/home/node/app/node_modules
```

---

## Info

### IN-01: `COOKIE_SECRET` and `DB_PASSWORD` example values are recognisable placeholder strings

**File:** `.env.example:17,31`
**Issue:** `COOKIE_SECRET=change-me-to-a-long-random-string` and `DB_PASSWORD=change-me-db-password` are obvious placeholders. If a developer forgets to copy and update `.env`, the application will start with these weak values. There is no startup check that enforces they have been changed.

**Fix:** Consider adding a startup guard in `src/server/lib/env.ts` that rejects the known-insecure placeholder values in non-test environments, or document this requirement prominently in the project README.

---

### IN-02: `Dockerfile.database` has no HEALTHCHECK instruction

**File:** `Dockerfile.database:1-2`
**Issue:** The MySQL image's healthcheck is defined only in `docker-compose.yml`. If the image is used outside of Compose (e.g., `docker run`), there is no embedded healthcheck and dependent services will not wait for the database to be ready.

**Fix:** Add a `HEALTHCHECK` to `Dockerfile.database`:

```dockerfile
FROM mysql:8.0
COPY demodata/prod/ /docker-entrypoint-initdb.d/
HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD mysqladmin ping -h localhost --silent
```

---

### IN-03: `.env*` in `.dockerignore` excludes `.env.example` from the build context

**File:** `.dockerignore:3`
**Issue:** The glob `.env*` matches `.env.example`. This means `.env.example` is not available inside the build context. This is harmless for the current Dockerfile (which does not reference `.env.example`), but if any build step needed to inspect or copy it, it would silently be absent.

**Fix:** If `.env.example` should be accessible in the image (e.g., for documentation purposes), use a more specific exclusion:

```
.env
.env.local
.env.*.local
```

Otherwise this is acceptable as-is, just be aware of the side effect.

---

_Reviewed: 2026-04-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
