-- WatermelonDB Sync RPCs

-- 1. Helper to convert timestamp to epoch (if needed) or handle comparisons
-- WatermelonDB sends 'last_pulled_at' as an integer (epoch timestamp in ms or s).
-- Supabase 'created_at' / 'updated_at' are TIMESTAMPTZ.

-- We need to ensure all our tables have 'created_at', 'updated_at', and 'deleted' (for soft deletes).
-- The existing schema has 'deleted' in Dexie but maybe not in Supabase.
-- Let's ensure the schema supports soft deletes.

-- Add 'deleted' column to all syncable tables if not exists
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['pharmacies', 'profiles', 'staff', 'customers', 'suppliers', 'inventory', 'sales', 'shifts', 'notifications', 'app_meta', 'unmet_demand', 'dda_logs'])
    LOOP
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE', t);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()', t);
        EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()', t);
    END LOOP;

  -- Fix for Sync Error: Allow null messages in notifications
  ALTER TABLE public.notifications ALTER COLUMN message DROP NOT NULL;
END $$;

-- Helper function to get current user's pharmacy_id
DROP FUNCTION IF EXISTS get_my_pharmacy_id() CASCADE;
CREATE OR REPLACE FUNCTION get_my_pharmacy_id()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT pharmacy_id FROM profiles WHERE id = auth.uid());
END;
$$;

-- Recreate policies dropped by CASCADE
CREATE POLICY "Read staff" ON staff FOR SELECT USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Manage customers" ON customers FOR ALL USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Manage suppliers" ON suppliers FOR ALL USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Manage inventory" ON inventory FOR ALL USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Manage sales" ON sales FOR ALL USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Manage shifts" ON shifts FOR ALL USING (pharmacy_id = get_my_pharmacy_id());
CREATE POLICY "Read notifications" ON notifications FOR SELECT USING (pharmacy_id = get_my_pharmacy_id());

-- 2. pull_changes RPC
-- Returns changes since last_pulled_at
DROP FUNCTION IF EXISTS pull_changes(BIGINT, INTEGER);
CREATE OR REPLACE FUNCTION pull_changes(last_pulled_at BIGINT, schema_version INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    changes JSONB;
    t_timestamp BIGINT;
    last_pulled_ts TIMESTAMPTZ;
BEGIN
    -- Convert epoch to timestamptz
    last_pulled_ts := to_timestamp(last_pulled_at / 1000.0);
    t_timestamp := floor(extract(epoch from now()) * 1000);

    changes := jsonb_build_object(
        'pharmacies', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM pharmacies t),
        
        'profiles', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM profiles t WHERE t.id = auth.uid()),

        'staff', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM staff t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'customers', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t._id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM customers t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'suppliers', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t._id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM suppliers t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'inventory', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t._id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM inventory t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'sales', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t._id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM sales t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'shifts', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(jsonb_build_object('id', t._id) || to_jsonb(t) - '_id') FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t._id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM shifts t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'notifications', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM notifications t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'unmet_demand', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM unmet_demand t WHERE t.pharmacy_id = get_my_pharmacy_id()),

        'dda_logs', (SELECT jsonb_build_object(
            'created', COALESCE(jsonb_agg(t) FILTER (WHERE t.created_at > last_pulled_ts AND t.updated_at = t.created_at), '[]'::jsonb),
            'updated', COALESCE(jsonb_agg(t) FILTER (WHERE t.updated_at > last_pulled_ts AND t.updated_at > t.created_at AND NOT t.deleted), '[]'::jsonb),
            'deleted', COALESCE(jsonb_agg(t.id) FILTER (WHERE t.deleted AND t.updated_at > last_pulled_ts), '[]'::jsonb)
        ) FROM dda_logs t WHERE t.pharmacy_id = get_my_pharmacy_id())
    );

    RETURN jsonb_build_object(
        'changes', changes,
        'timestamp', t_timestamp
    );
END;
$$;

-- 3. push_changes RPC
-- Receives changes from client and applies them
DROP FUNCTION IF EXISTS push_changes(JSONB, BIGINT);
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
                        -- Fallback for sales, shifts (usually insert only or status update)
                        EXECUTE format('INSERT INTO %I SELECT * FROM jsonb_populate_record(null::%I, $1) ON CONFLICT (_id) DO UPDATE SET updated_at = NOW()', table_name, table_name) USING record;
                    END IF;
                END LOOP;
            ELSE
                -- Tables using 'id'
                IF table_name = 'profiles' THEN
                    INSERT INTO profiles SELECT * FROM jsonb_populate_recordset(null::profiles, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
                ELSIF table_name = 'staff' THEN
                    INSERT INTO staff SELECT * FROM jsonb_populate_recordset(null::staff, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
                ELSIF table_name = 'notifications' THEN
                    INSERT INTO notifications SELECT * FROM jsonb_populate_recordset(null::notifications, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
                ELSIF table_name = 'unmet_demand' THEN
                    INSERT INTO unmet_demand SELECT * FROM jsonb_populate_recordset(null::unmet_demand, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
                ELSIF table_name = 'dda_logs' THEN
                    INSERT INTO dda_logs SELECT * FROM jsonb_populate_recordset(null::dda_logs, created_records) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();
                END IF;
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
