-- Create devices table
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    part_number VARCHAR(50),
    serial_number VARCHAR(50) UNIQUE,
    ice_alert_serial VARCHAR(50) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create readings table
CREATE TABLE IF NOT EXISTS readings (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    flow_rate DECIMAL(5,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS alert_settings (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id) UNIQUE,
    enabled BOOLEAN DEFAULT false,
    recipients JSONB DEFAULT '[]'::jsonb,
    conditions JSONB DEFAULT '{
        "temperature": {
            "enabled": false,
            "outOfRange": false,
            "threshold": false,
            "thresholdValue": 25,
            "frequency": "immediate"
        },
        "humidity": {
            "enabled": false,
            "outOfRange": false,
            "threshold": false,
            "thresholdValue": 50,
            "frequency": "immediate"
        },
        "flowRate": {
            "enabled": false,
            "outOfRange": false,
            "noFlow": false,
            "noFlowDuration": 5,
            "frequency": "immediate"
        }
    }'::jsonb,
    combination_alerts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(id),
    alert_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    value DECIMAL(10,2),
    threshold VARCHAR(50),
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create latest_readings view
CREATE OR REPLACE VIEW latest_readings AS
SELECT DISTINCT ON (device_id)
    r.id,
    r.device_id,
    r.temperature,
    r.humidity,
    r.flow_rate,
    r.timestamp,
    r.created_at
FROM readings r
ORDER BY device_id, timestamp DESC;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_readings_device_id ON readings(device_id);
CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_alert_history_device_id ON alert_history(device_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_sent_at ON alert_history(sent_at);

-- Add triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON devices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_alert_settings_updated_at
    BEFORE UPDATE ON alert_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 