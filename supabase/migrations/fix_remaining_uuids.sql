-- FIX REMAINING UUID TABLES
-- Changes 'id' and related foreign keys to TEXT for prescriptions, transactions, and returns.
-- This allows WatermelonDB generated IDs (16 chars) to be synced.

BEGIN;

-- ==========================================
-- PRESCRIPTIONS
-- ==========================================
ALTER TABLE public.prescriptions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.prescriptions ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.prescriptions ALTER COLUMN pharmacy_id TYPE TEXT USING pharmacy_id::TEXT;
ALTER TABLE public.prescriptions ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- ==========================================
-- TRANSACTIONS
-- ==========================================
ALTER TABLE public.transactions ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.transactions ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.transactions ALTER COLUMN sale_id TYPE TEXT USING sale_id::TEXT;
ALTER TABLE public.transactions ALTER COLUMN pharmacy_id TYPE TEXT USING pharmacy_id::TEXT;
ALTER TABLE public.transactions ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- ==========================================
-- RETURNS
-- ==========================================
ALTER TABLE public.returns ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.returns ALTER COLUMN id TYPE TEXT USING id::TEXT;
ALTER TABLE public.returns ALTER COLUMN sale_id TYPE TEXT USING sale_id::TEXT;
ALTER TABLE public.returns ALTER COLUMN pharmacy_id TYPE TEXT USING pharmacy_id::TEXT;
ALTER TABLE public.returns ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

COMMIT;
