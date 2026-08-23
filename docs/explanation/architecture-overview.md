# Explanation: Architecture Overview

This document elucidates the foundational design principles of the DEVI Pharmacy Point-of-Sale (POS) platform. Understanding the rationale behind these architectural decisions is critical for maintaining and extending the ecosystem.

## The Backend-for-Frontend (BFF) Paradigm

The DEVI architecture strictly enforces a separation of concerns between the presentation layer (Vue 3/Capacitor) and the business logic layer (Go-Fiber). The Go backend functions as a Backend-for-Frontend.

### Rationale
Retail pharmacy environments are characterized by heterogeneous hardware (legacy desktop PCs alongside modern iPads). A monolithic architecture coupling the presentation logic to the database restricts the deployment flexibility required for physical kiosk provisioning. By exposing a strictly defined REST API, the Go backend allows the Vue edge clients to evolve independently, enabling native device integrations (haptics, camera APIs) without compromising backend stability.

## The Offline-First Edge Philosophy

A critical constraint in regional pharmacy operations is unreliable internet connectivity. A traditional cloud-dependent POS system presents unacceptable operational risks; a loss of connectivity halts retail operations entirely.

### Local Datastore Synchronization
To mitigate this risk, DEVI employs an "Offline-First" strategy utilizing WatermelonDB on the edge clients.

WatermelonDB maintains a local SQLite (or IndexedDB) replica of the centralized PostgreSQL database. All cashier operations (inventory searches, cart additions, and POS transactions) are executed against this local replica, guaranteeing sub-millisecond latency regardless of network state.

When connectivity is established, WatermelonDB executes an asynchronous synchronization payload against the Go backend, reconciling local transactions with the master PostgreSQL database.

## Edge Search Optimization (Fuse.js vs. FTS5)

While PostgreSQL offers robust Full-Text Search (FTS5) capabilities, relying on server-side search introduces unacceptable network latency during high-throughput retail checkout scenarios.

### Rationale for Fuse.js
To ensure instant feedback, the `MobileTerminalView` integrates `Fuse.js`. Upon application initialization, the master catalog is loaded into a local memory cache. Fuse.js executes highly optimized fuzzy string matching directly within the browser's JavaScript engine (or the device's V8 runtime). This architecture guarantees that cashiers experience zero search latency, even when searching across tens of thousands of pharmaceutical items, while completely eliminating search-query load on the central PostgreSQL database.
