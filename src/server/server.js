const express = require('express');
const cors = require('cors');
const { checkAndSendAlerts } = require('./emailService');
const { supabase } = require('./supabase');

const app = express();
app.use(cors());
app.use(express.json());

// Store alert settings in memory (replace with database in production)
const alertSettingsStore = new Map();

// Endpoint to update alert settings
app.put('/api/devices/:id/alerts', async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;
    
    // Store in Supabase
    const { data, error } = await supabase
      .from('alert_settings')
      .upsert({ 
        device_id: id,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
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
    
    res.json(data);
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