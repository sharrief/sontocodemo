# Architecture

**Analysis Date:** 2026-04-17

## Pattern Overview

**Overall:** Monorepo full-stack TypeScript application with a clear client/server split, a shared module for contracts, and a layered server architecture (controller → repository → entity).

**Key Characteristics:**
- Single Node.js process serves both static assets and the API
- Server uses decorator-based controllers (`routing-controllers`) mounted on Express
- Client is a multi-entry-point SPA bundled by Webpack (four separate bundles)
- Shared code (`src/shared/`) is imported by both client and server — the API shape, interfaces, and email templates live here
- Client data fetching is mixed: SWR hooks for most reads; Redux + redux-saga for global state mutations

## Layers

**HTTP Server / Entry Point:**
- Purpose: Bootstraps Express, configures middleware (sessions, passport, morgan), registers controllers, starts socket.io, starts background jobs, handles graceful shutdown
- Location: `src/server/server.ts`
- Depends on: controllers, middleware, lib (db, env), jobs, sockets
- Used by: Node.js process directly

**Controllers:**
- Purpose: Declare API routes via `@JsonController`, `@Get`, `@Post` decorators; handle HTTP request/response; delegate to repositories
- Location: `src/server/controllers/`
- Key files: `accounts.controller.ts`, `users.controller.ts`, `statements.controller.ts`, `trades.controller.ts`, `requests.controller.ts`, `operations.controller.ts`, `documents.controller.ts`, `applications.controller.ts`, `bankAccounts.controller.ts`, `managers.controllers.ts`, `tradeLog.controller.ts`
- Depends on: repositories, shared interfaces, shared API definitions, middleware
- Used by: Express via `useExpressServer()`

**Middleware:**
- Purpose: Auth guards and session/passport helpers
- Location: `src/server/middleware/`
- Key files: `auth.ts` (user auth: SHA-256 + TOTP, `AuthMiddleware` class for `@UseBefore`), `appAuth.ts` (applicant auth), `anon.ts`
- Depends on: repositories, lib (env, db), entities
- Used by: controllers (`@UseBefore(AuthMiddleware)`), server.ts (passport strategies)

**Repositories:**
- Purpose: Data access layer; TypeORM `@EntityRepository` custom repositories with query builder methods
- Location: `src/server/repositories/`
- Key files: `users.repository.ts`, `statements.repository.ts`, `operations.repository.ts`, `requests.repository.ts`, `trades.repository.ts`, `documents.repository.ts`, `bankData.repository.ts`, `applications.repository.ts`, `sessions.repository.ts`, `tradeLog.repository.ts`, `tradeModel.repository.ts`, `tradeSymbol.repository.ts`, `receivingBank.repository.ts`
- Depends on: TypeORM connection, entities
- Used by: controllers, sockets, jobs

**Entities:**
- Purpose: TypeORM entity classes mapping to MySQL tables; define column structure and relations
- Location: `src/server/entities/`
- Key files: `User.ts`, `Statement.ts`, `Operation.ts`, `Trade.ts`, `Request.ts`, `Document.ts`, `Application.ts`, `BankDatum.ts`, `ReceivingBank.ts`, `TradeEntry.ts`, `TradeModel.ts`, `TradeSymbol.ts`, `Delegation.ts`, `Session.ts`, `ContactInfo.ts`, `Address.ts`
- Nested entities: `src/server/entities/nestedEntities/` (`ApplicantAddress.ts`, `ApplicantBirthDate.ts`, `ContactInfo.ts`)

**Lib (Server Utilities):**
- Purpose: Cross-cutting server concerns
- Location: `src/server/lib/`
- Key files: `db.ts` (TypeORM connection pool, session config), `env.ts` (typed environment variable access), `email.ts` (`Emailer` class using nodemailer + SMTP), `log.ts` (winston logger), `util.ts`, `labels.ts`

**Jobs:**
- Purpose: Background scheduled tasks
- Location: `src/server/jobs/`
- Key files: `request.jobs.ts` - Cron job that watches pending transfer requests and sends email notifications + creates document records

**Sockets:**
- Purpose: Real-time server push events over socket.io
- Location: `src/server/sockets/`
- Key files: `statements.sockets.ts` - Streams statement generation progress and emails to the connected admin client

**Shared:**
- Purpose: Types, interfaces, API contract, and email templates shared between client and server
- Location: `src/shared/`
- Key files: `api/serverAPI.ts` (API route registry), `api/fetch.api.ts` (client fetch wrapper), `interfaces/` (all TypeScript interfaces and enums), `models/` (domain model classes), `email/` (React email templates)

**Client - Entry Points:**
- Purpose: Four independent Webpack bundles with separate HTML pages
- Locations:
  - `src/client/js/dashboard/index.tsx` - Authenticated user dashboard
  - `src/client/js/login/index.tsx` - Login page
  - `src/client/js/passwordReset/index.tsx` - Password reset page
  - `src/client/js/application/index.tsx` - Account application flow

**Client - Components:**
- Purpose: Reusable UI components shared across dashboard and admin views
- Location: `src/client/js/components/`
- Key files: `Navigation.tsx` (role-based routing), `AccountsList/`, `AccountStatements/`, `BankInfo/`, `Transfers/`

