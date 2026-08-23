# Reference: API Specification

The DEVI platform communicates via a RESTful architecture built upon the high-performance Go-Fiber framework. All authenticated requests must include a valid JSON Web Token (JWT) issued by the Zitadel IAM provider within the `Authorization` header.

## Base URL
`http://<domain>/api/v1`

---

## 1. Inventory Endpoints

### `GET /catalog/search`
**Access Level:** Public (Authenticated Network)
Executes a fuzzy search against the centralized `master_catalog`. Primarily utilized for initial local database population and fallback querying.

**Query Parameters:**
- `q` (string): The search query (generic or brand name).

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "generic_name": "Paracetamol",
    "brand_name": "Panadol 500mg",
    "is_dda": false
  }
]
```

### `POST /inventory`
**Access Level:** `OWNER`, `PHARMACIST`
Registers new stock quantities for a specific pharmaceutical product within a designated pharmacy location.

**Request Body:**
```json
{
  "product_id": "uuid",
  "batch_number": "B-10992",
  "quantity": 100,
  "unit_price": 50.00,
  "expiry_date": "2027-12-31"
}
```

**Response (201 Created):**
```json
{
  "message": "Inventory successfully registered."
}
```

### `POST /inventory/upload-invoice`
**Access Level:** `OWNER`
Accepts a structured payload derived from the Edge AI optical character recognition pipeline for bulk stock ingestion.

**Request Body:**
```json
{
  "invoice_id": "INV-88219",
  "items": [
    {
      "product_id": "uuid",
      "batch_number": "A-821",
      "quantity": 50,
      "unit_price": 12.50
    }
  ]
}
```

---

## 2. Point of Sale Endpoints

### `POST /pos/sale`
**Access Level:** `CASHIER`, `PHARMACIST`
Initiates a retail transaction. If the payload contains items flagged as `is_dda: true`, the endpoint initiates the asynchronous Centrifugo DDA approval pipeline rather than immediately committing the ledger entries.

**Request Body:**
```json
{
  "cart_items": [
    {
      "inventory_id": "uuid",
      "quantity": 2
    }
  ]
}
```

**Response (200 OK) - Standard Sale:**
```json
{
  "status": "completed",
  "transaction_id": "uuid"
}
```

**Response (202 Accepted) - DDA Sale:**
```json
{
  "status": "pending_approval",
  "message": "DDA substance detected. Push notification dispatched to Pharmacist."
}
```

---

## Error Handling
The API utilizes standard HTTP status codes. Error responses adhere to the following structure:

```json
{
  "error": "Insufficient privileges to execute this operation."
}
```
