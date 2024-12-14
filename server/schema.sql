-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    part_number VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE,
    ice_alert_serial VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create readings table for sensor data
CREATE TABLE IF NOT EXISTS readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    flow_rate DECIMAL(5,2),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS alert_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT true,
    temperature_min DECIMAL(5,2) DEFAULT 20.0,
    temperature_max DECIMAL(5,2) DEFAULT 25.0,
    humidity_min DECIMAL(5,2) DEFAULT 45.0,
    humidity_max DECIMAL(5,2) DEFAULT 55.0,
    flow_rate_min DECIMAL(5,2) DEFAULT 1.5,
    flow_rate_max DECIMAL(5,2) DEFAULT 3.0,
    flow_rate_warning_threshold INTEGER DEFAULT 120,
    flow_rate_critical_threshold INTEGER DEFAULT 240,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_recipients table
CREATE TABLE IF NOT EXISTS alert_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    value DECIMAL(5,2),
    threshold VARCHAR(50),
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create combination_alerts table
CREATE TABLE IF NOT EXISTS combination_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    conditions JSONB NOT NULL,
    frequency VARCHAR(20) DEFAULT 'immediate',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_readings_device_id ON readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_settings_device_id ON alert_settings(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_device_id ON alert_recipients(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_device_id ON alert_history(device_id);
CREATE INDEX IF NOT EXISTS idx_combination_alerts_device_id ON combination_alerts(device_id);

-- Create helpful views
CREATE OR REPLACE VIEW latest_readings AS
SELECT DISTINCT ON (device_id)
    r.*
FROM readings r
ORDER BY device_id, timestamp DESC;

CREATE OR REPLACE VIEW device_status AS
SELECT 
    d.id,
    d.name,
    d.location,
    lr.temperature,
    lr.humidity,
    lr.flow_rate,
    lr.timestamp as last_reading_time,
    CASE 
        WHEN lr.timestamp < NOW() - INTERVAL '5 minutes' THEN 'offline'
        ELSE 'online'
    END as status
FROM devices d
LEFT JOIN latest_readings lr ON d.id = lr.device_id;

-- Enable Row Level Security
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE combination_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON devices
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON readings
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON alert_settings
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON alert_recipients
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON alert_history
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON combination_alerts
    FOR SELECT USING (true);

-- Enable realtime subscriptions for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE devices;
ALTER PUBLICATION supabase_realtime ADD TABLE readings;
ALTER PUBLICATION supabase_realtime ADD TABLE alert_history;