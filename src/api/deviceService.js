import { supabase } from './config';

// Fetch all devices
export const fetchDevices = async () => {
  console.log('Fetching all devices');
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching devices:', error);
    throw error;
  }

  return data;
};

// Fetch a specific device's readings
export const fetchDeviceReadings = async (deviceId, timeRange = '24h') => {
  console.log('Fetching readings for device:', deviceId);
  
  // Convert timeRange to hours for the query
  const hours = parseInt(timeRange);
  const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('readings')
    .select('*')
    .eq('device_id', deviceId)
    .gte('timestamp', fromDate)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching readings:', error);
    throw error;
  }

  return data;
};

// Subscribe to real-time updates for a device
export const subscribeToDeviceReadings = (deviceId, callback) => {
  return supabase
    .channel('device-readings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'readings',
        filter: `device_id=eq.${deviceId}`
      },
      (payload) => callback(payload.new)
    )
    .subscribe();
};

// Update device settings
export const updateDeviceSettings = async (deviceId, settings) => {
  console.log('Updating settings for device:', deviceId, settings);
  
  const { data, error } = await supabase
    .from('devices')
    .update({ settings })
    .eq('id', deviceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating device settings:', error);
    throw error;
  }

  return data;
}; 