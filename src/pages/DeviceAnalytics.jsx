import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchDeviceByIceAlertId, fetchDeviceReadings, updateDeviceSettings } from '../api/deviceService';
import ChartComponent from '../components/DeviceAnalytics/ChartComponent';
import QuickStats from '../components/DeviceAnalytics/QuickStats';
import SettingsModal from '../components/DeviceAnalytics/SettingsModal';
import { NORMAL_RANGES, DEFAULT_ALERT_SETTINGS } from '../components/DeviceAnalytics/constants';

const DeviceAnalytics = () => {
  const { icealertId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [deviceDetails, setDeviceDetails] = useState(location.state?.deviceDetails);
  const [loading, setLoading] = useState(!location.state?.deviceDetails);
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

  // Individual time ranges for each metric
  const [timeRanges, setTimeRanges] = useState({
    temperature: '24h',
    humidity: '24h',
    flowRate: '24h'
  });

  const [historicalData, setHistoricalData] = useState([]);

  // Fetch device details if not available in location state
  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (!deviceDetails && icealertId) {
        try {
          setLoading(true);
          const device = await fetchDeviceByIceAlertId(icealertId);
          if (!device) {
            throw new Error('Device not found');
          }
          setDeviceDetails(device);
          // Initialize settings form with device data
          setSettingsForm(prev => ({
            ...prev,
            name: device.name || '',
            location: device.location || '',
            partNumber: device.part_number || '',
            serialNumber: device.serial_number || '',
            normalRanges: device.settings?.normalRanges || { ...NORMAL_RANGES },
            alertThresholds: device.settings?.alertThresholds || {
              flowRate: {
                warning: NORMAL_RANGES.flowRate.warningTimeThreshold,
                critical: NORMAL_RANGES.flowRate.criticalTimeThreshold,
                noFlowDuration: 30
              }
            },
            alerts: device.settings?.alerts || DEFAULT_ALERT_SETTINGS
          }));
        } catch (err) {
          console.error('Error fetching device details:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchDeviceDetails();
  }, [icealertId, deviceDetails]);

  // Fetch historical data for each metric
  useEffect(() => {
    const fetchHistoricalData = async () => {
      if (deviceDetails?.id) {
        try {
          const readings = await fetchDeviceReadings(deviceDetails.icealert_id, timeRanges.temperature);
          setHistoricalData(readings);
        } catch (err) {
          console.error('Error fetching historical data:', err);
          setError(err.message);
        }
      }
    };

    fetchHistoricalData();
  }, [deviceDetails?.id, timeRanges]);

  // Handle time range changes
  const handleTimeRangeChange = (metric, value) => {
    setTimeRanges(prev => ({
      ...prev,
      [metric]: value
    }));
  };

  // Check if a value is within normal range
  const isInRange = (value, metric) => {
    if (!value || !settingsForm.normalRanges[metric]) return true;
    const range = settingsForm.normalRanges[metric];
    return value >= range.min && value <= range.max;
  };

  // Handle settings update
  const handleSettingsUpdate = async (newSettings) => {
    if (!deviceDetails?.id) return;
    
    try {
      await updateDeviceSettings(deviceDetails.id, newSettings);
      setSettingsForm(newSettings);
      setIsSettingsOpen(false);
    } catch (err) {
      console.error('Error updating settings:', err);
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!deviceDetails) return <div className="p-4">No device found</div>;

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
          stats={{
            current: deviceDetails.stats.temperature.current,
            normalRange: settingsForm.normalRanges.temperature
          }}
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
          stats={{
            current: deviceDetails.stats.humidity.current,
            normalRange: settingsForm.normalRanges.humidity
          }}
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
          stats={{
            current: deviceDetails.stats.flowRate.current,
            normalRange: settingsForm.normalRanges.flowRate
          }}
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
