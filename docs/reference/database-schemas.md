# Reference: Database Schemas

The DEVI architecture utilizes PostgreSQL as the primary centralized relational datastore. Edge devices (tablets and desktops) utilize a local IndexedDB/SQLite structure orchestrated via WatermelonDB. This document defines the centralized schemas.

## PostgreSQL Tables

### `pharmacies`
Stores the hierarchical root entities representing physical retail locations.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier. |
| `name` | VARCHAR | NOT NULL | Registered business name. |
| `address` | TEXT | | Physical location. |
| `license_number` | VARCHAR | UNIQUE | State or national operational license. |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation time. |

### `kiosks`
Registries of physical hardware devices authorized to communicate with the backend.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier. |
| `pharmacy_id` | UUID | FOREIGN KEY | Links to `pharmacies.id`. |
| `mac_address` | VARCHAR | UNIQUE | Hardware networking address. |
| `device_name` | VARCHAR | | Human-readable alias (e.g., 'Counter 1'). |
| `status` | VARCHAR | DEFAULT 'INACTIVE' | Operational state (`ACTIVE`, `INACTIVE`, `REVOKED`). |

### `master_catalog`
The global repository of all recognized pharmaceutical products.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier. |
| `generic_name` | VARCHAR | NOT NULL | Chemical composition. |
| `brand_name` | VARCHAR | NOT NULL | Marketed nomenclature. |
| `manufacturer` | VARCHAR | | Producing entity. |
| `is_dda` | BOOLEAN | DEFAULT FALSE | Flag indicating if the substance is restricted by the Department of Drug Administration. |

### `inventory`
Localized stock levels specific to an individual pharmacy.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier. |
| `pharmacy_id` | UUID | FOREIGN KEY | Links to `pharmacies.id`. |
| `product_id` | UUID | FOREIGN KEY | Links to `master_catalog.id`. |
| `batch_number` | VARCHAR | NOT NULL | Manufacturing batch identifier. |
| `quantity` | INTEGER | DEFAULT 0 | Current stock level (Strips/Units). |
| `unit_price` | DECIMAL(10,2)| NOT NULL | Retail cost. |
| `expiry_date` | DATE | NOT NULL | Expiration threshold. |

### `dda_audit_logs`
Immutable registry of dispensed controlled substances.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY | Unique identifier. |
| `pharmacy_id` | UUID | FOREIGN KEY | Links to `pharmacies.id`. |
| `kiosk_id` | UUID | FOREIGN KEY | Originating terminal. |
| `pharmacist_id` | VARCHAR | NOT NULL | Zitadel User ID of the approving pharmacist. |
| `product_id` | UUID | FOREIGN KEY | Links to `master_catalog.id`. |
| `quantity` | INTEGER | NOT NULL | Volume dispensed. |
| `biometric_hash`| TEXT | | SimpleWebAuthn cryptographic proof. |
| `status` | VARCHAR | DEFAULT 'PENDING' | Transaction state (`PENDING`, `APPROVED`, `REJECTED`). |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Initialization time. |

## WatermelonDB Synchronization

The edge clients maintain a structural mirror of the `master_catalog` and `inventory` tables. Changes applied locally are pushed to the Go-Fiber backend via the `/api/v1/sync` endpoint, where they are resolved and persisted to PostgreSQL.
