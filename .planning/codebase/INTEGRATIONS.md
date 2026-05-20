# External Integrations

**Analysis Date:** 2026-04-17

## APIs & External Services

**Monitoring / Telemetry:**
- Azure Application Insights - Server-side error and performance telemetry
  - SDK/Client: `applicationinsights` npm package
  - Auth: `APPINSIGHTS_INSTRUMENTATIONKEY` env var
  - Activation: Only initialized when key is present (`src/server/server.ts` lines 42-45)

## Data Storage

**Databases:**
- MySQL - Primary and sole datastore
  - Connection: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` env vars
  - Client: TypeORM 0.2.34 with custom repositories (`src/server/repositories/`)
  - Session store: `express-mysql-session` persists sessions in MySQL (`src/server/lib/db.ts`)
  - SSL: Azure cert at `src/server/lib/certs/azureMySQLServer`; DigitalOcean cert at `src/server/lib/certs/ca-certificate`
  - Two connection configs: `DBConfig` (default) and `DBConfigTest` (test isolation) defined in `src/server/lib/db.ts`

**File Storage:**
- Local filesystem only - No cloud object storage detected

**Caching:**
- None server-side
- Client-side: SWR in-memory cache for API responses (`src/client/js/admin/admin.store.ts`)

## Authentication & Identity

**Auth Provider:**
- Custom implementation (no third-party identity provider)
  - Implementation: Passport.js with two strategies (`src/server/server.ts`, `src/server/middleware/auth.ts`)
    - `accounts` strategy: Email + SHA-256 hashed password + optional TOTP via `otplib`
    - `application` strategy: passport-local with `authEmail` + `appPIN` fields
  - Password hashing: SHA-256 with salts (`DB_PASSWORD_SALT`, `DB_PASSWORD_2FA_SALT`)
  - Sessions: MySQL-backed via `express-mysql-session`, 24-hour cookie TTL
  - 2FA: TOTP via `otplib`; QR code generation via `qrcode`

## Email

**Provider:**
- SMTP via `nodemailer` - `src/server/lib/email.ts`
  - Default host: `smtp.office365.com` port 587 (TLS required)
  - Config: `EMAIL_SERVER`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO` env vars
  - In non-production environments, all emails are rerouted to `EMAIL_TEST_CLIENT` and CC'd to `EMAIL_DEV`
  - Email templates: React components rendered server-side via `ReactDOMServer.renderToStaticMarkup` (`src/shared/email/`)

**Use cases:**
- Transfer/distribution request notifications (`src/server/jobs/request.jobs.ts`)
- Monthly statement generation notifications (`src/server/sockets/statements.sockets.ts`)
- Error notification emails to admin

## Real-Time Communication

**WebSockets:**
- socket.io 4.5.4 server at `/socket` endpoint (`src/server/server.ts`)
- Session and Passport middleware applied to socket connections (authenticated sockets only)
- Used for: statement generation progress streaming (`src/server/sockets/statements.sockets.ts`)
- Client: `socket.io-client` 4.1.2 (`src/shared/api/socket.api.ts`)

## Monitoring & Observability

**Error Tracking:**
- Azure Application Insights (optional, key-gated)

**Logs:**
- `winston` 3.3.3 structured logging (`src/server/lib/log.ts`)
- `morgan` HTTP request logging (dev: `dev` format; production: `combined` format)

## CI/CD & Deployment

**Hosting:**
- Docker containers (`Dockerfile`, `Dockerfile.database`, `docker-compose.yml`)
- DigitalOcean mentioned in npm scripts (`build:digitalocean`)
- Azure also supported (SSL cert present, env var `DB_SERVER=azure`)

**CI Pipeline:**
- None detected (no GitHub Actions, CircleCI, or similar config files found)

## Environment Configuration

**Required env vars (production):**
- `NODE_ENV` - Runtime environment (`production`|`development`|`test`|`staging`)
- `PORT` - HTTP port (default 8080)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - MySQL connection
- `DB_PASSWORD_SALT`, `DB_PASSWORD_2FA_SALT` - Password hashing salts
- `DB_SERVER` - Selects SSL profile (`azure`|`digitalocean`|`dreamhost`|`localdreamhost`)
- `COOKIE_SECRET`, `SESSION_NAME` - Session config
- `SITE_URL`, `SITE_NAME` - Public-facing metadata
- `EMAIL_SERVER`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ADMIN` - SMTP config
- `APPINSIGHTS_INSTRUMENTATIONKEY` - Azure telemetry (optional)
- `SEND_REQUEST_EMAILS` - Enable/disable background email job (`true`|`false`)
- `NEW_REQUESTS_DISABLED` - Feature flag to block new transfer requests

**Secrets location:**
- `.env` file at project root (not committed); `envs/` directory contains per-environment `.env` files referenced in npm migration scripts

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected (all external communication is SMTP email)

---

*Integration audit: 2026-04-17*