**Client - Admin:**
- Purpose: Admin-only UI for managing accounts, trades, transfers, portfolio
- Location: `src/client/js/admin/`
- Key directories: `Accounts/`, `Trades/`, `Transfers/TransferList/TransferDialog/`, `Portfolio/`
- Key files: `admin.store.ts` (SWR hooks + Redux store creation + thunk actions), `admin.reducers.ts`, `Admin.tsx`

**Client - Store:**
- Purpose: Redux state shape definitions and reducers
- Location: `src/client/js/store/`
- Key files: `state.ts` (all Redux state types and enums), `reducers.ts`, `thunks.ts`

## Data Flow

**API Request Flow:**
1. Client calls `API.SomeDomain.SomeAction.post/get(args)` from `src/shared/api/`
2. `fetchRoute()` in `src/shared/api/fetch.api.ts` makes the HTTP request
3. Express routes request to the matching `@JsonController` method in `src/server/controllers/`
4. Controller checks `AuthMiddleware`, then calls `getConnection()` and uses a custom repository
5. Repository builds TypeORM query and returns typed result
6. Controller returns typed response matching the shared API definition

**Real-Time Statement Generation Flow:**
1. Admin client emits `API.Statements.Populate.Event` via socket.io
2. `src/server/sockets/statements.sockets.ts` receives the event, checks auth, calls `statementsRepo.generate()`
3. Server emits progress events (`PopulatedStatement`, `PopulateInfo`, `PopulateError`) back to the client socket as each statement is processed
4. After generation, if `sendEmails` is true, emails each account holder (throttled to avoid Office365 limits)

**Background Job Flow:**
1. `startWatchNewRequests()` in `src/server/jobs/request.jobs.ts` starts a cron job on server boot
2. Cron fires on schedule (hourly in production, every minute in dev)
3. Job fetches pending requests from repository, sends notification emails, creates document records

**State Management:**
- SWR handles all client-side data fetching and caching (read operations use SWR hooks defined in `src/client/js/admin/admin.store.ts`)
- Redux manages global UI state (active tab, alerts, theme) via `admin.reducers.ts` and `src/client/js/store/`
- SWR `mutate()` is used for optimistic updates after write operations

## Key Abstractions

**Shared API Contract:**
- Purpose: Each API endpoint is defined once in `src/shared/api/` with its route, request shape, and return type. Both server controllers and client fetchers reference this definition.
- Examples: `src/shared/api/accounts.api.ts`, `src/shared/api/statements.api.ts`
- Pattern: Each domain module exports an object with method definitions e.g. `{ Route, get, post }` where `get`/`post` are typed fetch wrappers

**Custom Repository:**
- Purpose: TypeORM `AbstractRepository` subclasses encapsulate all query logic; controllers never write raw queries
- Examples: `src/server/repositories/users.repository.ts`, `src/server/repositories/statements.repository.ts`
- Pattern: `@EntityRepository(Entity)` class with methods accepting typed parameter objects

**Emailer Class:**
- Purpose: SMTP abstraction that handles environment-gated recipient overrides (non-production redirects all mail)
- Location: `src/server/lib/email.ts`
- Pattern: `new Emailer().sendMail({ emailTemplate: <JSX />, to, subject, sendingFunction })`

**SWR Hook Factories:**
- Purpose: Data fetching hooks co-located with the admin store, returning consistent `{ data, loading, error, mutate }` shapes
- Location: `src/client/js/admin/admin.store.ts`
- Pattern: `export function useAccounts() { const { data, error, isLoading } = useSWR(route, fetcher); return { accounts, accountsLoading, error }; }`

## Entry Points

**Server:**
- Location: `src/server/server.ts`
- Triggers: `npm run start` (ts-node) or `npm run dev:server` (nodemon)
- Responsibilities: Full server bootstrap — middleware stack, controllers, socket.io, background jobs, graceful shutdown

**Client Bundles:**
- Dashboard: `src/client/js/dashboard/index.tsx` - Mounts Redux Provider + HashRouter + Navigation
- Login: `src/client/js/login/index.tsx`
- Password Reset: `src/client/js/passwordReset/index.tsx`
- Application: `src/client/js/application/index.tsx`

## Error Handling

**Strategy:** Controllers catch errors in try/catch, log with `error()` from `@log`, set `res.status(400)`, and return `{ error: string }` matching the shared API return type.

**Patterns:**
- All controller methods wrap logic in `try/catch ({ message: err })`
- `Emailer.sendMail()` sends error notification emails to admin when email preparation fails
- Socket handlers emit `PopulateError` events to the client rather than crashing
- Jobs catch per-item errors and continue processing remaining items

## Cross-Cutting Concerns

**Logging:**
- `src/server/lib/log.ts` exports `error`, `debug`, `info`, `security` functions backed by winston
- Imported via path alias `@log` throughout the server

**Validation:**
- `class-validator` + `class-transformer` available but validation appears minimal at controller layer
- Repository methods accept typed parameter objects; interfaces enforce shape at compile time

**Authentication:**
- All controller classes decorated with `@UseBefore(AuthMiddleware)` unless explicitly public
- Socket connections also gated: session + passport middleware applied via `io.use(wrap(...))`
- Two separate auth paths: standard user accounts (`accounts` strategy) and applicant portal (`application` strategy)

---

*Architecture analysis: 2026-04-17*
