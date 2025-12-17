-- 1. Cleanup (Try to drop old ones just in case, but we will use a new name)
DROP FUNCTION IF EXISTS process_return(TEXT, TEXT, UUID, BIGINT, JSONB, DECIMAL);
DROP FUNCTION IF EXISTS process_return(UUID, TEXT, UUID, BIGINT, JSONB, DECIMAL);

-- 2. Create Returns Table (if not exists)
CREATE TABLE IF NOT EXISTS returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pharmacy_id BIGINT REFERENCES pharmacies(id),
    original_sale_id TEXT REFERENCES sales(_id),
    bill_number TEXT,
    user_id UUID REFERENCES auth.users(id),
    items JSONB,
    total_return_value DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Drop existing policies to avoid "policy already exists" error if re-running
DROP POLICY IF EXISTS "Insert returns" ON returns;
DROP POLICY IF EXISTS "Manage returns" ON returns;

CREATE POLICY "Insert returns" ON returns FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Manage returns" ON returns FOR ALL USING (pharmacy_id = get_my_pharmacy_id());

-- 5. Process Return RPC V2 (Renamed to avoid ambiguity)
CREATE OR REPLACE FUNCTION process_return_v2(
    p_original_sale_id TEXT,
    p_bill_number TEXT,
    p_user_id UUID,
    p_pharmacy_id BIGINT,
    p_items_to_return JSONB,
    p_total_return_value DECIMAL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_return_id UUID;
    v_item JSONB;
    v_qty INTEGER;
    v_inventory_id TEXT;
    v_current_sale_total DECIMAL;
    v_new_sale_total DECIMAL;
BEGIN
    -- Insert into returns
    INSERT INTO returns (
        pharmacy_id,
        original_sale_id,
        bill_number,
        user_id,
        items,
        total_return_value
    ) VALUES (
        p_pharmacy_id,
        p_original_sale_id,
        p_bill_number,
        p_user_id,
        p_items_to_return,
        p_total_return_value
    ) RETURNING id INTO v_return_id;

    -- Restock Inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items_to_return)
    LOOP
        v_qty := (v_item->>'quantity')::INTEGER;
        v_inventory_id := v_item->>'id';
        
        IF v_inventory_id IS NOT NULL THEN
            UPDATE inventory
            SET quantity = quantity + v_qty,
                updated_at = NOW()
            WHERE _id = v_inventory_id AND pharmacy_id = p_pharmacy_id;
        END IF;
    END LOOP;

    -- Update Original Sale
    SELECT total INTO v_current_sale_total FROM sales WHERE _id = p_original_sale_id;
    
    IF v_current_sale_total IS NULL THEN v_current_sale_total := 0; END IF;

    v_new_sale_total := v_current_sale_total - p_total_return_value;

    UPDATE sales
    SET total = v_new_sale_total,
        status = CASE WHEN v_new_sale_total <= 0 THEN 'returned' ELSE 'partial_return' END,
        updated_at = NOW()
    WHERE _id = p_original_sale_id;

    RETURN v_return_id;
END;
$$;
