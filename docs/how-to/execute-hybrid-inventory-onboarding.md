# How-To: Execute Hybrid Inventory Onboarding

This guide details the procedure for expediting inventory ingestion by utilizing the Edge Artificial Intelligence Optical Character Recognition (OCR) pipeline. This process allows administrative personnel to scan physical supplier invoices, automatically extracting structured line items without transmitting sensitive data to external inference servers.

## Requirements
- Access to the administrative dashboard or an authorized Edge Client operating under the `OWNER` or `PHARMACIST` role.
- A physical or digital copy of a supplier invoice.
- A device equipped with a functional camera (if executing on a physical kiosk) or file-system access (if executing via a desktop browser).

## Procedure

### Step 1: Access the Onboarding Interface
Navigate to the `/inventory/onboarding` view within the application. This interface is specifically designed for high-throughput data extraction.

### Step 2: Capture the Invoice
The mechanism for capturing the invoice depends on the hardware execution context:

- **Native Tablet/Kiosk:** Depress the primary action button to invoke the `@capacitor/camera` native plugin. Capture a high-resolution, well-illuminated photograph of the physical invoice.
- **Desktop Browser:** The native camera hook will gracefully degrade. You will be prompted to select an image file (JPEG, PNG) from your local file system.

### Step 3: Edge AI Processing
Upon capturing the image, the interface will enter a processing state. The following operations occur automatically and locally:

1. A background Web Worker (`ocr.worker.js`) is initialized to prevent main-thread UI blocking.
2. The HuggingFace `donut-base-finetuned-cord-v2` transformer model is instantiated via WebAssembly (WASM).
3. The image is processed through the model to extract Document Parsing text.

### Step 4: Verification and Synchronization
The extracted data is parsed into a structured tabular format within the UI. Due to the inherent variability of OCR algorithms, manual verification is mandatory.

1. Review the populated data grid containing Item Names, Quantities, Prices, and Batch Numbers.
2. Click on any specific cell to manually correct extraction anomalies.
3. Once verified, depress the **"Sync to Ledger"** action button. The validated items will be persisted to the local WatermelonDB instance and subsequently synchronized with the central PostgreSQL repository.
