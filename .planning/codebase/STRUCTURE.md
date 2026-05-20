# Codebase Structure

**Analysis Date:** 2026-04-17

## Directory Layout

```
sontocodemo/
├── src/
│   ├── client/                   # Frontend code (Webpack-bundled)
│   │   ├── js/
│   │   │   ├── admin/            # Admin UI (managers, directors, traders)
│   │   │   │   ├── Accounts/     # Account management views
│   │   │   │   ├── Portfolio/    # Portfolio views
│   │   │   │   ├── Trades/       # Trade entry and log views
│   │   │   │   ├── Transfers/    # Transfer workflow (dialog, actions)
│   │   │   │   ├── admin.store.ts    # SWR hooks + Redux store + thunks
│   │   │   │   ├── admin.reducers.ts # Redux slice definitions
│   │   │   │   └── Admin.tsx         # Admin root component
│   │   │   ├── application/      # Account application multi-step form
│   │   │   ├── components/       # Shared reusable components
│   │   │   │   ├── AccountsList/
│   │   │   │   ├── AccountStatements/
│   │   │   │   ├── BankInfo/
│   │   │   │   ├── Transfers/
│   │   │   │   └── Navigation.tsx    # Role-based top-level router
│   │   │   ├── containers/       # Container components
│   │   │   ├── core/             # Shared helpers
│   │   │   ├── dashboard/        # Client dashboard entry point
│   │   │   │   ├── index.tsx     # Webpack entry: dashboard bundle
│   │   │   │   ├── App.tsx       # HashRouter + SWRConfig root
│   │   │   │   └── Dashboard.tsx # Dashboard view
│   │   │   ├── login/            # Login page entry point
│   │   │   ├── passwordReset/    # Password reset entry point
│   │   │   ├── store/            # Redux state types and reducers
│   │   │   │   ├── state.ts      # All state type definitions and enums
│   │   │   │   ├── reducers.ts
│   │   │   │   └── thunks.ts
│   │   │   └── themes/           # Bootswatch theme entry points
│   │   │       ├── darkly/
│   │   │       ├── sandstone/
│   │   │       ├── sketchy/
│   │   │       └── vapor/
│   │   ├── css/                  # Global CSS
│   │   ├── html/                 # HTML template (template.html)
│   │   ├── images/               # Static images
│   │   └── scss/                 # SCSS theme overrides
│   ├── server/                   # Backend code (Node.js/Express)
│   │   ├── controllers/          # Route handlers (decorator-based)
│   │   ├── entities/             # TypeORM entity classes
│   │   │   └── nestedEntities/   # Embedded entity classes
│   │   ├── jobs/                 # Background cron jobs
│   │   ├── lib/                  # Server utilities
│   │   │   ├── certs/            # SSL certificates (Azure, DigitalOcean)
│   │   │   ├── db.ts             # TypeORM + MySQL pool setup
│   │   │   ├── email.ts          # Emailer class (SMTP via nodemailer)
│   │   │   ├── env.ts            # Typed environment variable access
│   │   │   ├── log.ts            # Winston logger exports
│   │   │   └── util.ts           # Misc server utilities
│   │   ├── middleware/           # Express/Passport middleware
│   │   ├── repositories/         # TypeORM custom repositories (data access)
│   │   ├── sockets/              # socket.io event handlers
│   │   ├── __tests__/            # Server-side tests
│   │   │   ├── controllers/
│   │   │   ├── jobs/
│   │   │   ├── repositories/
│   │   │   └── __mocks__/
│   │   ├── server.ts             # Server entry point
│   │   └── jest.config.js        # Jest config for server tests
│   └── shared/                   # Code shared between client and server
│       ├── api/                  # API route definitions and typed fetch wrappers
│       ├── email/                # React email templates
│       ├── interfaces/           # TypeScript interfaces and enums
│       └── models/               # Domain model classes
├── types/                        # Global TypeScript type declarations
│   ├── custom.d.ts
│   ├── global.d.ts
│   ├── html.d.ts
│   └── images.d.ts
├── demodata/                     # SQL seed data for demo environment
│   ├── dev/
│   └── prod/
├── lancedb/                      # LanceDB directory (vector DB, appears unused/experimental)
├── build/                        # Compiled output (gitignored)
│   └── static/                   # Webpack client bundles served at /static
├── docker-compose.yml            # Production docker-compose
├── docker-compose.dev.yml        # Development docker-compose
├── Dockerfile                    # App container
├── Dockerfile.database           # MySQL container
├── Dockerfile.dev                # Development container
├── ormconfig.ts                  # TypeORM CLI config
├── nodemon.json                  # Nodemon server watch config
├── tsconfig.json                 # Base TypeScript config + path aliases
├── tsconfig.client.json          # Client TypeScript config
├── tsconfig.server.json          # Server TypeScript config
├── webpack.config.js             # Shared Webpack base config
├── webpack.config.prod.js        # Production client build
├── webpack.config.dev.js         # Development client build (HMR)
├── webpack.config.dev.noWatch.js # Dev build without watching
└── webpack.config.server.js      # Server bundle config
```

