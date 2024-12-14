-- Insert a test device
INSERT INTO devices (name, location, part_number, serial_number, ice_alert_serial)
VALUES (
    'Test Device 1',
    'Lab Room A',
    'ICE-001',
    'SN001',
    'IA001'
) RETURNING id;

-- Insert some test readings (using the device_id from above)
WITH device AS (
    SELECT id FROM devices WHERE serial_number = 'SN001'
)
INSERT INTO readings (device_id, temperature, humidity, flow_rate, timestamp)
SELECT 
    device.id,
    22.5 + (random() * 5 - 2.5),  -- temperature between 20-25°C
    50.0 + (random() * 10 - 5),   -- humidity between 45-55%
    2.0 + (random() * 1),         -- flow rate between 2-3 L/min
    NOW() - (interval '1 hour' * generate_series(24, 0, -1))  -- Last 24 hours of data
FROM device, generate_series(24, 0, -1);

-- Insert alert settings for the device
WITH device AS (
    SELECT id FROM devices WHERE serial_number = 'SN001'
)
INSERT INTO alert_settings (
    device_id,
    enabled,
    temperature_min,
    temperature_max,
    humidity_min,
    humidity_max,
    flow_rate_min,
    flow_rate_max
)
SELECT 
    device.id,
    true,
    20.0,
    25.0,
    45.0,
    55.0,
    1.5,
    3.0
FROM device;

-- Insert test alert recipient
WITH device AS (
    SELECT id FROM devices WHERE serial_number = 'SN001'
)
INSERT INTO alert_recipients (device_id, email)
SELECT 
    device.id,
    'icealertdevice@gmail.com'
FROM device;

-- Insert a test combination alert
WITH device AS (
    SELECT id FROM devices WHERE serial_number = 'SN001'
)
INSERT INTO combination_alerts (device_id, name, enabled, conditions)
SELECT 
    device.id,
    'Temperature and Flow Alert',
    true,
    '{
        "temperature": {
            "enabled": true,
            "outOfRange": true
        },
        "flowRate": {
            "enabled": true,
            "noFlow": true,
            "duration": 15
        }
    }'::jsonb
FROM device; 