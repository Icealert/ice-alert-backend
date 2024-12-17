-- Create exec_sql function for schema management
CREATE OR REPLACE FUNCTION exec_sql(query text)
RETURNS text AS $func$
BEGIN
    EXECUTE query;
    RETURN 'OK';
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_device_settings_updated_at()
RETURNS TRIGGER AS $func$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$func$ language 'plpgsql';

-- Create device_settings table
CREATE TABLE IF NOT EXISTS device_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    icealert_id VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(255),
    location VARCHAR(255),
    part_number VARCHAR(100),
    serial_number VARCHAR(100),
    temperature_min NUMERIC(5,2) DEFAULT 20.0,
    temperature_max NUMERIC(5,2) DEFAULT 25.0,
    humidity_min NUMERIC(5,2) DEFAULT 45.0,
    humidity_max NUMERIC(5,2) DEFAULT 55.0,
    flow_rate_min NUMERIC(5,2) DEFAULT 1.5,
    flow_rate_max NUMERIC(5,2) DEFAULT 3.0,
    flow_rate_warning_hours INT4 DEFAULT 2,
    flow_rate_critical_hours INT4 DEFAULT 4,
    email_alerts_enabled BOOL DEFAULT true,
    temperature_alert_enabled BOOL DEFAULT true,
    temperature_alert_threshold NUMERIC(5,2),
    humidity_alert_enabled BOOL DEFAULT true,
    humidity_alert_threshold NUMERIC(5,2),
    flow_rate_alert_enabled BOOL DEFAULT true,
    no_flow_alert_minutes INT4 DEFAULT 30,
    alert_frequency VARCHAR(50) DEFAULT 'immediate',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create device_data table
CREATE TABLE IF NOT EXISTS device_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    icealert_id VARCHAR(255) REFERENCES device_settings(icealert_id),
    temperature NUMERIC(5,2),
    temperature_timestamp TIMESTAMPTZ,
    humidity NUMERIC(5,2),
    humidity_timestamp TIMESTAMPTZ,
    flow_rate NUMERIC(5,2),
    flow_rate_timestamp TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id VARCHAR(255) REFERENCES device_settings(icealert_id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT,
    value NUMERIC(5,2),
    threshold VARCHAR(50),
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_device_data_icealert_id ON device_data(icealert_id);
CREATE INDEX IF NOT EXISTS idx_device_data_created_at ON device_data(created_at);
CREATE INDEX IF NOT EXISTS idx_device_settings_icealert_id ON device_settings(icealert_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_device_id ON alert_history(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON alert_history(sent_at);

-- Enable Row Level Security
ALTER TABLE device_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON device_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON device_data
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON alert_history
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON device_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON device_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only" ON alert_history
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE device_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE device_data;
ALTER PUBLICATION supabase_realtime ADD TABLE alert_history;

-- Add trigger for device_settings
DROP TRIGGER IF EXISTS update_device_settings_updated_at ON device_settings;
CREATE TRIGGER update_device_settings_updated_at
    BEFORE UPDATE ON device_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_device_settings_updated_at();