## Directory Purposes

**`src/server/controllers/`:**
- Purpose: Each file is a `@JsonController` class with route handler methods
- Contains: One file per domain (accounts, users, statements, trades, requests, operations, documents, applications, bankAccounts, managers, tradeLog)
- Key files: `index.ts` re-exports all controllers; `server.ts` registers them with `useExpressServer()`

**`src/server/repositories/`:**
- Purpose: All database queries; controllers must not write raw SQL or TypeORM query builders directly
- Contains: One `@EntityRepository` class per entity; complex multi-join queries using SelectQueryBuilder
- Key files: `users.repository.ts` (also contains the shared `AppendAccountAuthorizationFilterQuery` helper), `statements.repository.ts`

**`src/server/entities/`:**
- Purpose: TypeORM entity definitions matching MySQL schema
- Contains: One class per table decorated with `@Entity`, `@Column`, `@OneToMany`, etc.

**`src/server/lib/`:**
- Purpose: Infrastructure utilities imported across all server layers
- Accessed via path aliases: `@log`, `@lib/db`, `@lib/env`, `@lib/email`

**`src/shared/api/`:**
- Purpose: Single source of truth for every API endpoint - route string, typed request params, typed return value, and fetch function
- Contains: One file per domain, plus `serverAPI.ts` (aggregates all domains into the `API` object), `fetch.api.ts` (the fetch wrapper used by all client-side API calls), `socket.api.ts`

**`src/shared/interfaces/`:**
- Purpose: All cross-cutting TypeScript types used by both client and server; do not put server-only or client-only types here
- Contains: Entity interfaces (`IUser`, `IStatement`, etc.), enums (`RoleId`, `RequestStatus`, `DocumentStage`, etc.), utility types

**`src/client/js/admin/admin.store.ts`:**
- Purpose: Acts as a combined SWR hook library and Redux store file; unusually large (600+ lines) — this is the central data layer for the admin UI

**`src/client/js/components/`:**
- Purpose: Components shared between dashboard and admin views
- Contains: Reusable UI components only; page-specific components belong in their respective feature directories

**`src/client/js/themes/`:**
- Purpose: Four Bootswatch theme bundles built as separate Webpack entries; each imports its SCSS and exports a React app

## Key File Locations

**Entry Points:**
- `src/server/server.ts`: Server start, full middleware and route bootstrap
- `src/client/js/dashboard/index.tsx`: Dashboard SPA mount
- `src/client/js/login/index.tsx`: Login page mount
- `src/client/js/passwordReset/index.tsx`: Password reset page mount
- `src/client/js/application/index.tsx`: Application flow mount

**Configuration:**
- `src/server/lib/env.ts`: All environment variable access - read env vars here, not directly via `process.env`
- `src/server/lib/db.ts`: TypeORM connection factory and session config
- `tsconfig.json`: Path alias definitions (used by both client and server TypeScript)
- `ormconfig.ts`: TypeORM CLI migration config

