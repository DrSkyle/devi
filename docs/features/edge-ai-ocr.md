# Feature: Edge AI Invoice Parsing (OCR)

## Visual Aim

A "Drag & Drop" interface on the `InventoryOnboardingView` where a pharmacist uploads a PDF/Excel invoice. The system instantly parses the file, extracts drug names, quantities, batch numbers, and expiry dates, and presents them in a clean, editable table for confirmation before adding to the stock.

## Technical Architecture

1. **Frontend (Vue 3):** Uses a custom `FileUpload` component to accept `.pdf`, `.xlsx`, and `.jpg` files. Calls `POST /api/v1/invoices/parse`.
2. **Backend (Go):** The `invoice.go` handler accepts the file, saves it to a temporary location, and then spawns a goroutine to process it with PaddleOCR or a similar library. It then performs a fuzzy match against the `master_catalog` to extract the exact drug names and details.
3. **Data Flow:** `Invoice File` -> `POST /api/v1/invoices/parse` -> Goroutine -> OCR -> Fuzzy Match -> JSON Response -> Frontend Table

## API Endpoints

- `POST /api/v1/invoices/parse`: Accepts multipart form data (the invoice file).

## Implementation Notes

- We will use `github.com/otiai10/imgconv` for image preprocessing if needed.
- PaddleOCR (or similar) will be run as a separate microservice or via a Go binding.
