-- Fix RLS Helper Function
-- The function get_my_pharmacy_id() causes 'invalid input syntax for type uuid'
-- because it compares staff.id (TEXT) with auth.uid() (UUID).
-- We must cast auth.uid() to TEXT for the staff table query.

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
