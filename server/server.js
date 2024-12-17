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
app.get('/debug/schema', async (req, res) => {
  try {
    console.log('Checking database schema...');
    
    // List of tables we want to check
    const tables = [
      'devices',
      'readings',
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
    
    // Get device settings
    const { data: settings, error: settingsError } = await supabase
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
    const devices = settings.map(device => {
      const latestData = deviceData.find(d => d.icealert_id === device.icealert_id);
      return {
        ...device,
        latest_readings: latestData ? {
          temperature: latestData.temperature,
          humidity: latestData.humidity,
          flow_rate: latestData.flow_rate,
          timestamp: latestData.created_at
        } : null
      };
    });

    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: error.message });
  }
});

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

// Add endpoint to search by icealert_id
app.get('/api/devices/by-icealert/:icealertId', async (req, res) => {
  try {
    const { icealertId } = req.params;
    console.log('Device lookup by icealert_id:', {
      icealertId,
      headers: req.headers,
      origin: req.headers.origin,
      method: req.method,
      path: req.path
    });
    
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        latest_readings (
          temperature,
          humidity,
          flow_rate,
          timestamp
        ),
        alert_settings (*)
      `)
      .eq('icealert_id', icealertId)
      .single();

    if (error) {
      console.error('Supabase query error:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }
    
    if (!data) {
      console.log('Device not found with icealert_id:', icealertId);
      return res.status(404).json({ 
        error: 'Device not found',
        details: {
          searchId: icealertId,
          searchType: 'icealert_id'
        }
      });
    }
    
    console.log('Device found by icealert_id:', {
      id: data.id,
      name: data.name,
      icealert_id: data.icealert_id,
      has_readings: !!data.latest_readings,
      has_settings: !!data.alert_settings
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching device by icealert_id:', error);
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