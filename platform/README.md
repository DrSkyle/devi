# DEVI Pharmacy Infrastructure

This directory contains the Infrastructure as Code (IaC) and configuration for the DEVI platform.

## Services

- **PostgreSQL 15:** Primary transactional database.
- **NATS JetStream:** Event bus and message queue.
- **Dragonfly:** Redis-compatible cache and background job store.
- **Centrifugo:** Real-time WebSocket server.
- **ClickHouse:** Data warehouse for analytics and ML.
- **Vector:** Log and metric pipeline.
- **Appsmith:** Admin dashboard (internal use).
- **TigerBeetle:** Financial double-entry ledger.

## Usage

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f <service_name>
```

## TigerBeetle

TigerBeetle is used for the financial ledger. It ensures that every sale is recorded as a double-entry transaction, guaranteeing financial integrity.

To initialize the TigerBeetle cluster, run:

```bash
docker-compose up -d tigerbeetle
```

## Environment Variables

Copy `.env.example` to `.env` and configure the variables for your local environment.
