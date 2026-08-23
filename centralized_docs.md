# DEVI Pharmacy - Enterprise Platform Documentation

## Executive Summary

This codebase has been transformed from a legacy Supabase/WatermelonDB application into a sovereign, enterprise-grade, offline-first pharmacy management system. The architecture follows Clean Code (Go) and Domain-Driven Design (Vue 3) principles, designed for high-stakes, regulatory-heavy environments with unreliable connectivity.

## Architecture Overview

- **Backend (Go):** Clean Architecture (Handlers -> Services -> Repositories). Fiber for HTTP, NATS JetStream for events, TigerBeetle for financial ledger.
- **Frontend (Vue 3):** Domain-Driven Design (DDD). Zustand for state, axios for API, PrimeVue + UnoCSS for UI.
- **Infrastructure:** Dockerized, ready for Kubernetes. Includes PostgreSQL, NATS, Dragonfly, Centrifugo, ClickHouse, and TigerBeetle.

## Key Features Implemented

### 1. Hardened Core (Phase 1)

- **Robust `inventory.go`**: Business logic separated from handlers. Atomic stock updates with negative stock prevention.
- **TigerBeetle Integration**: Financial ledger integration ready for production.
- **Event-Driven Architecture**: Kafka-like (NATS) for decoupling services.

### 2. Modern Frontend (Phase 2)

- **DDD Structure**: `features/` folder with clear domain boundaries (auth, inventory, pos, compliance, etc.).
- **Modern State (Zustand)**: Lightweight, performant, and DevTools-friendly.
- **Modern API (Axios)**: Centralized API client with interceptors for auth and errors.
- **Modern UI (PrimeVue 4 + UnoCSS)**: Professional, high-performance component library.

### 3. High-Value Features (Phase 3)

- **DDA Compliance**: Automated D-flagged sale workflows with pharmacist approval via Centrifugo real-time notifications.
- **Predictive Inventory**: Framework for ClickHouse-based forecasting.
- **Edge AI**: Architecture for `@xenova/transformers` to parse invoices locally in the browser.

## Security & Compliance

- **Data Sovereignty**: Edge AI and offline-first design ensure proprietary data never leaves the device unnecessarily.
- **Biometric Auth**: SimpleWebAuthn for DDA approvals.
- **Hardware-Bound JWTs**: Prevents unauthorized device access.
- **Double-Entry Accounting**: TigerBeetle guarantees financial integrity.

## Getting Started

1. `docker-compose -f core/docker-compose.yml up -d`
2. `cd core && go run .`
3. `npm install && npm run dev`

## Future Roadmap

- Kubernetes deployment
- Full ClickHouse analytics dashboard
- AI-driven prescription validation
- Marketplace for supplier integration
