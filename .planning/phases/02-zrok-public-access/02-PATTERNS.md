# Phase 2: zrok Public Access (Cloudflare Tunnel) - Pattern Map

**Mapped:** 2026-04-18
**Files analyzed:** 2 modified files + 1 host-side operation (no new source files)
**Analogs found:** 2 / 2

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `docker-compose.yml` | config | request-response (port binding) | `docker-compose.yml` (Phase 1 established pattern) | self (prior state) |
| `.env.example` | config | N/A (documentation) | `.env.example` (Phase 1 established pattern) | self (prior state) |

**Note:** This phase also involves host-side shell operations (cloudflared install + systemd service registration) that produce no repo files. These are documented below under "No Analog Found."

---

## Pattern Assignments

### `docker-compose.yml` — port mapping update

**Change:** Line 12 — change `"8080:8080"` to `"8901:8080"`

**Current state** (`docker-compose.yml`, lines 1-57 — the whole file is the analog):

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    env_file: .env
    environment:
      # Override DB_SERVER to disable SSL for local Docker MySQL.
      # The app's src/server/lib/db.ts only enables SSL when DB_SERVER=azure or DB_SERVER=digitalocean.
      - DB_SERVER=localdreamhost
    ports:
      - "8080:8080"       # <-- change to "8901:8080"
    volumes:
      - .:/home/node/app
      - node_modules:/home/node/app/node_modules
      - build:/home/node/app/build
    networks:
      - sontoco-network
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
```

**Pattern to follow for the edit:**
- The `ports:` key uses the `"HOST:CONTAINER"` format as a quoted string under a list entry.
- Only the host-side port changes (`8901`); the container-side port stays `8080` (what Express binds to inside the container).
- No other lines in the file change.
- The comment block above the `environment:` key (lines 8-10) should be preserved exactly.

**Established conventions from Phase 1 (01-02-SUMMARY.md):**
- Each change to docker-compose.yml is a targeted single-line edit with a documented reason.
- Verification uses `grep` to confirm the value is present after the change.
- No `command:` overrides — Dockerfile CMD (`npm run dev:server`) runs as-is.

---

### `.env.example` — SITE_URL update

**Change:** Line 10 — change `SITE_URL=http://localhost:8080` to `SITE_URL=https://sontocodemo.sharrief.com`

**Current state** (`.env.example`, lines 1-15 — the Site section is the analog):

```ini
# sontocodemo — Environment Variables
# Copy this file to .env and fill in your values.
# Never commit .env to git.

# --- Runtime -----------------------------------------------------------
NODE_ENV=development
PORT=8080

# --- Site --------------------------------------------------------------
SITE_URL=http://localhost:8080          # <-- change to https://sontocodemo.sharrief.com
SITE_NAME=Sontoco Holdings
SITE_HOST=localhost
SITE_HOST_2=
SITE_FILE_HOST=
```

**Pattern to follow for the edit:**
- Comment style uses `# --- Section Name ---` delimiters with trailing dashes (already established in Phase 1).
- Values use `KEY=value` format with no quotes.
- The `SITE_URL` key lives in the `# --- Site ---` block, second entry after `PORT`.
- No other `Site` block entries change.
- After updating `.env.example`, the user's local `.env` must also be updated manually (`.env` is gitignored — the plan must instruct this as a separate step).

**Downstream impact of SITE_URL:**
- Read at runtime by `src/server/lib/env.ts` via `env.var.SITE_URL`.
- Used by email templates and self-referential redirect URLs.
- Changing `.env.example` documents the canonical value; updating `.env` activates it for the running container.

---

## Shared Patterns

### Verification pattern (from Phase 1 playbook)

**Source:** `.planning/phases/01-docker-containerization/01-01-PLAN.md` and `01-02-PLAN.md` (established convention)
**Apply to:** All plan tasks in this phase

Phase 1 verified every file edit with a `grep` command immediately after the change:

```bash
# Pattern: grep for the new value to confirm the edit landed
grep -n '"8901:8080"' docker-compose.yml
grep -n 'SITE_URL=https://sontocodemo.sharrief.com' .env.example
```

Then end-to-end verification used `curl`:

```bash
curl -s -o /dev/null -w "%{http_code}" https://sontocodemo.sharrief.com
# Expect: 200 (or 301/302 redirect to login)
```

### Comment preservation pattern

**Source:** `docker-compose.yml` lines 8-10 (established in Phase 1)
**Apply to:** docker-compose.yml edit

When editing `docker-compose.yml`, preserve all existing comments exactly. The inline comment block on the `environment:` key documents the SSL bypass rationale and must not be removed.

---

## No Analog Found

These are host-side operations that produce no repo artifacts. The planner must document them as manual tasks with explicit shell commands:

| Operation | Role | Data Flow | Reason |
|-----------|------|-----------|--------|
| `cloudflared` apt installation | host config | N/A | No package manager config files in repo; no prior apt install pattern |
| `cloudflared service install <token>` | host config | N/A | No systemd service registration pattern exists in repo |
| Cloudflare DNS CNAME record | external config | N/A | DNS is managed outside the repo via Cloudflare dashboard |

**For these operations, the planner must use the decisions from CONTEXT.md directly (D-01 through D-04) as the authoritative source, not any codebase analog.**

Specifically for the token handling requirement (from `<specifics>` in CONTEXT.md):
- The tunnel token is a sensitive credential obtained from the Cloudflare Zero Trust dashboard at runtime.
- It must NOT be committed to the repo or added to `.env.example`.
- The plan must instruct the user to obtain and use the token interactively — it is never written to a file.

---

## Metadata

**Analog search scope:** `docker-compose.yml`, `.env.example`, `.planning/phases/01-docker-containerization/` (Phase 1 summaries and plans)
**Files scanned:** 6 (docker-compose.yml, .env.example, 01-01-PLAN.md, 01-01-SUMMARY.md, 01-02-PLAN.md, 01-02-SUMMARY.md)
**Pattern extraction date:** 2026-04-18
