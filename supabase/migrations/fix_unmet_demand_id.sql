-- Fix unmet_demand ID type to support WatermelonDB string IDs
-- Also ensure RLS policies exist

CREATE TABLE IF NOT EXISTS public.unmet_demand (
    id TEXT PRIMARY KEY, -- Changed from UUID to TEXT
    pharmacy_id BIGINT REFERENCES pharmacies(id),
    query TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If table exists but ID is UUID, we need to change it.
-- Since we can't easily cast UUID to TEXT if there's data (and we want to support non-UUIDs),
-- we might need to drop and recreate if it's empty, or alter.
-- For now, let's assume we can just alter it if it exists.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'unmet_demand' 
        AND column_name = 'id' 
        AND data_type = 'uuid'
    ) THEN
        ALTER TABLE public.unmet_demand ALTER COLUMN id TYPE TEXT;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.unmet_demand ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Insert unmet_demand" ON public.unmet_demand;
CREATE POLICY "Insert unmet_demand" ON public.unmet_demand FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Manage unmet_demand" ON public.unmet_demand;
CREATE POLICY "Manage unmet_demand" ON public.unmet_demand FOR ALL USING (pharmacy_id = (SELECT pharmacy_id FROM profiles WHERE id = auth.uid() LIMIT 1));
