# DEVI Pharmacy - Production Readiness Checklist

This document outlines the final steps required to get the DEVI platform into a production-ready state.

## Phase 1: Infrastructure Hardening (1 Week)

- [ ] **Kubernetes (K8s) Deployment**:
  - Create `k8s/` directory with `deployment.yaml`, `service.yaml`, `ingress.yaml`, and `secrets.yaml`.
  - Deploy the Go backend, PostgreSQL, ClickHouse, NATS, and TigerBeetle on a K8s cluster (e.g., AWS EKS or GCP GKE).
- [ ] **CI/CD Pipeline**:
  - Enhance `.github/workflows/ci-cd.yml` to build Docker images for the Go backend and push them to a container registry (e.g., Docker Hub, GitHub Container Registry).
  - Add a deployment step to update the K8s pods.
- [ ] **Secrets Management**:
  - Move all hardcoded secrets (e.g., `CENTRIFUGO_API_KEY`, `DATABASE_URL`) to a secure vault (e.g., AWS Secrets Manager, HashiCorp Vault).
  - Update the `main.go` to read secrets from the environment variables injected by K8s.

## Phase 2: Security & Compliance (2 Weeks)

- [ ] **SSL/TLS**:
  - Configure `cert-manager` in K8s to automatically generate and renew SSL certificates for all domains.
  - Enforce HTTPS for all API and WebSocket connections.
- [ ] **HIPAA/GDPR Compliance**:
  - Conduct a data flow audit to ensure all PHI (Protected Health Information) is encrypted at rest and in transit.
  - Implement data retention policies and a "right to be forgotten" mechanism.
- [ ] **Penetration Testing**:
  - Hire a third-party security firm to perform a penetration test on the API.
  - Fix all high and critical vulnerabilities.

## Phase 3: Performance & Scalability (1 Week)

- [ ] **Database Indexing**:
  - Add secondary indexes to frequently queried columns (e.g., `pharmacy_id`, `created_at`, `status`).
  - Optimize ClickHouse queries for the analytics dashboard.
- [ ] **Caching**:
  - Implement a Redis/Dragonfly cache for frequently accessed data (e.g., user profiles, inventory lists).
  - Add cache invalidation logic to ensure data consistency.
- [ ] **Load Testing**:
  - Use a tool like `k6` or `Artillery` to simulate high traffic on the API.
  - Identify bottlenecks and optimize the Go backend (e.g., connection pooling, query optimization).

## Phase 4: Monitoring & Alerting (3 Days)

- [ ] **Observability Stack**:
  - Deploy SigNoz or Grafana/Prometheus to monitor the health of the system.
  - Set up alerts for high error rates, high latency, and low disk space.
- [ ] **Logging**:
  - Integrate the `Vector.dev` log pipeline to ship all application logs to ClickHouse or a dedicated log management service (e.g., Datadog, Splunk).
  - Ensure that all logs are structured (JSON) and include correlation IDs.

## Phase 5: Documentation & Handover (1 Week)

- [ ] **API Documentation**:
  - Use a tool like `swaggo` to automatically generate OpenAPI (Swagger) documentation for the Go backend.
  - Host the documentation on a dedicated page (e.g., `docs.devi.co`).
- [ ] **Runbooks**:
  - Write runbooks for common operational tasks (e.g., "How to restore a database backup", "How to scale the K8s cluster").
- [ ] **Onboarding Guide**:
  - Create a guide for new developers to set up their local environment and understand the architecture.
