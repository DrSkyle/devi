# DEVI Pharmacy Enterprise Architecture

## Overview

DEVI is a sovereign, offline-first, real-time pharmacy management platform.
It is designed for high-reliability, compliance-heavy environments with unreliable internet.

## Architecture Pillars

### 1. The Sovereign Backend (`core/`)

- **Language:** Go 1.21+
- **Framework:** Fiber (HTTP), NATS (Event Bus)
- **Database:** PostgreSQL 15 (Primary), TigerBeetle (Financial Ledger)
- **Pattern:** Clean Architecture / Hexagonal

The backend is the single source of truth. It is a stateless, horizontally scalable API that enforces all business rules, compliance logic, and financial integrity.

### 2. The Offline-First Edge (`src/`)

- **Framework:** Vue 3 + Vite
- **State:** Pinia
- **Pattern:** Domain-Driven Design (DDD)

The frontend is a thick client that can operate for days without internet. It syncs with the backend opportunistically.

### 3. The Real-Time Mesh

- **WebSockets:** Centrifugo
- **Events:** NATS JetStream
- **Observability:** SigNoz (OpenTelemetry)

All critical events (sales, DDA alerts, low stock) are propagated in real-time to all connected clients.

### 4. The Intelligence Layer

- **Predictions:** ClickHouse + ML (Time-Series Forecasting)
- **Parsing:** Edge AI (Transformers.js) for OCR/Invoice Parsing
- **Compliance:** Automated DDA Workflows (XState)

## Directory Structure

```
devi/
├── core/                 # The Sovereign Backend (Go)
│   ├── cmd/api/          # Main API server entry point
│   ├── cmd/worker/       # Background worker entry point
│   ├── internal/         # Business logic
│   │   ├── models/       # Domain entities (Sale, Inventory, etc.)
│   │   ├── repositories/ # Data access layer
│   │   ├── services/     # Business use cases
│   │   └── middleware/   # Auth, logging, etc.
│   ├── pkg/              # Shared libraries
│   │   ├── auth/
│   │   ├── logger/
│   │   └── database/
│   └── api/
│       ├── handlers/     # Fiber HTTP handlers
│       └── services/     # Handler-specific services
├── src/                  # The Modern Frontend (Vue 3)
│   ├── infrastructure/   # API clients, external services
│   ├── core/             # Shared utilities, types
│   ├── features/         # Domain modules (DDD)
│   │   ├── auth/
│   │   ├── inventory/
│   │   ├── pos/
│   │   ├── compliance/
│   │   ├── analytics/
│   │   └── prescriptions/
│   └── shared/           # Shared UI components
├── platform/             # Infrastructure as Code (IaC)
│   ├── terraform/
│   └── docker/
├── docs/                 # Architecture Decision Records (ADRs)
└── scripts/
```

## Technology Stack

### Backend

- **Runtime:** Go 1.21+
- **HTTP:** Fiber
- **Database:** PostgreSQL 15 (pgx), TigerBeetle (Ledger)
- **Cache/Queue:** Dragonfly (Redis-compatible)
- **Event Bus:** NATS JetStream
- **Observability:** SigNoz (OpenTelemetry)
- **Auth:** Zitadel (OIDC)
- **Real-Time:** Centrifugo

### Frontend

- **Framework:** Vue 3 + Vite
- **State:** Pinia
- **UI:** PrimeVue 4 + UnoCSS
- **Charts:** Vue3-ApexCharts
- **Validation:** Zod

### Infrastructure

- **Containerization:** Docker, Docker Compose
- **Orchestration:** Kubernetes (planned)
- **CI/CD:** GitHub Actions
- **Cloud:** AWS (planned)

## Data Flow

1. **Sale Process:**
   - Client (Vue) -> POST /api/v1/pos/sale -> Go Backend
   - Backend validates inventory, creates sale record, updates stock.
   - Backend publishes `sale.completed` event to NATS.
   - Worker consumes event, updates TigerBeetle ledger.
   - Centrifugo broadcasts DDA alert if needed.

2. **Offline Sync:**
   - Client saves sale to local WatermelonDB.
   - When online, client syncs backlog to Go Backend.
   - Backend processes sync, resolves conflicts.

3. **Inventory Prediction:**
   - Daily cron job runs ClickHouse query on historical sales.
   - ML model predicts depletion dates.
   - Alerts are pushed to relevant pharmacies via NATS/Centrifugo.

## Key Design Decisions

- **Offline-First:** The app must work without internet. The backend is the source of truth, but the client is the source of action.
- **Event-Driven:** All state changes are events. This enables real-time updates, audit trails, and loose coupling.
- **Financial Integrity:** Every sale is a double-entry transaction in TigerBeetle. No sale is every "lost".
- **Compliance by Default:** DDA workflows are automated and enforced at the API level.
