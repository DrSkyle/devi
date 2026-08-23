# DEVI Pharmacy - "Stop the Bleeding" - Full Master Plan

## Date: 2025-05-15

## Status: IN PROGRESS - Step 2 of 20

## Last Updated: 2025-05-15

---

# SECTION 1: THE PROBLEM (What We Have)

## 1.1 Go Backend - Broken Compilation

- `go 1.25.0` in `core/go.mod` - DOES NOT EXIST (current stable is 1.23)
- `main.go` has multiple compilation errors:
  - `logger.New()` is undefined (line 126)
  - `handlers.NewPOSHandler` expects `*pgx.Conn` but receives `*pgxpool.Pool`
  - `handlers.NewInventoryHandler` called with wrong number of args
  - `handlers.NewComplianceHandler` called with wrong type (*ComplianceService vs *ComplianceRepository)
- `api/handlers/analytics.go`: unused imports (`services`, `models`, `time`)
- `api/handlers/compliance.go`: unused import (`models`)
- `api/handlers/pos.go`: unused import (`context`)
- `api/handlers/inventory.go`: stubbed - only returns mock messages, doesn't accept DB parameter
- `internal/repositories/inventory.go`: unused import (`pgx`)
- `api/services/tigerbeetle.go`: Broken API calls to `bee.NewClient` (wrong signatures)
- `api/services/publisher.go`: `CentrifugoPublisher` not implemented - only has interface
- `internal/services/pos.go`: `ReleaseStock` returns `(int, error)` but caller expects single return
- `internal/services/inventory.go`: `models` import used but not imported properly

## 1.2 Frontend - Pinia vs Zustand Chaos

- **LEGACY Pinia stores still exist in `src/stores/`:**
  - `profile.js` - Legacy profile store with local auth, localStorage persistence
  - `staff.js` - Legacy staff/active user management
  - `cart.js` - Legacy POS cart with multi-tab support
  - `notification.js` - Legacy notification store
  - `prompt.js` - Unused prompt store
  - `sync.js` - Unused sync store
- **NEW Zustand stores exist in `src/features/*/store.ts`:**
  - `auth/store.ts` - Login with PIN, but `initSession` is stubbed
  - `dashboard/store.ts` - STILL USES PINIA (`defineStore`) despite being in new location!
  - `analytics/store.ts` - Zustand but some endpoints are stubbed
  - `compliance/store.ts` - Zustand, wired to API but backend has stubs
  - `inventory/store.ts` - Zustand, wired to API
  - `pos/store.ts` - Zustand, has full cart logic
  - `pharmacy/store.ts` - STILL USES PINIA!
  - `prescriptions/store.ts` - Zustand, wired to API

## 1.3 App.vue - Broken Setup

- Imports `storeToRefs` from `pinia` (not needed with Zustand)
- Uses `useAuthStore()` as if it returns reactive refs (Pinia-style), but Zustand returns plain state
- `onMounted` calls `authStore.initSession()` - which is stubbed

## 1.4 Router - Redirecting to Wrong Login

- `src/router/index.ts` points to `src/features/auth/views/LoginView.vue` (new Zustand login)
- BUT `src/views/LoginView.vue` still exists with legacy Pinia/WatermelonDB logic
- Legacy views in `src/views/` still exist and may be imported by some code

## 1.5 Environment & Security

- `.env` contains HARD-CODED Firebase and Supabase keys that are exposed
- `VITE_API_URL` not defined in `.env`
- `vite.config.ts` hardcodes `proxy: { '/api': 'http://localhost:8080' }` (wrong port, should be 3000)
- No `.env.example` for onboarding

## 1.6 Duplicate/Old Views

- `src/views/LoginView.vue` (legacy with WatermelonDB) vs `src/features/auth/views/LoginView.vue` (new)
- `src/views/HomeView.vue` (legacy)
- Many other `src/views/*.vue` files still exist

## 1.7 Missing Shared UI Components

