const express = require('express');
const cors = require('cors');
const { supabase } = require('./db');
require('dotenv').config();

const app = express();

// Configure CORS to accept requests from both development and production frontends
app.use(cors({
  origin: [
    'https://ice-alert-frontend1.vercel.app',
    'https://aaaa-arduino-proj-9ievnvz20-icealerts-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
}));
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
    
    const { data, error } = await supabase
      .from('devices')
      .select(`
        *,
        latest_readings (
          temperature,
          humidity,
          flow_rate,
          timestamp
        )
      `);

    if (error) {
      console.error('Supabase error details:', error);
      throw error;
    }
    console.log('Devices fetched successfully:', data?.length || 0, 'devices');
    res.json(data);
  } catch (error) {
    console.error('Error fetching devices:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      details: error.details
    });
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
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
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Device not found' });
    }
    res.json(data);
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
      .from('readings')
      .select('*')
      .eq('device_id', id)
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: true });

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
    const { device_id, temperature, humidity, flow_rate } = req.body;
    
    const { data, error } = await supabase
      .from('readings')
      .insert([
        { device_id, temperature, humidity, flow_rate }
      ])
      .select();

    if (error) throw error;

    // Check alert conditions
    await checkAlertConditions(device_id, { temperature, humidity, flow_rate });

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
      .from('alert_settings')
      .select('*')
      .eq('device_id', id)
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
    
    // Transform frontend settings to match database schema
    const dbSettings = {
      device_id: id,
      enabled: settings.enabled,
      recipients: settings.recipients || [],
      conditions: settings.conditions || {},
      combination_alerts: settings.combinationAlerts || [],
      // Extract numeric values from conditions if they exist
      temperature_min: settings.conditions?.temperature?.min || 20,
      temperature_max: settings.conditions?.temperature?.max || 25,
      humidity_min: settings.conditions?.humidity?.min || 45,
      humidity_max: settings.conditions?.humidity?.max || 55,
      flow_rate_min: settings.conditions?.flowRate?.min || 1.5,
      flow_rate_max: settings.conditions?.flowRate?.max || 3.0,
      flow_rate_warning_threshold: settings.conditions?.flowRate?.warningThreshold || 120,
      flow_rate_critical_threshold: settings.conditions?.flowRate?.criticalThreshold || 240,
      updated_at: new Date().toISOString()
    };

    console.log('Updating alert settings:', {
      deviceId: id,
      settings: dbSettings,
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('alert_settings')
      .upsert(dbSettings)
      .select();

    if (error) {
      console.error('Supabase error updating alert settings:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after update');
    }

    // Transform the response back to frontend format
    const responseData = {
      ...data[0],
      combinationAlerts: data[0].combination_alerts || []
    };
    delete responseData.combination_alerts;

    console.log('Alert settings updated successfully:', {
      deviceId: id,
      responseData,
      timestamp: new Date().toISOString()
    });

    res.json(responseData);
  } catch (error) {
    console.error('Error updating alert settings:', {
      error,
      stack: error.stack,
      deviceId: req.params.id,
      body: req.body
    });
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'Failed to update alert settings'
    });
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
async function checkAlertConditions(deviceId, reading) {
  try {
    // Get device alert settings
    const { data: settings, error: settingsError } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('device_id', deviceId)
      .single();

    if (settingsError) throw settingsError;
    if (!settings || !settings.enabled) return;

    // Check temperature
    if (reading.temperature < settings.temperature_min || reading.temperature > settings.temperature_max) {
      await createAlert(deviceId, 'temperature', reading.temperature, `${settings.temperature_min}-${settings.temperature_max}`);
    }

    // Check humidity
    if (reading.humidity < settings.humidity_min || reading.humidity > settings.humidity_max) {
      await createAlert(deviceId, 'humidity', reading.humidity, `${settings.humidity_min}-${settings.humidity_max}`);
    }

    // Check flow rate
    if (reading.flow_rate < settings.flow_rate_min || reading.flow_rate > settings.flow_rate_max) {
      await createAlert(deviceId, 'flow_rate', reading.flow_rate, `${settings.flow_rate_min}-${settings.flow_rate_max}`);
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