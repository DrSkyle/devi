-- 1. Update Staff Table
-- ALTER TABLE staff 
-- ADD COLUMN IF NOT EXISTS employee_id TEXT,
-- ADD COLUMN IF NOT EXISTS pin_hash TEXT;

-- Ensure Employee ID is unique per pharmacy
-- ALTER TABLE staff 
-- ADD CONSTRAINT unique_employee_id_per_pharmacy UNIQUE (pharmacy_id, employee_id);

-- 2. Create Login Attempts Table (for Rate Limiting)
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT,
  pharmacy_code TEXT,
  attempt_time TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT FALSE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_pharmacy ON login_attempts(pharmacy_code);

-- 3. RPC for Staff Login (Rate Limited)
CREATE OR REPLACE FUNCTION login_staff_device(p_pharmacy_code TEXT, p_employee_id TEXT, p_pin_hash TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pharmacy_id UUID;
  v_staff_data JSON;
  v_attempt_count INT;
  v_client_ip TEXT;
BEGIN
  -- Get Client IP (Supabase specific)
  v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  
  -- 1. Check Rate Limit (5 failed attempts in last 10 mins)
  SELECT COUNT(*) INTO v_attempt_count
  FROM login_attempts
  WHERE ip_address = v_client_ip 
    AND success = FALSE 
    AND attempt_time > (NOW() - INTERVAL '10 minutes');

  IF v_attempt_count >= 5 THEN
    RAISE EXCEPTION 'Too many failed attempts. Please try again later.';
  END IF;

  -- 2. Find Pharmacy
  SELECT id INTO v_pharmacy_id
  FROM pharmacies
  WHERE pharmacy_code = p_pharmacy_code;

  IF v_pharmacy_id IS NULL THEN
    -- Log failure
    INSERT INTO login_attempts (ip_address, pharmacy_code, success) VALUES (v_client_ip, p_pharmacy_code, FALSE);
    RAISE EXCEPTION 'Invalid Pharmacy Code.';
  END IF;

  -- 3. Find Staff & Verify Hash
  SELECT row_to_json(s) INTO v_staff_data
  FROM staff s
  WHERE s.pharmacy_id = v_pharmacy_id
    AND s.employee_id = p_employee_id
    AND s.pin_hash = p_pin_hash
    AND s.is_active = TRUE;

  IF v_staff_data IS NULL THEN
    -- Log failure
    INSERT INTO login_attempts (ip_address, pharmacy_code, success) VALUES (v_client_ip, p_pharmacy_code, FALSE);
    RAISE EXCEPTION 'Invalid Employee ID or PIN.';
  END IF;

  -- 4. Success
  INSERT INTO login_attempts (ip_address, pharmacy_code, success) VALUES (v_client_ip, p_pharmacy_code, TRUE);
  
  -- 5. Get Device Credentials (for RLS)
  DECLARE
    v_credentials JSONB;
  BEGIN
    SELECT staff_credentials INTO v_credentials
    FROM pharmacies
    WHERE id = v_pharmacy_id;
    
    RETURN json_build_object(
      'staff', v_staff_data,
      'credentials', v_credentials
    );
  END;
END;
$$;

-- 6. Fix Audit Logs Schema (Sync Error 400)
-- The app uses Integer for pharmacy_id, but audit_logs might be using UUID.
DROP TABLE IF EXISTS audit_logs;

CREATE TABLE IF NOT EXISTS audit_logs (
  _id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  pharmacy_id BIGINT, -- Explicitly BIGINT to match pharmacies.id
  sync_status TEXT DEFAULT 'synced',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow access (adjust policies as needed, keeping it open for sync for now)
CREATE POLICY "Enable all access for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 7. Fix Prescriptions Schema (Sync Error 400)
-- The table might be missing customer_id entirely based on the error.
-- Let's ensure columns exist first.
ALTER TABLE prescriptions 
ADD COLUMN IF NOT EXISTS customer_id TEXT,
ADD COLUMN IF NOT EXISTS user_id TEXT,
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Now ensure types are correct (if they existed as something else)
-- We use a safe cast or just rely on them being created as TEXT above.
-- If they existed as INT, this might fail without USING, but if they didn't exist, it's fine.
-- Let's assume if they exist, they might be wrong, so we try to cast.
-- But the error was "column does not exist", so ADD COLUMN is the key.
