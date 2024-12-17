-- Add unique constraint to device_settings table
DO $$ 
BEGIN
    -- First, check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'device_settings_icealert_id_key'
    ) THEN
        -- Add unique constraint to icealert_id
        ALTER TABLE device_settings ADD CONSTRAINT device_settings_icealert_id_key UNIQUE (icealert_id);
    END IF;
END $$;

-- Add primary key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'device_settings_pkey'
    ) THEN
        ALTER TABLE device_settings ADD PRIMARY KEY (id);
    END IF;
END $$; 