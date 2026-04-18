<!-- GSD:project-start source:PROJECT.md -->
## Project

**sontocodemo — Containerize & Expose via zrok**

A financial account management platform (accounts, statements, trades, transfers, admin portal, applicant onboarding) that currently runs locally. This initiative containerizes the existing application with Docker and exposes it to the internet using zrok, so it can be reached from a stable public URL.

**Core Value:** The app runs reliably in Docker and is reachable from the public internet via a zrok tunnel — no cloud deployment required.

### Constraints

- **Tech stack**: Must preserve existing Express/TypeORM/MySQL/React architecture — no rewrites
- **Runtime mode**: Production client bundle + dev/debug server (ts-node, nodemon, winston debug)
- **Tunneling**: zrok (not ngrok or Cloudflare Tunnel) — starting from scratch install
- **Database**: MySQL in Docker, same schema as existing ORM entities
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript 4.2.4 - All server and client code
- SCSS - Theming and custom styles (`src/client/scss/`)
- JavaScript - Webpack config files (`webpack.config.*.js`)
## Runtime
- Node.js (current LTS, pinned via Docker `node:current`)
- Target: ES6 (both server `tsconfig.server.json` and client `tsconfig.client.json`)
- npm (package-lock.json present)
- Lockfile: present (`package-lock.json`)
## Frameworks
- Express 4.18.2 - HTTP server and routing
- routing-controllers 0.9.0 - Decorator-based controller registration on Express
- socket.io 4.5.4 - Real-time WebSocket server
- passport 0.6.0 - Authentication (custom strategy + local strategy + anonymous)
- TypeORM 0.2.34 - ORM for MySQL (decorator-based entities, custom repositories)
- React 16.14.0 - UI component framework (uses ReactDOM.render, not createRoot)
- react-router-dom 6.8.2 - Client-side routing (HashRouter)
- Redux 4.0.4 + @reduxjs/toolkit 1.5.0 - Global state management
- redux-saga 1.1.1 - Async side effects
- SWR 2.1.2 - Data fetching and caching hooks
- @mui/material 5.0.1 + @material-ui/core 4.11.3 - UI component libraries (both v4 and v5 present)
- react-bootstrap 2.1.1 + Bootstrap 5.1.3 + Bootswatch 5.1.3 - Bootstrap-based UI + themes
- @react-pdf/renderer 2.1.0 - PDF generation in browser
- Jest 26.6.3 - Test runner (server-side only)
- Enzyme 3.11.0 + enzyme-adapter-react-16 - React component testing
- supertest 5.0.0 - HTTP integration testing
- redux-saga-test-plan 4.0.1 - Saga testing
- redux-mock-store 1.5.4 - Redux store mocking
- Webpack 5.70.0 - Client bundle (4 entry points: dashboard, login, passwordReset, application)
- webpack-dev-server 4.11.1 - Client hot reload proxy mode
- ts-node 9.1.1 - Server TypeScript execution
- nodemon 2.0.20 - Server auto-restart in development
- Babel 7.x - Transpilation pipeline for Webpack
- sass 1.49.9 / sass-loader - SCSS compilation
## Key Dependencies
- `typeorm` 0.2.34 - All database access; custom repositories pattern
- `routing-controllers` 0.9.0 - All API endpoints declared via decorators
- `passport` + `passport-custom` + `passport-local` - Two auth strategies (user login, applicant login)
- `express-mysql-session` 2.1.5 - Session persistence in MySQL
- `@reduxjs/toolkit` 1.5.0 - Redux store and slice management
- `swr` 2.1.2 - Client-side data fetching replacing Redux thunks for read operations
- `cron` 1.8.2 - Background job scheduling (request email watcher)
- `nodemailer` 6.5.0 - SMTP email delivery (Office365 default)
- `winston` 3.3.3 - Structured server logging
- `@godaddy/terminus` 4.6.0 - Graceful shutdown handling
- `socket.io-client` 4.1.2 - Client-side socket connection (statement population)
- `applicationinsights` 1.8.10 - Azure Application Insights telemetry
- `otplib` 12.0.1 - TOTP two-factor authentication
- `node-rsa` 1.1.1 - RSA key operations
- `qrcode` 1.5.3 - QR code generation for 2FA setup
- `luxon` 1.28.1 - Date/time manipulation
- `big.js` 5.2.2 - Arbitrary-precision arithmetic for financial calculations
- `class-validator` 0.14.0 + `class-transformer` 0.3.1 - Input validation and transformation
- `json2csv` 5.0.6 - CSV export of financial data
- `uuid` 8.3.2 - UUID generation
## Configuration
- All config via environment variables, typed and accessed through `src/server/lib/env.ts`
- Key variables: `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PASSWORD_SALT`, `DB_PASSWORD_2FA_SALT`, `COOKIE_SECRET`, `SESSION_NAME`, `SITE_URL`, `SITE_NAME`, `EMAIL_SERVER`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ADMIN`, `APPINSIGHTS_INSTRUMENTATIONKEY`, `WATCH_CLIENT`, `SEND_REQUEST_EMAILS`, `NEW_REQUESTS_DISABLED`
- `DB_SERVER` env var selects SSL cert profile: `azure`, `digitalocean`, `dreamhost`, `localdreamhost`
- `webpack.config.js` - Shared base config
- `webpack.config.prod.js` - Production client build
- `webpack.config.dev.js` - Development client build with HMR
- `webpack.config.dev.noWatch.js` - Dev build without file watching
- `webpack.config.server.js` - Server bundle
- `tsconfig.json` - Base TypeScript config with full path alias map
- `tsconfig.client.json` - Client-specific TypeScript config
- `tsconfig.server.json` - Server-specific TypeScript config
- `ormconfig.ts` - TypeORM CLI config (exports `DBConfig` and `DBConfigTest`)
## Platform Requirements
- Docker + Docker Compose (`docker-compose.dev.yml`, `docker-compose.yml`)
- `.devcontainer/` present for VS Code dev containers
- MySQL 3306 (via Docker)
- Node.js current LTS
- Docker container (`Dockerfile`) exposing port 8080
- MySQL database (Azure or DigitalOcean with SSL cert)
- Azure Application Insights for telemetry (optional, key-gated)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern Overview
- Single Node.js process serves both static assets and the API
- Server uses decorator-based controllers (`routing-controllers`) mounted on Express
- Client is a multi-entry-point SPA bundled by Webpack (four separate bundles)
- Shared code (`src/shared/`) is imported by both client and server — the API shape, interfaces, and email templates live here
- Client data fetching is mixed: SWR hooks for most reads; Redux + redux-saga for global state mutations
## Layers
- Purpose: Bootstraps Express, configures middleware (sessions, passport, morgan), registers controllers, starts socket.io, starts background jobs, handles graceful shutdown
- Location: `src/server/server.ts`
- Depends on: controllers, middleware, lib (db, env), jobs, sockets
- Used by: Node.js process directly
- Purpose: Declare API routes via `@JsonController`, `@Get`, `@Post` decorators; handle HTTP request/response; delegate to repositories
- Location: `src/server/controllers/`
- Key files: `accounts.controller.ts`, `users.controller.ts`, `statements.controller.ts`, `trades.controller.ts`, `requests.controller.ts`, `operations.controller.ts`, `documents.controller.ts`, `applications.controller.ts`, `bankAccounts.controller.ts`, `managers.controllers.ts`, `tradeLog.controller.ts`
- Depends on: repositories, shared interfaces, shared API definitions, middleware
- Used by: Express via `useExpressServer()`
- Purpose: Auth guards and session/passport helpers
- Location: `src/server/middleware/`
- Key files: `auth.ts` (user auth: SHA-256 + TOTP, `AuthMiddleware` class for `@UseBefore`), `appAuth.ts` (applicant auth), `anon.ts`
- Depends on: repositories, lib (env, db), entities
- Used by: controllers (`@UseBefore(AuthMiddleware)`), server.ts (passport strategies)
- Purpose: Data access layer; TypeORM `@EntityRepository` custom repositories with query builder methods
- Location: `src/server/repositories/`
- Key files: `users.repository.ts`, `statements.repository.ts`, `operations.repository.ts`, `requests.repository.ts`, `trades.repository.ts`, `documents.repository.ts`, `bankData.repository.ts`, `applications.repository.ts`, `sessions.repository.ts`, `tradeLog.repository.ts`, `tradeModel.repository.ts`, `tradeSymbol.repository.ts`, `receivingBank.repository.ts`
- Depends on: TypeORM connection, entities
- Used by: controllers, sockets, jobs
- Purpose: TypeORM entity classes mapping to MySQL tables; define column structure and relations
- Location: `src/server/entities/`
- Key files: `User.ts`, `Statement.ts`, `Operation.ts`, `Trade.ts`, `Request.ts`, `Document.ts`, `Application.ts`, `BankDatum.ts`, `ReceivingBank.ts`, `TradeEntry.ts`, `TradeModel.ts`, `TradeSymbol.ts`, `Delegation.ts`, `Session.ts`, `ContactInfo.ts`, `Address.ts`
- Nested entities: `src/server/entities/nestedEntities/` (`ApplicantAddress.ts`, `ApplicantBirthDate.ts`, `ContactInfo.ts`)
- Purpose: Cross-cutting server concerns
- Location: `src/server/lib/`
- Key files: `db.ts` (TypeORM connection pool, session config), `env.ts` (typed environment variable access), `email.ts` (`Emailer` class using nodemailer + SMTP), `log.ts` (winston logger), `util.ts`, `labels.ts`
- Purpose: Background scheduled tasks
- Location: `src/server/jobs/`
- Key files: `request.jobs.ts` - Cron job that watches pending transfer requests and sends email notifications + creates document records
- Purpose: Real-time server push events over socket.io
- Location: `src/server/sockets/`
- Key files: `statements.sockets.ts` - Streams statement generation progress and emails to the connected admin client
- Purpose: Types, interfaces, API contract, and email templates shared between client and server
- Location: `src/shared/`
- Key files: `api/serverAPI.ts` (API route registry), `api/fetch.api.ts` (client fetch wrapper), `interfaces/` (all TypeScript interfaces and enums), `models/` (domain model classes), `email/` (React email templates)
- Purpose: Four independent Webpack bundles with separate HTML pages
- Locations:
- Purpose: Reusable UI components shared across dashboard and admin views
- Location: `src/client/js/components/`
- Key files: `Navigation.tsx` (role-based routing), `AccountsList/`, `AccountStatements/`, `BankInfo/`, `Transfers/`
- Purpose: Admin-only UI for managing accounts, trades, transfers, portfolio
- Location: `src/client/js/admin/`
- Key directories: `Accounts/`, `Trades/`, `Transfers/TransferList/TransferDialog/`, `Portfolio/`
- Key files: `admin.store.ts` (SWR hooks + Redux store creation + thunk actions), `admin.reducers.ts`, `Admin.tsx`
- Purpose: Redux state shape definitions and reducers
- Location: `src/client/js/store/`
- Key files: `state.ts` (all Redux state types and enums), `reducers.ts`, `thunks.ts`
## Data Flow
- SWR handles all client-side data fetching and caching (read operations use SWR hooks defined in `src/client/js/admin/admin.store.ts`)
- Redux manages global UI state (active tab, alerts, theme) via `admin.reducers.ts` and `src/client/js/store/`
- SWR `mutate()` is used for optimistic updates after write operations
## Key Abstractions
- Purpose: Each API endpoint is defined once in `src/shared/api/` with its route, request shape, and return type. Both server controllers and client fetchers reference this definition.
- Examples: `src/shared/api/accounts.api.ts`, `src/shared/api/statements.api.ts`
- Pattern: Each domain module exports an object with method definitions e.g. `{ Route, get, post }` where `get`/`post` are typed fetch wrappers
- Purpose: TypeORM `AbstractRepository` subclasses encapsulate all query logic; controllers never write raw queries
- Examples: `src/server/repositories/users.repository.ts`, `src/server/repositories/statements.repository.ts`
- Pattern: `@EntityRepository(Entity)` class with methods accepting typed parameter objects
- Purpose: SMTP abstraction that handles environment-gated recipient overrides (non-production redirects all mail)
- Location: `src/server/lib/email.ts`
- Pattern: `new Emailer().sendMail({ emailTemplate: <JSX />, to, subject, sendingFunction })`
- Purpose: Data fetching hooks co-located with the admin store, returning consistent `{ data, loading, error, mutate }` shapes
- Location: `src/client/js/admin/admin.store.ts`
- Pattern: `export function useAccounts() { const { data, error, isLoading } = useSWR(route, fetcher); return { accounts, accountsLoading, error }; }`
## Entry Points
- Location: `src/server/server.ts`
- Triggers: `npm run start` (ts-node) or `npm run dev:server` (nodemon)
- Responsibilities: Full server bootstrap — middleware stack, controllers, socket.io, background jobs, graceful shutdown
- Dashboard: `src/client/js/dashboard/index.tsx` - Mounts Redux Provider + HashRouter + Navigation
- Login: `src/client/js/login/index.tsx`
- Password Reset: `src/client/js/passwordReset/index.tsx`
- Application: `src/client/js/application/index.tsx`
## Error Handling
- All controller methods wrap logic in `try/catch ({ message: err })`
- `Emailer.sendMail()` sends error notification emails to admin when email preparation fails
- Socket handlers emit `PopulateError` events to the client rather than crashing
- Jobs catch per-item errors and continue processing remaining items
## Cross-Cutting Concerns
- `src/server/lib/log.ts` exports `error`, `debug`, `info`, `security` functions backed by winston
- Imported via path alias `@log` throughout the server
- `class-validator` + `class-transformer` available but validation appears minimal at controller layer
- Repository methods accept typed parameter objects; interfaces enforce shape at compile time
- All controller classes decorated with `@UseBefore(AuthMiddleware)` unless explicitly public
- Socket connections also gated: session + passport middleware applied via `io.use(wrap(...))`
- Two separate auth paths: standard user accounts (`accounts` strategy) and applicant portal (`application` strategy)
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, or `.github/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
