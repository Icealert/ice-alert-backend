const express = require('express');
const cors = require('cors');
const { checkAndSendAlerts } = require('./emailService');
const { supabase } = require('./supabase');

const app = express();

// Configure CORS
const allowedOrigins = [
  'https://ice-alert-frontend1.vercel.app',
  'https://ice-alert-frontend1-git-main-icealerts-projects.vercel.app',
  'https://ice-alert-frontend1-oa3nfa92u-icealerts-projects.vercel.app',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all vercel.app subdomains
    if (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200,
  maxAge: 86400 // Cache preflight request for 24 hours
}));

app.use(express.json());

// Add headers middleware for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Allow all vercel.app subdomains or specific allowed origins
  if (origin && (origin.endsWith('.vercel.app') || allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Max-Age', '86400');
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Store alert settings in memory (replace with database in production)
const alertSettingsStore = new Map();

// Endpoint to update alert settings
app.put('/api/devices/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    // Transform the settings to match database schema
    const dbSettings = {
      device_id: id,
      enabled: settings.enabled,
      recipients: settings.recipients,
      conditions: settings.conditions,
      combination_alerts: settings.combinationAlerts, // Transform the key name
      updated_at: new Date().toISOString()
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from('alert_settings')
      .upsert(dbSettings)
      .select()
      .single();

    if (error) throw error;

    // Transform the response back to frontend format
    const responseData = {
      ...data,
      combinationAlerts: data.combination_alerts // Transform back for frontend
    };
    delete responseData.combination_alerts; // Remove the snake_case version

    res.json(responseData);
  } catch (error) {
    console.error('Error updating alert settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get alert settings
app.get('/api/devices/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('alert_settings')
      .select('*')
      .eq('device_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found, return default settings
        return res.json({
          enabled: false,
          recipients: [],
          conditions: {
            temperature: {
              enabled: false,
              outOfRange: false,
              threshold: false,
              thresholdValue: 25,
              frequency: 'immediate'
            },
            humidity: {
              enabled: false,
              outOfRange: false,
              threshold: false,
              thresholdValue: 50,
              frequency: 'immediate'
            },
            flowRate: {
              enabled: false,
              outOfRange: false,
              noFlow: false,
              noFlowDuration: 5,
              frequency: 'immediate'
            }
          },
          combinationAlerts: []
        });
      }
      throw error;
    }

    // Transform the response to frontend format
    const responseData = {
      ...data,
      combinationAlerts: data.combination_alerts || [] // Transform for frontend
    };
    delete responseData.combination_alerts; // Remove the snake_case version
    
    res.json(responseData);
  } catch (error) {
    console.error('Error getting alert settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to process device data and send alerts
app.post('/api/alerts/check/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const deviceData = req.body;
    const alertSettings = alertSettingsStore.get(deviceId);

    if (!alertSettings) {
      return res.status(404).json({ 
        success: false, 
        message: 'No alert settings found for device' 
      });
    }

    await checkAndSendAlerts(deviceData, alertSettings);
    res.json({ success: true, message: 'Alert check completed' });
  } catch (error) {
    console.error('Error checking alerts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Device lookup request:', {
      id,
      headers: req.headers,
      origin: req.headers.origin,
      method: req.method,
      path: req.path
    });
    
    // Try to find device by UUID first
    console.log('Attempting UUID lookup...');
    let { data, error } = await supabase
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

    if (!data) {
      console.log('UUID lookup failed, trying ice_alert_serial...');
      ({ data, error } = await supabase
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
        .eq('ice_alert_serial', id)
        .single());
    }

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
      console.log('Device not found with either UUID or ice_alert_serial:', id);
      return res.status(404).json({ 
        error: 'Device not found',
        details: {
          searchId: id,
          attempts: ['UUID', 'ice_alert_serial']
        }
      });
    }
    
    console.log('Device found:', {
      id: data.id,
      name: data.name,
      ice_alert_serial: data.ice_alert_serial,
      has_readings: !!data.latest_readings,
      has_settings: !!data.alert_settings
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching device:', {
      error,
      stack: error.stack,
      id: req.params.id,
      headers: req.headers
    });
    res.status(500).json({ 
      error: error.message,
      details: {
        code: error.code,
        hint: error.hint
      }
    });
  }
});

// Add endpoint to search by ice_alert_serial
app.get('/api/devices/by-serial/:serial', async (req, res) => {
  try {
    const { serial } = req.params;
    console.log('Device lookup by serial:', {
      serial,
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
      .eq('ice_alert_serial', serial)
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
      console.log('Device not found with ice_alert_serial:', serial);
      return res.status(404).json({ 
        error: 'Device not found',
        details: {
          searchId: serial,
          searchType: 'ice_alert_serial'
        }
      });
    }
    
    console.log('Device found by serial:', {
      id: data.id,
      name: data.name,
      ice_alert_serial: data.ice_alert_serial,
      has_readings: !!data.latest_readings,
      has_settings: !!data.alert_settings
    });
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching device by serial:', {
      error,
      stack: error.stack,
      serial: req.params.serial,
      headers: req.headers
    });
    res.status(500).json({ 
      error: error.message,
      details: {
        code: error.code,
        hint: error.hint
      }
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 