- `src/shared/ui/Sidebar.vue` - NOT FOUND
- `src/shared/ui/BottomNav.vue` - NOT FOUND
- `src/shared/ui/KpiCard.vue` - EXISTS (only this one exists)
- `src/features/compliance/components/DdaAlertList.vue` - NOT FOUND (imported in HomeView)

## 1.8 Dashboard Store Still Pinia

- `src/features/dashboard/store.ts` is literally a Pinia store (`import { defineStore } from 'pinia'`)
- It should be a Zustand store like all the others

---

# SECTION 2: THE SOLUTION (What We Need To Do)

## Phase 1: Fix Go Backend (CRITICAL - Must Compile)

### Step 1.1: Fix go.mod

- Change `go 1.25.0` → `go 1.23`
- Run `go mod tidy`

### Step 1.2: Fix api/services/publisher.go

- Implement `CentrifugoPublisher` struct
- Implement `NewCentrifugoPublisher()` constructor
- Implement `Publish()` method
- Keep fallback no-op implementation

### Step 1.3: Fix api/services/tigerbeetle.go

- Fix `bee.NewClient` API call (parameters changed in TigerBeetle Go client)
- OR wrap in a conditional/commented block since it's not critical path

### Step 1.4: Fix api/handlers/analytics.go

- Remove unused imports: `services`, `models`, `time`

### Step 1.5: Fix api/handlers/compliance.go

- Remove unused import: `models`

### Step 1.6: Fix api/handlers/pos.go

- Remove unused import: `context`
- Change constructor to accept `*pgxpool.Pool` instead of `*pgx.Conn`
- Implement real ProcessSale logic

### Step 1.7: Fix api/handlers/inventory.go

- Add `DB *pgxpool.Pool` field
- Update constructor to accept `*pgxpool.Pool`
- Implement real AddInventory and SearchMasterCatalog methods

### Step 1.8: Fix internal/repositories/inventory.go

- Remove unused `pgx` import

### Step 1.9: Fix internal/services/pos.go

- Fix `ReleaseStock` return value mismatch

### Step 1.10: Fix internal/services/inventory.go

- Ensure `models` package is imported correctly
- Implement real `ValidateSaleItem` and `ReleaseStock` logic

### Step 1.11: Fix main.go

- Replace `logger.New()` with `app.Use(logger.New())` or remove if Fiber logger not needed
- Fix `NewPOSHandler(state.DB)` - type mismatch (pgxpool vs pgx.Conn)
- Fix `NewInventoryHandler(state.DB)` - now accepts \*pgxpool.Pool
- Fix `NewComplianceHandler(complianceService)` - should pass \*repositories.ComplianceRepository
- Fix `complianceRepo` undefined in setupRoutes - it's defined in main()

### Step 1.12: Build & Verify

- Run `go build .` and fix any remaining errors until it compiles cleanly

## Phase 2: Fix Frontend - Merge Legacy Into Zustand

### Step 2.1: Rewrite features/auth/store.ts (Zustand)

- Merge legacy profile.js logic: address, pharmacy info, persistence
- Merge legacy staff.js logic: active user, role, shifts
- Implement real `initSession`: read token from localStorage, verify with backend `/auth/me`
- Implement proper error handling and loading states
- Ensure all profile fields are available: userId, name, role, pharmacyId, pharmacyName, etc.

### Step 2.2: Rewrite features/dashboard/store.ts (Zustand)

- Convert from Pinia to Zustand
- Wire to `/analytics/dashboard` endpoint
- Remove hardcoded values
- Implement proper loading/error states

### Step 2.3: Rewrite features/pharmacy/store.ts (Zustand)

- Convert from Pinia to Zustand
- Implement real CRUD operations
- Wire to backend endpoints

### Step 2.4: Fix App.vue

