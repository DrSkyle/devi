# Tutorial: Local Environment Setup

This tutorial will guide you through the process of standing up the complete DEVI Pharmacy POS architecture on your local development environment. By the end of this tutorial, you will have a functional, interconnected ecosystem comprising the backend microservices, event bus, double-entry financial ledger, and data warehouse.

## Prerequisites

Ensure the following dependencies are installed on your local workstation:
- Docker Desktop (or OrbStack for macOS)
- Docker Compose v2.0+
- Go 1.21+
- Node.js 18.0+

## Step 1: Initialize the Core Infrastructure

The DEVI architecture relies heavily on containerized infrastructure to orchestrate the database, event bus, and telemetry pipelines. 

Navigate to the `core/` directory and execute the Docker Compose initialization command:

```bash
cd core
docker-compose up -d postgres nats dragonfly clickhouse vector
```

This command provisions the following services:
1. **PostgreSQL**: The primary relational database containing `pharmacies`, `kiosks`, and `master_catalog`.
2. **NATS JetStream**: The high-performance distributed event bus for inter-service messaging.
3. **Dragonfly**: The Redis-compatible, multi-threaded memory store for background job queues.
4. **ClickHouse & Vector**: The observability data warehouse and Write-Ahead Log (WAL) telemetry pipeline.

To verify successful initialization, execute:

```bash
docker ps
```

Ensure all target containers exhibit a `Up` status.

## Step 2: Initialize the Real-Time Messaging Server

The DEVI platform enforces strict compliance for Department of Drug Administration (DDA) restricted substances through real-time biometric authorization. This necessitates a dedicated WebSocket server.

Start the Centrifugo messaging server:

```bash
docker-compose up -d centrifugo
```

## Step 3: Initialize the Financial Ledger

TigerBeetle is the designated double-entry accounting engine responsible for immutable transaction ledgers.

Navigate to the `ledger/` directory and execute the initialization script:

```bash
cd ../ledger
./init_ledger.sh
```

*Note: If the initialization script is absent, you must pull the pre-compiled TigerBeetle binary for your respective operating system architecture.*

## Step 4: Launch the Go Backend

The core application programming interface (API) is constructed utilizing the Go-Fiber web framework.

Return to the `core/` directory and execute the application:

```bash
cd ../core
go run main.go
```

The server should output initialization logs confirming successful connections to PostgreSQL, NATS, and the initialization of the OpenTelemetry pipeline. The API will bind to `localhost:3000` by default.

## Summary

You have successfully established the foundational infrastructure for the DEVI platform. You are now prepared to compile the edge clients and initialize the Identity and Access Management (IAM) provider. Proceed to **Tutorial 02: Compiling Edge Clients**.
