# Feature: Automated DDA Compliance Workflow

## Goal

Automate the entire Drug and Drug Administration (DDA) compliance workflow, from D-flagged item detection to pharmacist approval and real-time cashier alerts.

## Architecture

1. **D-flag Detection:**
   - During a sale in the `POSView`, if an item is flagged as `isDDA=true` (from the master catalog), the `processSale` API call is made as normal.
   - The backend transaction succeeds, and the sale is recorded.
2. **Audit Log Creation:**
   - As part of the same transaction, a `PENDING` entry is created in the `dda_audit_logs` table.
3. **Real-Time Alert:**
   - Post-transaction, the backend publishes a `DDA_APPROVAL_REQUIRED` event to the `dda_approvals:{pharmacy_id}` Centrifugo channel.
   - All connected pharmacist dashboards (via the `DDAApprovalModal`) receive the alert in real-time.
4. **Pharmacist Approval:**
   - The pharmacist reviews the sale in the `DDAApprovalModal`.
   - They click "Approve" or "Reject".
   - This sends a `POST /api/v1/compliance/dda/approve` or `reject` request.
5. **Status Update:**
   - The backend updates the `dda_audit_logs` entry to `APPROVED` or `REJECTED`.
   - A success/rejection event is published back to the cashier's kiosk.

## API Endpoints

- `POST /api/v1/pos/sale`: Modified to create the DDA log.
- `POST /api/v1/compliance/dda/approve`: Approves a pending DDA request.
- `POST /api/v1/compliance/dda/reject`: Rejects a pending DDA request.
- `GET /api/v1/compliance/dda/pending`: Lists all pending DDA requests for a pharmacy.

## Frontend Implementation

- **Component:** `DDAApprovalModal.vue` (Refactored to use Zustand)
- **Store:** `features/compliance/store.ts`
- **Real-Time:** Centrifugo subscription in `App.vue` (already set up)
