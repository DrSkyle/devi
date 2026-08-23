# Feature: Edge AI Invoice Parsing (OCR)

## Visual Aim

A "Drag & Drop" interface on the `InventoryOnboardingView` (`/inventory/onboarding`) where a pharmacist uploads a PDF/Excel invoice. The system instantly parses the file, extracts drug names, quantities, batch numbers, and expiry dates, and presents them in a clean, editable table to confirm before adding to stock.

## Technical Architecture

1. **Frontend (Vue 3):**
   - Uses a custom `FileUpload` component to accept `.pdf`, `.xlsx`, and `.jpg` files.
   - Upon upload, the frontend calls `POST /api/v1/invoices/parse` with the file.
2. **Backend (Go):**
   - The `invoice.go` handler accepts the file and saves it to a temporary location.
   - Spawns a background goroutine (`go ParseInvoice(...)`) to avoid blocking the request.
   - The goroutine uses PaddleOCR (or a similar OCR engine) to extract text from images/PDFs.
   - Extracts drug names via a fuzzy matching algorithm against our `master_catalog`.
   - Returns the structured JSON to the client.
3. **Data Flow:**
   - `Invoice` file -> `POST /api/v1/invoices/parse` -> Goroutine -> OCR -> Fuzzy Match -> JSON Response

## Key Benefits

- **Zero Manual Entry:** Eliminates the biggest pain point in pharmacy inventory management.
- **Error Reduction:** Fuzzy matching against the `master_catalog` prevents typos and ensures consistency.
- **Speed:** Processes a 100-item invoice in less than 10 seconds.

## API Endpoints (To be implemented in `core/api/handlers/invoice.go`)

- `POST /api/v1/invoices/parse`: Accepts multipart form data (the invoice file).
