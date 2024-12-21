import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDeviceByIceAlertId, fetchDeviceReadings, updateDeviceSettings } from '../api/deviceService';
import ChartComponent from '../components/DeviceAnalytics/ChartComponent';
import QuickStats from '../components/DeviceAnalytics/QuickStats';
import SettingsModal from '../components/DeviceAnalytics/SettingsModal';
import { NORMAL_RANGES, DEFAULT_ALERT_SETTINGS } from '../components/DeviceAnalytics/constants';

const DeviceAnalytics = () => {
  const { icealertId } = useParams();
  const navigate = useNavigate();
  const [deviceDetails, setDeviceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    location: '',
    partNumber: '',
    serialNumber: '',
    normalRanges: { ...NORMAL_RANGES },
    alertThresholds: {
      flowRate: {
        warning: NORMAL_RANGES.flowRate.warningTimeThreshold,
        critical: NORMAL_RANGES.flowRate.criticalTimeThreshold,
        noFlowDuration: 30
      }
    },
    alerts: DEFAULT_ALERT_SETTINGS
  });

  const [timeRanges, setTimeRanges] = useState({
    temperature: '24h',
    humidity: '24h',
    flowRate: '24h'
  });

  const [historicalData, setHistoricalData] = useState([]);

  // Helper function to create safe stats object
  const createSafeStats = (metricStats, normalRange) => {
    return {
      min: metricStats?.min ?? null,
      max: metricStats?.max ?? null,
      avg: metricStats?.avg ?? null,
      trend: metricStats?.trend ?? 0,
      normalRange: {
        min: normalRange?.min ?? 0,
        max: normalRange?.max ?? 100
      }
    };
  };

  // Fetch device details
  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (!icealertId) {
        setError('No device ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log('Fetching device details for:', icealertId);
        const device = await fetchDeviceByIceAlertId(icealertId);
        
        if (!device) {
          throw new Error(`Device not found: ${icealertId}`);
        }

        console.log('Device details received:', device);
        setDeviceDetails(device);
        
        // Initialize settings form with device data and safe defaults
        setSettingsForm(prev => ({
          ...prev,
          name: device.name || '',
          location: device.location || '',
          partNumber: device.part_number || '',
          serialNumber: device.serial_number || '',
          normalRanges: {
            temperature: {
              min: device.settings?.normalRanges?.temperature?.min ?? NORMAL_RANGES.temperature.min,
              max: device.settings?.normalRanges?.temperature?.max ?? NORMAL_RANGES.temperature.max
            },
            humidity: {
              min: device.settings?.normalRanges?.humidity?.min ?? NORMAL_RANGES.humidity.min,
              max: device.settings?.normalRanges?.humidity?.max ?? NORMAL_RANGES.humidity.max
            },
            flowRate: {
              min: device.settings?.normalRanges?.flowRate?.min ?? NORMAL_RANGES.flowRate.min,
              max: device.settings?.normalRanges?.flowRate?.max ?? NORMAL_RANGES.flowRate.max,
              warningTimeThreshold: device.settings?.normalRanges?.flowRate?.warningTimeThreshold ?? NORMAL_RANGES.flowRate.warningTimeThreshold,
              criticalTimeThreshold: device.settings?.normalRanges?.flowRate?.criticalTimeThreshold ?? NORMAL_RANGES.flowRate.criticalTimeThreshold
            }
          },
          alertThresholds: {
            flowRate: {
              warning: device.settings?.alertThresholds?.flowRate?.warning ?? NORMAL_RANGES.flowRate.warningTimeThreshold,
              critical: device.settings?.alertThresholds?.flowRate?.critical ?? NORMAL_RANGES.flowRate.criticalTimeThreshold,
              noFlowDuration: device.settings?.alertThresholds?.flowRate?.noFlowDuration ?? 30
            }
          },
          alerts: device.settings?.alerts || DEFAULT_ALERT_SETTINGS
        }));
      } catch (err) {
        console.error('Error fetching device details:', err);
        setError(err.message);
        setDeviceDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviceDetails();
  }, [icealertId]);

  // Fetch historical data
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (!deviceDetails?.icealert_id) return;

      try {
        setError(null);
        console.log('Fetching historical data for:', deviceDetails.icealert_id);
        const readings = await fetchDeviceReadings(deviceDetails.icealert_id, timeRanges.temperature);
        console.log('Historical data received:', readings?.length || 0, 'readings');
        setHistoricalData(readings || []);
      } catch (err) {
        console.error('Error fetching historical data:', err);
        setHistoricalData([]);
      }
    };

    fetchHistoricalData();
  }, [deviceDetails?.icealert_id, timeRanges.temperature]);

  // Handle time range changes
  const handleTimeRangeChange = (metric, value) => {
    setTimeRanges(prev => ({
      ...prev,
      [metric]: value
    }));
  };

  // Check if a value is within normal range
  const isInRange = (value, metric) => {
    if (value === null || value === undefined) return true;
    const range = settingsForm.normalRanges[metric];
    if (!range) return true;
    return value >= (range.min || 0) && value <= (range.max || 100);
  };

  // Handle settings update
  const handleSettingsUpdate = async (newSettings) => {
    if (!deviceDetails?.id) return;
    
    try {
      setError(null);
      await updateDeviceSettings(deviceDetails.id, newSettings);
      setSettingsForm(newSettings);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading device data...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="text-red-500 text-xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Device</h2>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  if (!deviceDetails) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Device Not Found</h2>
        <p className="text-gray-600 mb-4">The requested device could not be found.</p>
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">{deviceDetails.name || 'Unnamed Device'}</h1>
          <p className="text-gray-600">
            Location: {deviceDetails.location || 'Not specified'} | 
            ID: {deviceDetails.icealert_id}
          </p>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Settings
        </button>
      </div>

      <QuickStats
        deviceDetails={deviceDetails}
        historicalData={historicalData}
        normalRanges={settingsForm.normalRanges}
      />

      <div className="space-y-6">
        <ChartComponent
          data={historicalData}
          metric="temperature"
          title="Temperature"
          color="#ef4444"
          unit="°C"
          stats={createSafeStats(
            deviceDetails?.stats?.temperature,
            settingsForm.normalRanges.temperature
          )}
          isInRange={(value) => isInRange(value, 'temperature')}
          timeRange={timeRanges.temperature}
          onTimeRangeChange={handleTimeRangeChange}
        />

        <ChartComponent
          data={historicalData}
          metric="humidity"
          title="Humidity"
          color="#3b82f6"
          unit="%"
          stats={createSafeStats(
            deviceDetails?.stats?.humidity,
            settingsForm.normalRanges.humidity
          )}
          isInRange={(value) => isInRange(value, 'humidity')}
          timeRange={timeRanges.humidity}
          onTimeRangeChange={handleTimeRangeChange}
        />

        <ChartComponent
          data={historicalData}
          metric="flowRate"
          title="Flow Rate"
          color="#10b981"
          unit="L/min"
          stats={createSafeStats(
            deviceDetails?.stats?.flowRate,
            settingsForm.normalRanges.flowRate
          )}
          isInRange={(value) => isInRange(value, 'flowRate')}
          timeRange={timeRanges.flowRate}
          onTimeRangeChange={handleTimeRangeChange}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settingsForm}
        onUpdate={handleSettingsUpdate}
      />
    </div>
  );
};

export default DeviceAnalytics;
