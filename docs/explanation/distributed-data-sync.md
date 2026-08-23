# Explanation: Distributed Data Synchronization

The DEVI architecture requires real-time querying capabilities against a master catalog exceeding 100,000 pharmaceutical items, while simultaneously ensuring system resilience against network interruptions. This document outlines the rationale behind the hybrid WatermelonDB and Fuse.js data layer.

## The Inadequacy of Cloud-Only Relational Queries

A traditional web application architecture relays user search queries (e.g., typing "Para" into an input field) to a backend server. The backend executes a `LIKE` or Full-Text Search (FTS) query against a relational database (PostgreSQL) and returns the payload.

In a high-throughput physical retail environment, this architecture is fundamentally flawed:
1. **Typing Latency:** The round-trip network latency degrades the user experience, causing the interface to feel sluggish and unresponsive compared to legacy native desktop applications.
2. **Single Point of Failure:** Total reliance on the backend prevents cashiers from appending items to the cart during brief internet outages.

## The WatermelonDB Offline-First Paradigm

To achieve "zero-latency" interactions, the DEVI Edge Client utilizes WatermelonDB. 

WatermelonDB is an observable, reactive database built atop SQLite (in native Capacitor environments) and IndexedDB (in browser environments). It is specifically engineered to handle tens of thousands of records smoothly on resource-constrained mobile hardware.

1. **Initial Hydration:** Upon first boot, the application pulls the necessary subsets of the PostgreSQL `master_catalog` and caches them locally within WatermelonDB.
2. **Local Execution:** All Point-of-Sale operations are executed exclusively against this local datastore.
3. **Eventual Consistency:** WatermelonDB maintains an internal log of mutations (created, updated, deleted records). When network connectivity is optimal, a background synchronization process relays these mutations to the Go-Fiber backend for final reconciliation.

## Sub-Millisecond Fuzzy Matching (Fuse.js)

While WatermelonDB handles the relational mapping and synchronization, executing complex fuzzy-search algorithms directly within SQLite is computationally expensive on edge devices.

To achieve instant keystroke resolution, the DEVI platform employs `Fuse.js`.

The local catalog is loaded into a volatile memory array. `Fuse.js` executes a bitap algorithm to perform approximate string matching directly within the JavaScript engine. This architectural division of labor (WatermelonDB for persistent synchronization, Fuse.js for volatile memory fuzzy-matching) ensures that the POS terminal operates at native speeds, drastically improving retail checkout efficiency.
