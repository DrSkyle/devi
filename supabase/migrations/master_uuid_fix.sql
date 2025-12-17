-- MASTER UUID FIX SCRIPT
-- This script combines all previous fixes into one guaranteed execution path.
-- It fixes 'invalid input syntax for type uuid' by:
-- 1. Converting all necessary columns to TEXT.
-- 2. Fixing the RLS helper function to handle TEXT IDs.
-- 3. Updating the push_changes RPC.

BEGIN;

-- ==========================================
-- 1. FIX RLS HELPER FUNCTION (CRITICAL)
-- ==========================================
-- This was the hidden cause of the error.
CREATE OR REPLACE FUNCTION public.get_my_pharmacy_id()
RETURNS BIGINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  -- Cast auth.uid() to text for staff table (which now uses text IDs)
  SELECT pharmacy_id FROM staff WHERE id = auth.uid()::text
  UNION ALL
  -- Keep original comparison for profiles table (which still uses UUIDs)
  SELECT pharmacy_id FROM profiles WHERE id = auth.uid()
  LIMIT 1;
$$;

-- ==========================================
-- 2. PREPARE TABLES (Drop Policies)
-- ==========================================
DROP POLICY IF EXISTS "Self update staff" ON public.staff;
DROP POLICY IF EXISTS "Self insert staff" ON public.staff;

-- ==========================================
-- 3. ALTER COLUMNS TO TEXT
-- ==========================================

-- Staff
ALTER TABLE public.staff ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.staff ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Notifications
ALTER TABLE public.notifications ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.notifications ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- Shifts
ALTER TABLE public.shifts ALTER COLUMN staff_id TYPE TEXT USING staff_id::TEXT;

-- DDA Logs
ALTER TABLE public.dda_logs ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.dda_logs ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.dda_logs ALTER COLUMN sale_id TYPE TEXT USING sale_id::TEXT;

-- Unmet Demand
ALTER TABLE public.unmet_demand ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.unmet_demand ALTER COLUMN id TYPE TEXT USING id::TEXT;

-- ==========================================
-- 4. RECREATE POLICIES
-- ==========================================
CREATE POLICY "Self update staff" ON public.staff FOR UPDATE USING (id = auth.uid()::text);
CREATE POLICY "Self insert staff" ON public.staff FOR INSERT WITH CHECK (id = auth.uid()::text);

