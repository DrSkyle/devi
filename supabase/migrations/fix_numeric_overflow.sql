-- Fix Numeric Field Overflow Errors
-- This script ensures that phone number columns are TEXT, not INTEGER.
-- 10-digit phone numbers (e.g., 9800000000) exceed the maximum value for INTEGER (2,147,483,647).

BEGIN;

-- 1. Customers
ALTER TABLE public.customers ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- 2. Suppliers
ALTER TABLE public.suppliers ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- 3. Staff
ALTER TABLE public.staff ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- 4. Pharmacies
ALTER TABLE public.pharmacies ALTER COLUMN phone TYPE TEXT USING phone::TEXT;

-- 5. Ensure Inventory prices/quantities are safe
-- Changing to NUMERIC ensures they can handle large values and decimals
ALTER TABLE public.inventory ALTER COLUMN quantity TYPE NUMERIC USING quantity::NUMERIC;
ALTER TABLE public.inventory ALTER COLUMN purchase_price TYPE NUMERIC USING purchase_price::NUMERIC;
ALTER TABLE public.inventory ALTER COLUMN selling_price TYPE NUMERIC USING selling_price::NUMERIC;

-- 6. Ensure Sales totals are safe
ALTER TABLE public.sales ALTER COLUMN total TYPE NUMERIC USING total::NUMERIC;
ALTER TABLE public.sales ALTER COLUMN subtotal TYPE NUMERIC USING subtotal::NUMERIC;

COMMIT;