- Remove `storeToRefs` from pinia import
- Use Zustand `useAuthStore` correctly (call as function, not reactive refs)
- Remove `Sidebar` and `BottomNav` component imports (they don't exist yet)
- Create inline nav or use a simple layout
- Keep `DDAApprovalModal` only if it exists

### Step 2.5: Create Missing Shared UI Components

- **src/shared/ui/Sidebar.vue**: Simple sidebar with navigation links (Dashboard, POS, Inventory, Analytics, Compliance, Prescriptions)
- **src/shared/ui/BottomNav.vue**: Mobile bottom navigation bar
- **src/shared/ui/Toast.vue**: Wrapper around PrimeVue Toast or simple implementation
- **src/shared/ui/ConfirmDialog.vue**: Simple confirmation dialog

### Step 2.6: Fix Router

- Update all route imports to point to `features/*/views/*.vue`
- Update route guards to work with Zustand auth store (no Pinia `storeToRefs`)
- Remove any imports from `src/views/` (legacy)

### Step 2.7: Fix api.ts

- Already reads from `import.meta.env.VITE_API_URL` with fallback - good
- Add `VITE_API_URL` to `.env`
- Ensure interceptor handles token correctly with Zustand

### Step 2.8: Fix .env

- Add:
  VITE_API_URL=http://localhost:3000/api/v1
  ZITADEL_DOMAIN=http://localhost:8080
- Remove or rotate hardcoded Firebase/Supabase keys (security)
- Create `.env.example` with placeholder values

## Phase 3: Cleanup & Delete Legacy

### Step 3.1: Delete Legacy Stores

- Delete `src/stores/profile.js`
- Delete `src/stores/staff.js`
- Delete `src/stores/cart.js`
- Delete `src/stores/prompt.js`
- Delete `src/stores/sync.js`
- Keep `src/stores/notification.js` if needed by legacy components (or migrate)

### Step 3.2: Delete Legacy Views

- Delete `src/views/LoginView.vue` (or keep as backup, but not imported)
- Delete `src/views/HomeView.vue`
- Delete all `src/views/*.vue` that have `features/*/views/` counterparts
- Keep `src/views/NotFoundView.vue` if it's unique

### Step 3.3: Verify Everything

- `cd core && go build .` - Must succeed with no errors
- `npm run build` - Must succeed with no errors
- Check for any remaining Pinia store imports in the codebase
- Check for any remaining legacy store imports in components

## Phase 4: Real Implementations (Post-Bleeding)

### Step 4.1: Real Analytics Backend

- `/api/v1/analytics/dashboard`: Return real metrics from PostgreSQL
  - todaySales: SUM of sales today
  - activePrescriptions: COUNT of prescriptions with status 'active'
  - lowStockCount: COUNT of inventory items where stock < threshold
  - totalRevenue: SUM of all sales
  - etc.
- Remove mock/hardcoded values from `api/handlers/analytics.go`

### Step 4.2: Real Compliance Backend

- `/api/v1/compliance/dda-logs`: Return actual pending DDA logs
- `/api/v1/compliance/dda-logs/:id/approve`: Update status in DB, log audit trail
- `/api/v1/compliance/dda-logs/:id/reject`: Update status, log reason
- Implement in `internal/repositories/compliance.go` and `internal/services/compliance.go`

### Step 4.3: Real Inventory Backend

- `POST /api/v1/inventory`: Insert new item into DB
- `GET /api/v1/catalog/search`: Search master catalog by name/generic_name
- `GET /api/v1/inventory/:id`: Get single item
- `PATCH /api/v1/inventory/:id/stock`: Update stock
- Implement in `api/handlers/inventory.go` and `internal/repositories/inventory.go`

### Step 4.4: Real POS Backend

- `POST /api/v1/pos/sale`:
  - Validate stock for each item
  - Create sale record (transaction)
  - Deduct stock for each item
  - Return sale ID
- Implement in `api/handlers/pos.go`

### Step 4.5: Real Auth Backend

- `POST /api/v1/auth/login`: Validate PIN, generate JWT with kiosk_id and pharmacy_id
- `GET /api/v1/auth/me`: Validate token, return user profile
- Implement in new `api/handlers/auth.go`
- Wire in `main.go`

---

# SECTION 3: EXECUTION LOG (What's Done)

## DONE 2025-05-15:

1. Created AGENTS.md with full project structure and rules
2. Created this plan.md with complete audit and plan
3. Started Go fixes

## DONE 2026-06-10:

1. Unified TypeScript entrypoints: updated `index.html` to point to `/src/main.ts` and populated `src/main.ts` with all plugin configurations (PrimeVue, FormKit, VueQuery, i18n, etc.).
2. Consolidated Vite configuration: merged PWA, UnoCSS, Babel compiler, and dev server proxy options into `vite.config.ts`, and renamed conflicting `vite.config.js` to `vite.config.js.backup`.
3. Upgraded Babel configuration: updated `.babelrc` to support legacy decorators and loose class properties for compatibility with WatermelonDB.
4. Resolved compilation errors: fixed duplicate declarations of `searchQuery` and `processSale` in `POSView.vue` and properly wired the component's state/events to the Zustand stores.
5. Successfully ran production build and verified the dev server operates correctly on port `3000`.

---

# SECTION 4: FILE INVENTORY

## Go Backend Files (core/)

- `core/main.go` - Entry point, needs handler fixes
- `core/go.mod` - Broken: go 1.25.0
- `core/api/handlers/analytics.go` - Stubbed, unused imports
- `core/api/handlers/compliance.go` - Stubbed, unused imports
- `core/api/handlers/inventory.go` - Stubbed, wrong constructor
- `core/api/handlers/pos.go` - Stubbed, wrong types
- `core/api/handlers/invoice.go` - Needs real implementation
- `core/api/middleware/auth.go` - JWT middleware, looks fine
- `core/api/services/publisher.go` - Interface only, needs impl
- `core/api/services/tigerbeetle.go` - Broken API calls
- `core/api/rpc/rpc.go` - gRPC stub, OK but generated code has TODO
- `core/internal/models/dda_log.go` - Models, OK
- `core/internal/models/sale.go` - Models, OK
- `core/internal/models/inventory.go` - Models, OK
- `core/internal/models/errors.go` - Models, OK
- `core/internal/repositories/analytics.go` - Basic queries, OK
- `core/internal/repositories/compliance.go` - Basic queries, OK
- `core/internal/repositories/inventory.go` - Has unused import
- `core/internal/services/inventory.go` - Has errors
- `core/internal/services/pos.go` - Has errors
- `core/internal/services/compliance.go` - Stubs

## Frontend Files (src/)

- `src/main.ts` - Mounts app, sets up PrimeVue/Pinia - Pinia still imported!
- `src/App.vue` - Uses Pinia-style auth, missing components
- `src/router/index.ts` - Routes to new views, guard uses Zustand
- `src/core/api.ts` - API client, uses Zustand auth store, OK
- `src/stores/*` - ALL LEGACY PINIA, must be deleted or migrated
- `src/features/*/store.ts` - New Zustand stores (some still Pinia!)
- `src/features/*/views/*.vue` - New views
- `src/views/*.vue` - LEGACY VIEWS, must be deleted
- `src/shared/ui/` - Only KpiCard exists, others missing
- `src/components/*.vue` - Old flat components, may be used by legacy views

## Config Files

- `.env` - Hardcoded secrets, VITE_API_URL missing
- `vite.config.ts` - Hardcoded proxy `http://localhost:8080` (wrong port)
- `tsconfig.json` - OK

---

# SECTION 5: NON-NEGOTIABLES

1. NO MOCKS, NO STUBS, NO TODOs. Every piece of code must be real.
2. ALL state management must be Zustand. Pinia must be completely gone.
3. Go backend must compile with ZERO errors.
4. Frontend must build with ZERO errors.
5. ALL models in a single source of truth: `core/internal/models/`
6. API wiring must use environment variables, no hardcoded URLs.
7. Delete all duplicate/legacy files after merging their logic.
8. Document everything in AGENTS.md and plan.md.
9. This is not a prototype. This is production code.
10. Security: Rotate leaked API keys, enforce auth, validate inputs.

---

END OF MASTER PLAN
