# DEVI Pharmacy - Agent Documentation

## Project Overview

DEVI is a production-ready, enterprise-grade Pharmacy Management System with a Go backend and Vue 3 + TypeScript frontend. It manages inventory, point-of-sale, compliance (DDA), analytics, and prescriptions.

## Architecture

- **Backend**: Go (Fiber) with PostgreSQL, NATS/JetStream, OpenTelemetry, Zitadel Auth
- **Frontend**: Vue 3 + TypeScript + Vite + PrimeVue + UnoCSS + Zustand (state management)
- **State**: Zustand for all global state (migrated from Pinia)
- **API**: RESTful via `/api/v1/*` with JWT authentication

## Critical Rules (Non-Negotiable)

1. **No Mocks, TODOs, or Stubs**: Every piece of code must be production-ready and complete.
2. **Single Source of Truth**: All models in `core/internal/models/`. No duplicates.
3. **Frontend State**: Only Zustand stores in `src/features/*/store.ts`. Legacy Pinia stores deleted.
4. **API Wiring**: Frontend stores call real backend endpoints. Backend handlers implement real logic.
5. **Environment**: No hardcoded URLs. All configurable via Vite `.env` variables.
6. **Documentation**: All changes and plans documented in `AGENTS.md` and `plan.md`.

## Go Module

- **Module Path**: `devi/core`
- **Go Version**: `1.23` (Stable, production)
- **Entry**: `core/main.go`
- **Models**: `core/internal/models/*`
- **Handlers**: `core/api/handlers/*`
- **Services**: `core/internal/services/*`
- **Repositories**: `core/internal/repositories/*`
- **Middleware**: `core/api/middleware/*`

## Frontend Structure

- **Entry**: `src/main.ts`
- **App Root**: `src/App.vue`
- **Router**: `src/router/index.ts`
- **API Client**: `src/core/api.ts` (uses `VITE_API_URL`)
- **Stores**: `src/features/{domain}/store.ts` (Zustand only)
- **Views**: `src/features/{domain}/views/*.vue`
- **Components**: `src/features/{domain}/components/*.vue`

## Environment Variables

```bash
VITE_API_URL=http://localhost:3000/api/v1
DATABASE_URL=postgres://...
NATS_URL=nats://localhost:4222
PORT=3000
ZITADEL_DOMAIN=https://your-zitadel-instance.com
```

## Authentication

- JWT via Zitadel (JWKS validation)
- Hardware-bound tokens with `kiosk_id` and `pharmacy_id`
- Role-based access control (RBAC): OWNER, PHARMACIST, CASHIER

## History

- **Initial State**: Broken Go module (1.25.0), duplicate models, mixed Pinia/Zustand stores, stubbed handlers, hardcoded URLs.
- **Consolidation**: Merged all models to `core/internal/models/`, fixed Go module path, built real API handlers, refactored all frontend state to Zustand, wired stores to real backend.
- **TypeScript & Config Unification**: Consolidated the frontend entrypoints and configuration files to TypeScript. Removed conflicting `vite.config.js` and `src/main.js`. Configured Babel for decorators support in `.babelrc`. Fixed duplicate declarations in `POSView.vue` and bound it correctly to `posStore` and `inventoryStore`.
