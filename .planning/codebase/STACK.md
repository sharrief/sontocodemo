# Technology Stack

**Analysis Date:** 2026-04-17

## Languages

**Primary:**
- TypeScript 4.2.4 - All server and client code
- SCSS - Theming and custom styles (`src/client/scss/`)

**Secondary:**
- JavaScript - Webpack config files (`webpack.config.*.js`)

## Runtime

**Environment:**
- Node.js (current LTS, pinned via Docker `node:current`)
- Target: ES6 (both server `tsconfig.server.json` and client `tsconfig.client.json`)

**Package Manager:**
- npm (package-lock.json present)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Server:**
- Express 4.18.2 - HTTP server and routing
- routing-controllers 0.9.0 - Decorator-based controller registration on Express
- socket.io 4.5.4 - Real-time WebSocket server
- passport 0.6.0 - Authentication (custom strategy + local strategy + anonymous)
- TypeORM 0.2.34 - ORM for MySQL (decorator-based entities, custom repositories)

**Client:**
- React 16.14.0 - UI component framework (uses ReactDOM.render, not createRoot)
- react-router-dom 6.8.2 - Client-side routing (HashRouter)
- Redux 4.0.4 + @reduxjs/toolkit 1.5.0 - Global state management
- redux-saga 1.1.1 - Async side effects
- SWR 2.1.2 - Data fetching and caching hooks
- @mui/material 5.0.1 + @material-ui/core 4.11.3 - UI component libraries (both v4 and v5 present)
- react-bootstrap 2.1.1 + Bootstrap 5.1.3 + Bootswatch 5.1.3 - Bootstrap-based UI + themes
- @react-pdf/renderer 2.1.0 - PDF generation in browser

**Testing:**
- Jest 26.6.3 - Test runner (server-side only)
- Enzyme 3.11.0 + enzyme-adapter-react-16 - React component testing
- supertest 5.0.0 - HTTP integration testing
- redux-saga-test-plan 4.0.1 - Saga testing
- redux-mock-store 1.5.4 - Redux store mocking

**Build/Dev:**
- Webpack 5.70.0 - Client bundle (4 entry points: dashboard, login, passwordReset, application)
- webpack-dev-server 4.11.1 - Client hot reload proxy mode
- ts-node 9.1.1 - Server TypeScript execution
- nodemon 2.0.20 - Server auto-restart in development
- Babel 7.x - Transpilation pipeline for Webpack
- sass 1.49.9 / sass-loader - SCSS compilation

## Key Dependencies

**Critical:**
- `typeorm` 0.2.34 - All database access; custom repositories pattern
- `routing-controllers` 0.9.0 - All API endpoints declared via decorators
- `passport` + `passport-custom` + `passport-local` - Two auth strategies (user login, applicant login)
- `express-mysql-session` 2.1.5 - Session persistence in MySQL
- `@reduxjs/toolkit` 1.5.0 - Redux store and slice management
- `swr` 2.1.2 - Client-side data fetching replacing Redux thunks for read operations

**Infrastructure:**
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

**Environment:**
- All config via environment variables, typed and accessed through `src/server/lib/env.ts`
- Key variables: `NODE_ENV`, `PORT`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PASSWORD_SALT`, `DB_PASSWORD_2FA_SALT`, `COOKIE_SECRET`, `SESSION_NAME`, `SITE_URL`, `SITE_NAME`, `EMAIL_SERVER`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`, `EMAIL_REPLY_TO`, `EMAIL_ADMIN`, `APPINSIGHTS_INSTRUMENTATIONKEY`, `WATCH_CLIENT`, `SEND_REQUEST_EMAILS`, `NEW_REQUESTS_DISABLED`
- `DB_SERVER` env var selects SSL cert profile: `azure`, `digitalocean`, `dreamhost`, `localdreamhost`

**Build:**
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

**Development:**
- Docker + Docker Compose (`docker-compose.dev.yml`, `docker-compose.yml`)
- `.devcontainer/` present for VS Code dev containers
- MySQL 3306 (via Docker)
- Node.js current LTS

**Production:**
- Docker container (`Dockerfile`) exposing port 8080
- MySQL database (Azure or DigitalOcean with SSL cert)
- Azure Application Insights for telemetry (optional, key-gated)

---

*Stack analysis: 2026-04-17*
