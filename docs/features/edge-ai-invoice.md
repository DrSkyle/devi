# Feature: Edge AI Invoice Parsing

## Goal

Enable pharmacists to parse supplier invoices (PDF, Excel, images) directly in the browser using Transformers.js, extracting item details without an external API call.

## Architecture

1. **Upload:**
   - Pharmacist drags and drops a file onto the `InventoryOnboardingView`.
   - The file is read client-side using the FileReader API.
2. **OCR & Parsing:**
   - The frontend uses `@xenova/transformers` to run an OCR model (e.g., TrOCR) in the browser.
   - The extracted text is then parsed by a lightweight rule-based engine or a small local LLM to identify drug names, quantities, batch numbers, and expiry dates.
3. **Validation:**
   - The extracted data is presented to the pharmacist in a table format for review and correction.
4. **Submission:**
   - Once approved, the structured data is sent via `POST /api/v1/inventory` to the Go backend, which creates the new inventory items.

## Frontend Implementation

- **Component:** `InvoiceUpload.vue` (in `features/inventory/components/`)
- **Library:** `@xenova/transformers`
- **Worker:** `invoice-parser.worker.ts` (Web Worker to avoid blocking the main thread)

## API Endpoints

- `POST /api/v1/inventory`: Already exists, will be used for bulk creation after parsing.
