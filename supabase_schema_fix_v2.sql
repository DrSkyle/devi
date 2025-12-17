-- 1. Helper Function to prevent RLS Recursion
-- This function gets the pharmacy_id for the current user (admin or staff) 
-- securely, bypassing RLS policies to avoid infinite loops.
DROP FUNCTION IF EXISTS public.get_my_pharmacy_id() CASCADE;
CREATE OR REPLACE FUNCTION public.get_my_pharmacy_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT pharmacy_id FROM staff WHERE id = auth.uid()
  UNION ALL
  SELECT pharmacy_id FROM profiles WHERE id = auth.uid()
  LIMIT 1;
$$;

-- 2. Fix Missing Columns (Based on error logs)
-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS allergies TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS batch_no TEXT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS vat_percent DECIMAL(5,2) DEFAULT 0;

-- Suppliers
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Shifts (Previous fixes)
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS opening_float DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS closing_cash DECIMAL(10,2) DEFAULT 0;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS staff_name TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 3. Create Notifications Table (If not exists)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id BIGINT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Fix RLS Policies (Relaxed for Sync Stability)

-- STAFF Table
DROP POLICY IF EXISTS "Enable read access for staff" ON staff;
DROP POLICY IF EXISTS "Enable insert for admins" ON staff;
DROP POLICY IF EXISTS "Enable update for admins" ON staff;
DROP POLICY IF EXISTS "Enable update for self" ON staff;
DROP POLICY IF EXISTS "Enable insert for self" ON staff;

CREATE POLICY "Enable read access for staff" ON staff
    FOR SELECT
    USING (pharmacy_id = get_my_pharmacy_id());

CREATE POLICY "Enable insert for admins" ON staff
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Enable insert for self" ON staff
    FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Enable update for admins" ON staff
    FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Enable update for self" ON staff
    FOR UPDATE
    USING (id = auth.uid());

-- SALES Table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sales;
DROP POLICY IF EXISTS "Enable read access for pharmacy sales" ON sales;

CREATE POLICY "Enable insert for authenticated users" ON sales
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for pharmacy sales" ON sales
    FOR SELECT
    USING (pharmacy_id = get_my_pharmacy_id());

-- SUPPLIERS Table
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for pharmacy suppliers" ON suppliers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON suppliers;
DROP POLICY IF EXISTS "Enable read/update/delete for pharmacy suppliers" ON suppliers;

CREATE POLICY "Enable insert for authenticated users" ON suppliers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read/update/delete for pharmacy suppliers" ON suppliers
    FOR ALL
    USING (pharmacy_id = get_my_pharmacy_id());
    
-- CUSTOMERS Table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for pharmacy customers" ON customers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON customers;
DROP POLICY IF EXISTS "Enable read/update/delete for pharmacy customers" ON customers;

CREATE POLICY "Enable insert for authenticated users" ON customers
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read/update/delete for pharmacy customers" ON customers
    FOR ALL
    USING (pharmacy_id = get_my_pharmacy_id());

-- INVENTORY Table
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for pharmacy inventory" ON inventory;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON inventory;
DROP POLICY IF EXISTS "Enable read/update/delete for pharmacy inventory" ON inventory;

CREATE POLICY "Enable insert for authenticated users" ON inventory
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable read/update/delete for pharmacy inventory" ON inventory
    FOR ALL
    USING (pharmacy_id = get_my_pharmacy_id());

-- NOTIFICATIONS Table
DROP POLICY IF EXISTS "Enable read access for all users in same pharmacy" ON notifications;
DROP POLICY IF EXISTS "Enable insert for admins only" ON notifications;

CREATE POLICY "Enable read access for all users in same pharmacy" ON notifications
    FOR SELECT
    USING (pharmacy_id = get_my_pharmacy_id());

CREATE POLICY "Enable insert for admins only" ON notifications
    FOR INSERT
    WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- SHIFTS Table
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON shifts;
DROP POLICY IF EXISTS "Enable update for own shifts" ON shifts;
DROP POLICY IF EXISTS "Enable read access for own shifts" ON shifts;

CREATE POLICY "Enable insert for authenticated users" ON shifts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for own shifts" ON shifts
    FOR UPDATE
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Enable read access for own shifts" ON shifts
    FOR SELECT
    USING (auth.uid() = user_id OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
