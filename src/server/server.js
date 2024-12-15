const express = require('express');
const cors = require('cors');
const { checkAndSendAlerts } = require('./emailService');
const { supabase } = require('./supabase');

const app = express();

// Configure CORS
const corsOptions = {
  origin: [
    'https://ice-alert-frontend1.vercel.app',
    'https://ice-alert-frontend1-git-main-icealerts-projects.vercel.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Add headers middleware for preflight requests
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 