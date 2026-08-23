# Reference: Event Bus Topology

The DEVI architecture employs a hybrid messaging topology to ensure reliable internal microservice communication and low-latency client-facing telemetry.

## Internal Messaging: NATS JetStream

NATS JetStream serves as the persistent, distributed log for the Go backend ecosystem. It is utilized for asynchronous task delegation (e.g., triggering the TigerBeetle ledger reconciliations or emitting analytic events).

### Subject Taxonomy

All subjects follow a hierarchical structure: `devi.<domain>.<action>`

- `devi.pos.sale.completed`: Emitted upon successful ledger commitment of a retail transaction. Payload contains the transaction UUID and total monetary value.
- `devi.inventory.stock.depleted`: Emitted when an inventory decrement operation results in a quantity of zero.
- `devi.security.dda.escalation`: Emitted when a cashier initiates a DDA substance transaction.

### Stream Configurations

- **Stream Name:** `DEVI_EVENTS`
- **Subjects:** `devi.>`
- **Retention Policy:** WorkQueue (Each event is processed exactly once by a consumer group).

## Client-Facing Messaging: Centrifugo

Centrifugo is utilized exclusively for real-time WebSocket communication connecting the backend infrastructure directly to the Edge Clients (Vue 3 applications). It circumvents polling overhead and enables the instant push notifications required for biometric DDA approvals.

### Namespace Configuration

Centrifugo operates on defined namespaces. The primary namespace for compliance is `dda_approvals`.

### Channel Topology

Channels are scoped geographically to prevent cross-contamination of authorization requests between distinct pharmacy locations.

- **Channel Syntax:** `dda_approvals:<pharmacy_uuid>`
- **Example:** `dda_approvals:f47ac10b-58cc-4372-a567-0e02b2c3d479`

### DDA Approval Payload Structure

When the Go Backend publishes an event to a specific pharmacy's Centrifugo channel, the payload adheres to the following structure:

```json
{
  "request_id": "uuid",
  "kiosk_id": "uuid",
  "kiosk_name": "Counter 1",
  "items": [
    {
      "name": "Diazepam 5mg",
      "quantity": 1
    }
  ],
  "timestamp": 1715367822
}
```

Edge clients authenticating via JWTs containing the `PHARMACIST` role are authorized to subscribe to their respective pharmacy's channel and intercept these payloads.
