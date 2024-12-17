-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'device_settings' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE device_settings 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

        -- Create updated_at trigger function if it doesn't exist
        CREATE OR REPLACE FUNCTION update_device_settings_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- Add trigger for device_settings if it doesn't exist
        DROP TRIGGER IF EXISTS update_device_settings_updated_at ON device_settings;
        CREATE TRIGGER update_device_settings_updated_at
            BEFORE UPDATE ON device_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_device_settings_updated_at();
    END IF;
END $$; 