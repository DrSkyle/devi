# Reference: Financial Ledger Architecture

To ensure strict financial compliance, eliminate race conditions during concurrent point-of-sale executions, and maintain a mathematically verifiable, immutable audit trail, the DEVI platform integrates TigerBeetle as the core financial ledger, operating in conjunction with PostgreSQL.

## Core Concepts

TigerBeetle operates on double-entry accounting principles. Every financial action represents a transfer of value from a source account to a destination account.

### Accounts

Accounts within TigerBeetle represent distinct financial entities or categorization buckets. They are defined by a 128-bit integer (`id`) and a specific `ledger` integer.

#### Account Ledger Taxonomy
- `Ledger 1`: Global Revenue (The overarching pharmacy income).
- `Ledger 2`: Individual Kiosk Registers (Physical cash drawers).
- `Ledger 3`: Cost of Goods Sold (COGS).
- `Ledger 4`: Inventory Asset Value.

#### Account Flags
- `linked`: Indicates the account is part of a broader transactional chain.
- `debits_must_not_exceed_credits`: Enforces strict balance limits (e.g., a cash drawer cannot possess a negative balance).

### Transfers

Transfers represent the atomic movement of value between two accounts.

| Field | Type | Description |
|---|---|---|
| `id` | 128-bit Int | Unique identifier. |
| `debit_account_id` | 128-bit Int | Source of funds. |
| `credit_account_id` | 128-bit Int | Destination of funds. |
| `amount` | 64-bit Int | Monetary value (represented in cents to prevent floating-point inaccuracies). |
| `ledger` | 32-bit Int | Defines the categorical boundaries of the transfer. |
| `code` | 16-bit Int | Business logic categorization (e.g., `1` = Retail Sale, `2` = Refund). |

## Integration with PostgreSQL

While TigerBeetle handles the ultra-fast, high-concurrency numeric ledgers, it does not store relational metadata (e.g., "Which cashier executed this sale?").

The Go-Fiber backend orchestrates the synergy between the two systems:
1. Upon a POS execution, the Go backend initiates a transaction within PostgreSQL, writing the metadata to `sales_log`.
2. Simultaneously, it dispatches the numeric `Transfer` array to TigerBeetle.
3. If TigerBeetle rejects the transfer (e.g., insufficient funds, or a concurrent lock conflict), the PostgreSQL transaction is immediately rolled back, ensuring total parity.