**Core Logic:**
- `src/server/middleware/auth.ts`: User authentication logic (SHA-256 hash, TOTP check, session management)
- `src/server/repositories/users.repository.ts`: Authorization filter query used by most data access
- `src/shared/api/serverAPI.ts`: API object structure and `endpoints` map
- `src/shared/api/fetch.api.ts`: All client HTTP requests go through `fetchRoute()`

**Testing:**
- `src/server/__tests__/`: All server tests
- `src/server/jest.config.js`: Jest configuration

## Naming Conventions

**Files:**
- Server entities: PascalCase, no suffix (e.g., `User.ts`, `Statement.ts`)
- Server controllers: `{domain}.controller.ts` (e.g., `accounts.controller.ts`)
- Server repositories: `{domain}.repository.ts` (e.g., `users.repository.ts`)
- Client components: PascalCase, often dot-separated for sub-components (e.g., `Accounts.Active.Table.tsx`, `Dashboard.StatementChart.tsx`)
- Client store files: `{scope}.store.ts`, `{scope}.reducers.ts`
- Shared API: `{domain}.api.ts`
- Shared interfaces: `I{Name}.ts` (e.g., `IUser.ts`, `IStatement.ts`)

**Directories:**
- Client feature dirs: PascalCase matching the component name (e.g., `Transfers/`, `TransferDialog/`)
- Server dirs: lowercase (e.g., `controllers/`, `repositories/`, `entities/`)

## Where to Add New Code

**New API endpoint:**
1. Define the route and types in `src/shared/api/{domain}.api.ts`
2. Export from `src/shared/api/serverAPI.ts` under the `API` object
3. Add handler to `src/server/controllers/{domain}.controller.ts`
4. Add data access method to `src/server/repositories/{domain}.repository.ts`
5. Add client-side SWR hook or mutation function to `src/client/js/admin/admin.store.ts`

**New entity / database table:**
1. Create entity class in `src/server/entities/{Entity}.ts` with TypeORM decorators
2. Export from `src/server/entities/index.ts`
3. Register in `DBConfig.entities` array in `src/server/lib/db.ts`
4. Create repository in `src/server/repositories/{entity}.repository.ts`
5. Add interface to `src/shared/interfaces/I{Entity}.ts`
6. Generate and apply migration: `npm run genDevMigration` then `npm run applyDevMigration`

**New shared component:**
- Reusable across dashboard and admin: `src/client/js/components/{ComponentName}.tsx`
- Admin-only: `src/client/js/admin/{ComponentName}.tsx` or appropriate subdirectory
- Dashboard-only: `src/client/js/dashboard/{ComponentName}.tsx`

**New background job:**
- Add to `src/server/jobs/` and export a start function
- Register the start call in `src/server/server.ts` alongside `startWatchNewRequests()`

**New server utility:**
- Add to `src/server/lib/` and register a path alias in `tsconfig.json` under `@lib/*`

**New shared type / enum:**
- Add to `src/shared/interfaces/` and export from `src/shared/interfaces/index.ts`

**Tests:**
- Server tests: `src/server/__tests__/{controllers|repositories|jobs}/{name}.test.ts`
- Mock overrides: `src/server/__tests__/__mocks__/`

## Special Directories

**`build/`:**
- Purpose: Webpack output for client bundles (`build/static/`) and server bundle (`build/server.js`)
- Generated: Yes
- Committed: No (gitignored)

**`demodata/`:**
- Purpose: SQL dump files auto-loaded by the MySQL Docker container on first init
- Generated: No (manually maintained)
- Committed: Yes

**`lancedb/`:**
- Purpose: LanceDB vector database directory — appears experimental/unused in current codebase
- Generated: Partially (database files written at runtime)
- Committed: Directory present but appears empty or unused

**`types/`:**
- Purpose: Global TypeScript ambient declarations for non-typed imports (HTML, images, custom globals)
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-04-17*
