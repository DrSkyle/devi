-- SQLite Schema for Devi Local
-- Version: 1.0.0

PRAGMA foreign_keys = ON;

-- 1. PHARMACIES (Single Tenant in Local Mode, but kept structure for compatibility)
CREATE TABLE IF NOT EXISTS pharmacies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id TEXT, -- UUID
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    pan_number TEXT,
    vat_number TEXT,
    province TEXT,
    district TEXT,
    city TEXT,
    tole TEXT,
    pharmacy_code TEXT UNIQUE,
    latitude REAL,
    longitude REAL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. STAFF (Replacing Profiles/Staff split with unified Local Staff)
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    role TEXT DEFAULT 'cashier', -- 'admin', 'cashier', 'pharmacist'
    pin_hash TEXT, -- Storing hashed PIN locally
    phone TEXT,
    email TEXT,
    is_active INTEGER DEFAULT 1, -- Boolean 0/1
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 3. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    _id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 4. INVENTORY
CREATE TABLE IF NOT EXISTS inventory (
    _id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    brand_name TEXT,
    form TEXT,
    category TEXT,
    strength TEXT,
    batch_number TEXT,
    expiry_date TEXT, -- ISO Date String YYYY-MM-DD
    cost_price REAL,
    selling_price REAL,
    mrp REAL,
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER,
    rack TEXT,
    shelf_location TEXT,
    supplier_id TEXT,
    is_controlled INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 5. SALES
CREATE TABLE IF NOT EXISTS sales (
    _id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    customer_id TEXT REFERENCES customers(_id),
    staff_id TEXT REFERENCES staff(id), -- Linked to local staff
    staff_name TEXT,
    total REAL,
    subtotal REAL,
    tax_total REAL,
    discount REAL,
    payment_method TEXT,
    status TEXT,
    items TEXT, -- JSON String
    bill_number TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 6. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
    _id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 7. PRESCRIPTIONS
CREATE TABLE IF NOT EXISTS prescriptions (
    _id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    patient_name TEXT,
    doctor_name TEXT,
    image_path TEXT, -- Local File Path
    items TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- 8. UNMET DEMAND (For Network Broadcasting)
CREATE TABLE IF NOT EXISTS unmet_demand (
    id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    query TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 9. DDA LOGS (Narcotics/Controlled)
CREATE TABLE IF NOT EXISTS dda_logs (
    id TEXT PRIMARY KEY, -- UUID
    pharmacy_id INTEGER REFERENCES pharmacies(id),
    medicine_name TEXT,
    quantity_dispensed INTEGER,
    patient_name TEXT,
    doctor_name TEXT,
    staff_name TEXT,
    sale_id TEXT REFERENCES sales(_id),
    previous_hash TEXT,
    current_hash TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for Speed
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
