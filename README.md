# DEVI Pharmacy

> The Sovereign, Offline-First, Real-Time Pharmacy Management Platform

## What is DEVI?

DEVI is a next-generation pharmacy management system built for high-compliance, low-connectivity environments. It combines the reliability of an offline-first thick client with the power of a modern, event-driven backend.

## Features

- **Offline-First POS:** Process sales, manage inventory, and handle prescriptions even without internet.
- **Real-Time Compliance:** Automated DDA (Drug & Drug Administration) workflows with pharmacist approvals.
- **Financial Integrity:** Every transaction is recorded in a double-entry ledger (TigerBeetle).
- **Predictive Inventory:** AI-driven forecasts to prevent stockouts.
- **Edge AI:** Parse supplier invoices directly in the browser.
- **Multi-Platform:** Web, Desktop (Tauri), and Mobile (Capacitor).

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Go 1.21+

### 1. Start the Infrastructure

```bash
docker-compose -f core/docker-compose.yml up -d
```

### 2. Run the Backend

```bash
cd core
cp .env.example .env
make run
```

### 3. Run the Frontend

```bash
npm install
npm run dev
```

## Documentation

- [Architecture Overview](docs/ARCHITECTURE.md)
- [API Specification](docs/API_SPEC.md)
- [Contributing](docs/CONTRIBUTING.md)

## License

MIT
