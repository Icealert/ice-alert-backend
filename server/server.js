const express = require('express');
const cors = require('cors');
const { supabase } = require('./db');
require('dotenv').config();

const app = express();

// Configure CORS
const allowedOrigins = [
  'https://aaaa-arduino-proj-9ievnvz20-icealerts-projects.vercel.app',
  'https://ice-alert-frontend1.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173', // Vite preview
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all vercel.app subdomains and specific origins
    if (
      origin.endsWith('.vercel.app') || 
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV === 'development'
    ) {
      return callback(null, true);
    }
    
    console.log('CORS blocked for origin:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight request for 24 hours
};

app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug schema endpoint
app.get('/api/debug/schema', async (req, res) => {
  try {
    console.log('Checking database schema...');
    
    // List of tables we want to check
    const tables = [
      'device_settings',
      'device_data',
      'alert_settings',
      'alert_recipients',
      'alert_history',
      'combination_alerts'
    ];

    const schema = {};
    
    // Check each table
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          schema[tableName] = { exists: false, error: error.message };
        } else {
          schema[tableName] = {
            exists: true,
            sample: data,
            columns: data && data[0] ? Object.keys(data[0]) : []
          };
        }
      } catch (error) {
        schema[tableName] = { exists: false, error: error.message };
      }
    }

    // Check views
    try {
      const { data: latestReadings, error: lrError } = await supabase
        .from('latest_readings')
        .select('*')
        .limit(1);

      schema['latest_readings'] = {
        exists: !lrError,
        sample: latestReadings,
        columns: latestReadings && latestReadings[0] ? Object.keys(latestReadings[0]) : []
      };
    } catch (error) {
      schema['latest_readings'] = { exists: false, error: error.message };
    }

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      schema
    });
  } catch (error) {
    console.error('Schema check error:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Device endpoints
app.get('/api/devices', async (req, res) => {
  try {
    console.log('Fetching devices... Environment check:');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);
    console.log('CORS_ORIGIN:', process.env.CORS_ORIGIN);
    
    // Get all device settings
    const { data: deviceSettings, error: settingsError } = await supabase
      .from('device_settings')
      .select('*');

    if (settingsError) throw settingsError;

    // Get latest data for each device
    const { data: deviceData, error: dataError } = await supabase
      .from('device_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (dataError) throw dataError;

    // Combine settings and data
    const devices = deviceSettings.map(device => {
      const latestData = deviceData.find(d => d.icealert_id === device.icealert_id);
      return {
        id: device.id,
        icealert_id: device.icealert_id,
        name: device.device_name,
        location: device.location,
        part_number: device.part_number,
        serial_number: device.serial_number,
        latest_readings: latestData ? {
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          flow_rate: latestData.flow_rate,
          timestamp: latestData.created_at
        } : null,
        alert_settings: {
          temperature: {
            min: device.temperature_min,
            max: device.temperature_max,
            enabled: device.temperature_alert_enabled,
            threshold: device.temperature_alert_threshold
          },
          humidity: {
            min: device.humidity_min,
            max: device.humidity_max,
            enabled: device.humidity_alert_enabled,
            threshold: device.humidity_alert_threshold
          },
          flow_rate: {
            min: device.flow_rate_min,
            max: device.flow_rate_max,
            enabled: device.flow_rate_alert_enabled,
            warning_hours: device.flow_rate_warning_hours,
            critical_hours: device.flow_rate_critical_hours,
            no_flow_minutes: device.no_flow_alert_minutes
          },
          email_alerts_enabled: device.email_alerts_enabled,
          alert_frequency: device.alert_frequency
        },
        updated_at: device.updated_at
      };
    });

    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add endpoint to search by icealert_id
app.get('/api/devices/by-icealert/:icealertId', async (req, res) => {
  try {
    const { icealertId } = req.params;
    console.log('Device lookup by icealert_id:', {
      icealertId,
      headers: req.headers,
      origin: req.headers.origin,
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    // Get device settings
    console.log('Querying device_settings table...');
    const { data: deviceSettings, error: settingsError } = await supabase
      .from('device_settings')
      .select('*')
      .eq('icealert_id', icealertId)
      .single();

    if (settingsError) {
      console.error('Supabase query error (device_settings):', {
        error: settingsError,
        code: settingsError.code,
        message: settingsError.message,
        details: settingsError.details,
        hint: settingsError.hint,
        timestamp: new Date().toISOString()
      });
      throw settingsError;
    }
    
    if (!deviceSettings) {
      console.log('Device not found with icealert_id:', {
        icealertId,
        timestamp: new Date().toISOString()
      });
      return res.status(404).json({ 
        error: 'Device not found',
        details: {
          searchId: icealertId,
          searchType: 'icealert_id',
          timestamp: new Date().toISOString()
        }
      });
    }

    console.log('Device settings found:', {
      id: deviceSettings.id,
      icealert_id: deviceSettings.icealert_id,
      device_name: deviceSettings.device_name,
      timestamp: new Date().toISOString()
    });

    // Get latest readings
    console.log('Querying device_data table...');
    const { data: readings, error: readingsError } = await supabase
      .from('device_data')
      .select('*')
      .eq('icealert_id', icealertId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (readingsError && readingsError.code !== 'PGRST116') {
      console.error('Supabase query error (device_data):', {
        error: readingsError,
        code: readingsError.code,
        message: readingsError.message,
        details: readingsError.details,
        hint: readingsError.hint,
        timestamp: new Date().toISOString()
      });
      throw readingsError;
    }

    console.log('Device readings found:', {
      hasReadings: !!readings,
      timestamp: readings?.created_at || new Date().toISOString()
    });

    // Format response to match the generic device endpoint
    const response = {
      id: deviceSettings.id,
      icealert_id: deviceSettings.icealert_id,
      device_name: deviceSettings.device_name,
      location: deviceSettings.location,
      part_number: deviceSettings.part_number,
      serial_number: deviceSettings.serial_number,
      temperature_min: deviceSettings.temperature_min,
      temperature_max: deviceSettings.temperature_max,
      humidity_min: deviceSettings.humidity_min,
      humidity_max: deviceSettings.humidity_max,
      flow_rate_min: deviceSettings.flow_rate_min,
      flow_rate_max: deviceSettings.flow_rate_max,
      flow_rate_warning_hours: deviceSettings.flow_rate_warning_hours,
      flow_rate_critical_hours: deviceSettings.flow_rate_critical_hours,
      email_alerts_enabled: deviceSettings.email_alerts_enabled,
      temperature_alert_enabled: deviceSettings.temperature_alert_enabled,
      temperature_alert_threshold: deviceSettings.temperature_alert_threshold,
      humidity_alert_enabled: deviceSettings.humidity_alert_enabled,
      humidity_alert_threshold: deviceSettings.humidity_alert_threshold,
      flow_rate_alert_enabled: deviceSettings.flow_rate_alert_enabled,
      no_flow_alert_minutes: deviceSettings.no_flow_alert_minutes,
      alert_frequency: deviceSettings.alert_frequency,
      latest_readings: readings ? {
        temperature: readings.temperature,
        humidity: readings.humidity,
        flow_rate: readings.flow_rate,
        timestamp: readings.created_at
      } : null,
      updated_at: deviceSettings.updated_at
    };
    
    console.log('Response prepared:', {
      id: response.id,
      name: response.device_name,
      icealert_id: response.icealert_id,
      has_readings: !!response.latest_readings,
      has_settings: true,
      timestamp: new Date().toISOString()
    });
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching device by icealert_id:', {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generic device endpoint
app.get('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get device settings
    const { data: settings, error: settingsError } = await supabase
      .from('device_settings')
      .select('*')
      .eq('icealert_id', id)
      .single();

    if (settingsError) throw settingsError;

    // Get latest device data
    const { data: latestData, error: dataError } = await supabase
      .from('device_data')
      .select('*')
      .eq('icealert_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dataError && dataError.code !== 'PGRST116') throw dataError;

    const deviceInfo = {
      ...settings,
      latest_readings: latestData ? {
        temperature: latestData.temperature,
        humidity: latestData.humidity,
        flow_rate: latestData.flow_rate,
        timestamp: latestData.created_at
      } : null
    };

    res.json(deviceInfo);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: error.message });
  }
});

// Readings endpoints
app.get('/api/devices/:id/readings', async (req, res) => {
  try {
    const { id } = req.params;
    const { hours = 24 } = req.query;
    
    const { data, error } = await supabase
      .from('device_data')
      .select('*')
      .eq('icealert_id', id)
      .gte('created_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching readings:', error);
    res.status(500).json({ error: error.message });
  }
});

// ESP32 data ingestion endpoint
app.post('/api/readings', async (req, res) => {
  try {
    const { icealert_id, temperature, humidity, flow_rate } = req.body;
    
    const { data, error } = await supabase
      .from('device_data')
      .insert([{
        icealert_id,
        temperature,
        humidity,
        flow_rate,
        temperature_timestamp: new Date().toISOString(),
        humidity_timestamp: new Date().toISOString(),
        flow_rate_timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;

    // Check alert conditions
    await checkAlertConditions(icealert_id, { temperature, humidity, flow_rate });

    res.json(data[0]);
  } catch (error) {
    console.error('Error saving reading:', error);
    res.status(500).json({ error: error.message });
  }
});

// Alert settings endpoints
app.get('/api/devices/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('device_settings')
      .select('*')
      .eq('icealert_id', id)
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/devices/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    console.log('Updating alert settings:', {
      deviceId: id,
      settings: settings,
      timestamp: new Date().toISOString()
    });

    // Transform frontend settings to match database schema
    const dbSettings = {
      temperature_min: settings.normalRanges?.temperature?.min || 20,
      temperature_max: settings.normalRanges?.temperature?.max || 25,
      humidity_min: settings.normalRanges?.humidity?.min || 45,
      humidity_max: settings.normalRanges?.humidity?.max || 55,
      flow_rate_min: settings.normalRanges?.flowRate?.min || 1.5,
      flow_rate_max: settings.normalRanges?.flowRate?.max || 3.0,
      flow_rate_warning_hours: settings.alertThresholds?.flowRate?.warning || 2,
      flow_rate_critical_hours: settings.alertThresholds?.flowRate?.critical || 4,
      email_alerts_enabled: settings.enabled,
      temperature_alert_enabled: settings.conditions?.temperature?.enabled,
      temperature_alert_threshold: settings.conditions?.temperature?.thresholdValue,
      humidity_alert_enabled: settings.conditions?.humidity?.enabled,
      humidity_alert_threshold: settings.conditions?.humidity?.thresholdValue,
      flow_rate_alert_enabled: settings.conditions?.flowRate?.enabled,
      no_flow_alert_minutes: settings.conditions?.flowRate?.noFlowDuration || 30,
      alert_frequency: settings.conditions?.temperature?.frequency || 'immediate',
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('device_settings')
      .update(dbSettings)
      .eq('icealert_id', id)
      .select();

    if (error) {
      console.error('Supabase error updating alert settings:', error);
      throw error;
    }

    console.log('Alert settings updated successfully:', data);
    res.json(data[0]);
  } catch (error) {
    console.error('Error updating alert settings:', {
      error,
      stack: error.stack,
      deviceId: req.params.id,
      body: req.body
    });
    res.status(500).json({ error: error.message || 'Failed to update alert settings' });
  }
});

// Alert history endpoint
app.get('/api/devices/:id/alert-history', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    
    const { data, error } = await supabase
      .from('alert_history')
      .select('*')
      .eq('device_id', id)
      .gte('sent_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check alert conditions
async function checkAlertConditions(icealert_id, reading) {
  try {
    // Get device settings
    const { data: settings, error: settingsError } = await supabase
      .from('device_settings')
      .select('*')
      .eq('icealert_id', icealert_id)
      .single();

    if (settingsError) throw settingsError;
    if (!settings || !settings.email_alerts_enabled) return;

    // Check temperature
    if (reading.temperature < settings.temperature_min || reading.temperature > settings.temperature_max) {
      if (settings.temperature_alert_enabled) {
        // Implement alert logic here
        console.log('Temperature alert triggered:', {
          device: icealert_id,
          value: reading.temperature,
          threshold: `${settings.temperature_min}-${settings.temperature_max}`
        });
      }
    }

    // Check humidity
    if (reading.humidity < settings.humidity_min || reading.humidity > settings.humidity_max) {
      if (settings.humidity_alert_enabled) {
        // Implement alert logic here
        console.log('Humidity alert triggered:', {
          device: icealert_id,
          value: reading.humidity,
          threshold: `${settings.humidity_min}-${settings.humidity_max}`
        });
      }
    }

    // Check flow rate
    if (reading.flow_rate < settings.flow_rate_min || reading.flow_rate > settings.flow_rate_max) {
      if (settings.flow_rate_alert_enabled) {
        // Implement alert logic here
        console.log('Flow rate alert triggered:', {
          device: icealert_id,
          value: reading.flow_rate,
          threshold: `${settings.flow_rate_min}-${settings.flow_rate_max}`
        });
      }
    }
  } catch (error) {
    console.error('Error checking alert conditions:', error);
  }
}

// Helper function to create alerts
async function createAlert(deviceId, type, value, threshold) {
  try {
    const { error } = await supabase
      .from('alert_history')
      .insert([{
        device_id: deviceId,
        alert_type: type,
        message: `${type.charAt(0).toUpperCase() + type.slice(1)} out of range`,
        value,
        threshold
      }]);

    if (error) throw error;
  } catch (error) {
    console.error('Error creating alert:', error);
  }
}

// Test connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    console.log('Testing database connection...');
    const { data: settings, error: settingsError } = await supabase
      .from('device_settings')
      .select('count');

    if (settingsError) throw settingsError;

    res.json({ 
      status: 'ok', 
      message: 'Database connection successful',
      count: settings.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection test failed:', error);
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test data endpoint
app.get('/api/test-data', async (req, res) => {
  try {
    console.log('Testing data structure...');
    
    // Test device settings
    const testSettings = {
      id: 'test-uuid',
      icealert_id: 'IA-2024-0001',
      device_name: 'Test Ice Machine',
      location: 'Test Kitchen',
      part_number: 'TEST-123',
      serial_number: 'SN-123',
      temperature_min: 20.0,
      temperature_max: 25.0,
      humidity_min: 45.0,
      humidity_max: 55.0,
      flow_rate_min: 1.5,
      flow_rate_max: 3.0,
      flow_rate_warning_hours: 2,
      flow_rate_critical_hours: 4,
      email_alerts_enabled: true,
      temperature_alert_enabled: true,
      temperature_alert_threshold: 30.0,
      humidity_alert_enabled: true,
      humidity_alert_threshold: 60.0,
      flow_rate_alert_enabled: true,
      no_flow_alert_minutes: 30,
      alert_frequency: 'immediate',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Test device data
    const testData = {
      id: 'test-reading-uuid',
      icealert_id: 'IA-2024-0001',
      temperature: 22.5,
      temperature_timestamp: new Date().toISOString(),
      humidity: 50.0,
      humidity_timestamp: new Date().toISOString(),
      flow_rate: 2.0,
      flow_rate_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Format response like the device endpoint
    const response = {
      id: testSettings.id,
      icealert_id: testSettings.icealert_id,
      name: testSettings.device_name,
      location: testSettings.location,
      part_number: testSettings.part_number,
      serial_number: testSettings.serial_number,
      latest_readings: {
        temperature: testData.temperature,
        humidity: testData.humidity,
        flow_rate: testData.flow_rate,
        timestamp: testData.created_at
      },
      alert_settings: {
        temperature: {
          min: testSettings.temperature_min,
          max: testSettings.temperature_max,
          enabled: testSettings.temperature_alert_enabled,
          threshold: testSettings.temperature_alert_threshold
        },
        humidity: {
          min: testSettings.humidity_min,
          max: testSettings.humidity_max,
          enabled: testSettings.humidity_alert_enabled,
          threshold: testSettings.humidity_alert_threshold
        },
        flow_rate: {
          min: testSettings.flow_rate_min,
          max: testSettings.flow_rate_max,
          enabled: testSettings.flow_rate_alert_enabled,
          warning_hours: testSettings.flow_rate_warning_hours,
          critical_hours: testSettings.flow_rate_critical_hours,
          no_flow_minutes: testSettings.no_flow_alert_minutes
        },
        email_alerts_enabled: testSettings.email_alerts_enabled,
        alert_frequency: testSettings.alert_frequency
      },
      updated_at: testSettings.updated_at
    };

    console.log('Test data structure:', {
      hasSettings: true,
      hasReadings: true,
      settingsFields: Object.keys(testSettings),
      dataFields: Object.keys(testData),
      responseFields: Object.keys(response),
      timestamp: new Date().toISOString()
    });

    res.json({
      status: 'ok',
      message: 'Test data structure generated successfully',
      raw: {
        settings: testSettings,
        data: testData
      },
      formatted: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating test data:', error);
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Device settings endpoint
app.post('/api/devices/settings', async (req, res) => {
  try {
    const settings = req.body;
    console.log('Creating device settings:', {
      icealert_id: settings.icealert_id,
      device_name: settings.device_name,
      timestamp: new Date().toISOString()
    });

    // Add timestamps
    settings.created_at = new Date().toISOString();
    settings.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('device_settings')
      .insert([settings])
      .select();

    if (error) {
      console.error('Error creating device settings:', {
        error,
        settings,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('Device settings created:', {
      id: data[0].id,
      icealert_id: data[0].icealert_id,
      device_name: data[0].device_name,
      timestamp: new Date().toISOString()
    });

    res.json(data[0]);
  } catch (error) {
    console.error('Error in device settings endpoint:', {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Full environment configuration:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- PORT:', process.env.PORT);
  console.log('- CORS_ORIGIN:', process.env.CORS_ORIGIN);
  
  // Log Supabase config (masked)
  const maskedUrl = process.env.SUPABASE_URL 
    ? `${process.env.SUPABASE_URL.slice(0, 15)}...${process.env.SUPABASE_URL.slice(-10)}`
    : 'Not set';
  console.log('- SUPABASE_URL:', maskedUrl);
  console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `Set (length: ${process.env.SUPABASE_ANON_KEY.length})` : 'Not set');
  
  // Log server configuration
  console.log('\nServer configuration:');
  console.log('- Host:', '0.0.0.0');
  console.log('- Port:', PORT);
  console.log('- CORS enabled:', true);
  console.log('- CORS origin:', process.env.NODE_ENV === 'production' ? process.env.CORS_ORIGIN : '*');
}); 