-- ==========================================
-- 5. UPDATE PUSH_CHANGES RPC
-- ==========================================
CREATE OR REPLACE FUNCTION push_changes(changes JSONB, last_pulled_at BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    table_name TEXT;
    change_set JSONB;
    record JSONB;
    created_records JSONB;
    updated_records JSONB;
    deleted_ids JSONB;
BEGIN
    -- Iterate over each table in the changes object
    FOR table_name, change_set IN SELECT * FROM jsonb_each(changes)
    LOOP
        created_records := change_set->'created';
        updated_records := change_set->'updated';
        deleted_ids := change_set->'deleted';

        -- Handle Created
        IF jsonb_array_length(created_records) > 0 THEN
            -- Map 'id' to '_id' for tables that use _id
            IF table_name IN ('customers', 'suppliers', 'inventory', 'sales', 'shifts') THEN
                FOR record IN SELECT * FROM jsonb_array_elements(created_records)
                LOOP
                    record := record - 'id' || jsonb_build_object('_id', record->>'id');
                    
                    IF table_name = 'customers' THEN
                        INSERT INTO customers SELECT * FROM jsonb_populate_record(null::customers, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address, allergies = EXCLUDED.allergies, balance = EXCLUDED.balance, updated_at = NOW();
                    ELSIF table_name = 'inventory' THEN
                        INSERT INTO inventory SELECT * FROM jsonb_populate_record(null::inventory, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, brand_name = EXCLUDED.brand_name, quantity = EXCLUDED.quantity, purchase_price = EXCLUDED.purchase_price, selling_price = EXCLUDED.selling_price, shelf_location = EXCLUDED.shelf_location, batch_no = EXCLUDED.batch_no, expiry_date = EXCLUDED.expiry_date, updated_at = NOW();
                    ELSIF table_name = 'suppliers' THEN
                        INSERT INTO suppliers SELECT * FROM jsonb_populate_record(null::suppliers, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, phone = EXCLUDED.phone, balance = EXCLUDED.balance, updated_at = NOW();
                    ELSE
                        -- Fallback for sales, shifts
                        EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) ON CONFLICT (_id) DO UPDATE SET updated_at = NOW()', table_name, table_name) USING record;
                    END IF;
                END LOOP;
            ELSE
                -- Tables using 'id' (profiles, staff, notifications, dda_logs, unmet_demand)
                -- Now that all these IDs are TEXT, this works fine.
                INSERT INTO profiles SELECT * FROM jsonb_populate_recordset(null::profiles, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW() WHERE table_name = 'profiles';
                INSERT INTO staff SELECT * FROM jsonb_populate_recordset(null::staff, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW() WHERE table_name = 'staff';
                INSERT INTO notifications SELECT * FROM jsonb_populate_recordset(null::notifications, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW() WHERE table_name = 'notifications';
                INSERT INTO unmet_demand SELECT * FROM jsonb_populate_recordset(null::unmet_demand, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW() WHERE table_name = 'unmet_demand';
                INSERT INTO dda_logs SELECT * FROM jsonb_populate_recordset(null::dda_logs, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW() WHERE table_name = 'dda_logs';
            END IF;
        END IF;

        -- Handle Updated
        IF jsonb_array_length(updated_records) > 0 THEN
            FOR record IN SELECT * FROM jsonb_array_elements(updated_records)
            LOOP
                IF table_name IN ('customers', 'suppliers', 'inventory', 'sales', 'shifts') THEN
                     record := record - 'id' || jsonb_build_object('_id', record->>'id');
                     
                     IF table_name = 'customers' THEN
                        INSERT INTO customers SELECT * FROM jsonb_populate_record(null::customers, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, phone = EXCLUDED.phone, address = EXCLUDED.address, allergies = EXCLUDED.allergies, balance = EXCLUDED.balance, updated_at = NOW();
                     ELSIF table_name = 'inventory' THEN
                        INSERT INTO inventory SELECT * FROM jsonb_populate_record(null::inventory, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, brand_name = EXCLUDED.brand_name, quantity = EXCLUDED.quantity, purchase_price = EXCLUDED.purchase_price, selling_price = EXCLUDED.selling_price, shelf_location = EXCLUDED.shelf_location, batch_no = EXCLUDED.batch_no, expiry_date = EXCLUDED.expiry_date, updated_at = NOW();
                     ELSIF table_name = 'suppliers' THEN
                        INSERT INTO suppliers SELECT * FROM jsonb_populate_record(null::suppliers, record)
                        ON CONFLICT (_id) DO UPDATE SET
                            name = EXCLUDED.name, phone = EXCLUDED.phone, balance = EXCLUDED.balance, updated_at = NOW();
                     ELSE
                        EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) ON CONFLICT (_id) DO UPDATE SET updated_at = NOW()', table_name, table_name) USING record;
                     END IF;
                ELSE
                     EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) ON CONFLICT (id) DO UPDATE SET updated_at = NOW()', table_name, table_name) USING record;
                END IF;
            END LOOP;
        END IF;

        -- Handle Deleted (Soft Delete)
        IF jsonb_array_length(deleted_ids) > 0 THEN
             IF table_name IN ('customers', 'suppliers', 'inventory', 'sales', 'shifts') THEN
                EXECUTE format('UPDATE %I SET deleted = TRUE, updated_at = NOW() WHERE _id::text IN (SELECT value FROM jsonb_array_elements_text($1))', table_name) USING deleted_ids;
             ELSE
                EXECUTE format('UPDATE %I SET deleted = TRUE, updated_at = NOW() WHERE id::text IN (SELECT value FROM jsonb_array_elements_text($1))', table_name) USING deleted_ids;
             END IF;
        END IF;
    END LOOP;
END;
$$;

COMMIT;
