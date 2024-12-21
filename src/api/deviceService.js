import { supabase } from './config';

// Helper function to format device data
const formatDeviceData = (device) => {
  if (!device) return null;
  return {
    id: device.id,
    name: device.device_name,
    location: device.location,
    part_number: device.part_number,
    serial_number: device.serial_number,
    icealert_id: device.icealert_id,
    settings: {
      normalRanges: {
        temperature: {
          min: device.temperature_min,
          max: device.temperature_max
        },
        humidity: {
          min: device.humidity_min,
          max: device.humidity_max
        },
        flowRate: {
          min: device.flow_rate_min,
          max: device.flow_rate_max,
          warningTimeThreshold: device.flow_rate_warning_hours,
          criticalTimeThreshold: device.flow_rate_critical_hours
        }
      },
      alerts: {
        enabled: device.email_alerts_enabled,
        recipients: device.alert_recipients || [],
        conditions: {
          temperature: {
            enabled: device.temperature_alert_enabled,
            threshold: device.temperature_alert_threshold
          },
          humidity: {
            enabled: device.humidity_alert_enabled,
            threshold: device.humidity_alert_threshold
          },
          flowRate: {
            enabled: device.flow_rate_alert_enabled,
            noFlowDuration: device.no_flow_alert_minutes
          }
        }
      }
    },
    stats: {
      temperature: {
        current: device.temperature,
        timestamp: device.temperature_timestamp
      },
      humidity: {
        current: device.humidity,
        timestamp: device.humidity_timestamp
      },
      flowRate: {
        current: device.flow_rate,
        timestamp: device.flow_rate_timestamp
      }
    }
  };
};

// Helper function to format readings data
const formatReadingsData = (readings) => {
  if (!readings || !Array.isArray(readings)) return [];
  
  return readings.map(reading => ({
    timestamp: reading.created_at,
    temperature: reading.temperature,
    humidity: reading.humidity,
    flowRate: reading.flow_rate
  }));
};

// Fetch device by IceAlert ID
export const fetchDeviceByIceAlertId = async (icealertId) => {
  try {
    console.log('Fetching device with IceAlert ID:', icealertId);
    
    // First get the device settings
    const { data: deviceSettings, error: settingsError } = await supabase
      .from('device_settings')
      .select(`
        id,
        icealert_id,
        device_name,
        location,
        part_number,
        serial_number,
        temperature_min,
        temperature_max,
        humidity_min,
        humidity_max,
        flow_rate_min,
        flow_rate_max,
        flow_rate_warning_hours,
        flow_rate_critical_hours,
        email_alerts_enabled,
        alert_recipients,
        temperature_alert_enabled,
        temperature_alert_threshold,
        humidity_alert_enabled,
        humidity_alert_threshold,
        flow_rate_alert_enabled,
        no_flow_alert_minutes
      `)
      .eq('icealert_id', icealertId)
      .single();

    if (settingsError) {
      console.error('Error fetching device settings:', settingsError);
      throw settingsError;
    }

    if (!deviceSettings) {
      throw new Error(`No device found with IceAlert ID: ${icealertId}`);
    }

    // Then get the latest device data
    const { data: deviceData, error: dataError } = await supabase
      .from('device_data')
      .select(`
        temperature,
        temperature_timestamp,
        humidity,
        humidity_timestamp,
        flow_rate,
        flow_rate_timestamp,
        created_at
      `)
      .eq('icealert_id', icealertId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (dataError) {
      console.error('Error fetching device data:', dataError);
      throw dataError;
    }

    // Combine the data
    const combinedData = {
      ...deviceSettings,
      temperature: deviceData?.temperature,
      temperature_timestamp: deviceData?.temperature_timestamp,
      humidity: deviceData?.humidity,
      humidity_timestamp: deviceData?.humidity_timestamp,
      flow_rate: deviceData?.flow_rate,
      flow_rate_timestamp: deviceData?.flow_rate_timestamp,
      created_at: deviceData?.created_at
    };

    return formatDeviceData(combinedData);
  } catch (error) {
    console.error('Error in fetchDeviceByIceAlertId:', error);
    throw error;
  }
};

// Fetch device readings
export const fetchDeviceReadings = async (deviceId, timeRange = '24h') => {
  try {
    console.log('Fetching readings for device:', deviceId, 'timeRange:', timeRange);
    
    const hours = parseInt(timeRange);
    const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('device_data')
      .select(`
        created_at,
        temperature,
        humidity,
        flow_rate
      `)
      .eq('icealert_id', deviceId)
      .gte('created_at', fromDate)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching device readings:', error);
      throw error;
    }

    return formatReadingsData(data || []);
  } catch (error) {
    console.error('Error in fetchDeviceReadings:', error);
    throw error;
  }
};

// Update device settings
export const updateDeviceSettings = async (deviceId, settings) => {
  try {
    console.log('Updating settings for device:', deviceId);
    
    const updateData = {
      device_name: settings.name,
      location: settings.location,
      part_number: settings.partNumber,
      serial_number: settings.serialNumber,
      temperature_min: settings.normalRanges.temperature.min,
      temperature_max: settings.normalRanges.temperature.max,
      humidity_min: settings.normalRanges.humidity.min,
      humidity_max: settings.normalRanges.humidity.max,
      flow_rate_min: settings.normalRanges.flowRate.min,
      flow_rate_max: settings.normalRanges.flowRate.max,
      flow_rate_warning_hours: settings.alertThresholds.flowRate.warning,
      flow_rate_critical_hours: settings.alertThresholds.flowRate.critical,
      email_alerts_enabled: settings.alerts.enabled,
      alert_recipients: settings.alerts.recipients,
      temperature_alert_enabled: settings.alerts.conditions.temperature.enabled,
      temperature_alert_threshold: settings.alerts.conditions.temperature.threshold,
      humidity_alert_enabled: settings.alerts.conditions.humidity.enabled,
      humidity_alert_threshold: settings.alerts.conditions.humidity.threshold,
      flow_rate_alert_enabled: settings.alerts.conditions.flowRate.enabled,
      no_flow_alert_minutes: settings.alertThresholds.flowRate.noFlowDuration
    };

    const { error } = await supabase
      .from('device_settings')
      .update(updateData)
      .eq('id', deviceId);

    if (error) {
      console.error('Error updating device settings:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateDeviceSettings:', error);
    throw error;
  }
};