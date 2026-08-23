-- DEVI Enterprise Platform Core Schema
-- Tailored for PostgreSQL 15+

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Pharmacy (The physical branch)
CREATE TABLE IF NOT EXISTS pharmacies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    owner_phone VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. Kiosk (The registered tablet hardware)
CREATE TABLE IF NOT EXISTS kiosks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    hardware_mac VARCHAR(255) UNIQUE NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Staff Profile (The Kiosk PIN users)
CREATE TABLE IF NOT EXISTS staff_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('OWNER', 'PHARMACIST', 'CASHIER')),
    hashed_pin VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20), -- Optional, only needed for OTP onboarding
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Global Master Catalog (The Pokedex)
CREATE TABLE IF NOT EXISTS master_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    is_narcotic BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT FALSE,
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', brand_name || ' ' || generic_name)) STORED
);

CREATE INDEX idx_master_search ON master_catalog USING GIN(search_vector);

-- 5. Pharmacy Inventory (Sub-Unit Logic)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE CASCADE,
    master_id UUID REFERENCES master_catalog(id) ON DELETE RESTRICT,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    supplier_id UUID, -- References a suppliers table later
    
    -- Sub-Unit Dispensing Logic (e.g. 1 Box = 5 Strips = 50 Tablets)
    total_tablets INTEGER NOT NULL DEFAULT 0,
    tablets_per_strip INTEGER NOT NULL DEFAULT 10,
    strips_per_box INTEGER NOT NULL DEFAULT 10,
    
    -- Financials (NPR stored as cents)
    cost_price_cents BIGINT NOT NULL,
    selling_price_cents BIGINT NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. POS Sales Ledger
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pharmacy_id UUID REFERENCES pharmacies(id),
    kiosk_id UUID REFERENCES kiosks(id),
    staff_id UUID REFERENCES staff_profiles(id),
    total_amount_cents BIGINT NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'CREDIT', 'FONEPAY', 'ESEWA')),
    is_synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity_tablets INTEGER NOT NULL,
    unit_price_cents BIGINT NOT NULL,
    total_price_cents BIGINT NOT NULL
);

-- 7. Audit Log (For Asynchronous DDA Compliance)
CREATE TABLE IF NOT EXISTS dda_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_item_id UUID REFERENCES sale_items(id) ON DELETE RESTRICT,
    cashier_id UUID REFERENCES staff_profiles(id),
    pharmacist_id UUID REFERENCES staff_profiles(id), -- Null until approved
    status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    approved_at TIMESTAMP WITH TIME ZONE
);
