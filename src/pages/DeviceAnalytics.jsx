import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../api/config';
import deviceService from '../api/deviceService';
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

  const [historicalData, setHistoricalData] = useState({
    temperature: [],
    humidity: [],
    flowRate: []
  });

  // Fetch device details if not available in location state
  useEffect(() => {
    const fetchDeviceDetails = async () => {
      if (!deviceDetails && icealertId) {
        try {
          setLoading(true);
          const response = await deviceService.getDeviceByIceAlertId(icealertId);
          if (response.data) {
            // Map the response to match our component's expected structure
            const mappedDeviceDetails = {
              id: response.data.id,
              name: response.data.device_name,
              location: response.data.location,
              partNumber: response.data.part_number,
              serialNumber: response.data.serial_number,
              iceAlertSerial: response.data.icealert_id,
              temperature: response.data.latest_temperature,
              humidity: response.data.latest_humidity,
              flowRate: response.data.latest_flow_rate,
    alerts: {
                enabled: response.data.email_alerts_enabled,
                recipients: response.data.alert_recipients || [],
      conditions: {
        temperature: {
                    enabled: response.data.temperature_alert_enabled,
                    threshold: response.data.temperature_alert_threshold
        },
        humidity: {
                    enabled: response.data.humidity_alert_enabled,
                    threshold: response.data.humidity_alert_threshold
        },
        flowRate: {
                    enabled: response.data.flow_rate_alert_enabled,
                    noFlowDuration: response.data.no_flow_alert_minutes
                  }
                }
              }
            };
            
            setDeviceDetails(mappedDeviceDetails);
            
            // Update NORMAL_RANGES based on device settings
            Object.assign(NORMAL_RANGES, {
            temperature: {
                min: response.data.temperature_min,
                max: response.data.temperature_max
            },
            humidity: {
                min: response.data.humidity_min,
                max: response.data.humidity_max
            },
            flowRate: {
                min: response.data.flow_rate_min,
                max: response.data.flow_rate_max,
                warningTimeThreshold: response.data.flow_rate_warning_hours,
                criticalTimeThreshold: response.data.flow_rate_critical_hours
              }
            });
            
            // Fetch device readings
            try {
              const readingsResponse = await deviceService.getDeviceReadings(icealertId, 24);
              if (readingsResponse.data) {
                const formattedData = {
                  temperature: readingsResponse.data.map(reading => ({
                    timestamp: reading.temperature_timestamp || reading.created_at,
                    temperature: reading.temperature
                  })),
                  humidity: readingsResponse.data.map(reading => ({
                    timestamp: reading.humidity_timestamp || reading.created_at,
                    humidity: reading.humidity
                  })),
                  flowRate: readingsResponse.data.map(reading => ({
                    timestamp: reading.flow_rate_timestamp || reading.created_at,
                    flowRate: reading.flow_rate
                  }))
                };
                setHistoricalData(formattedData);
              }
            } catch (readingsErr) {
              console.error('Error fetching device readings:', readingsErr);
              // Don't set error state here, just log it and continue with generated data
            }
            
            setLoading(false);
          } else {
            setError('Device not found');
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching device details:', err);
          setError(err.message || 'Failed to load device details');
          setLoading(false);
        }
      }
    };

    fetchDeviceDetails();
  }, [icealertId, deviceDetails]);

  // Initialize settings form when device details are available
  useEffect(() => {
    if (deviceDetails) {
      setSettingsForm({
        name: deviceDetails.name,
        location: deviceDetails.location,
        partNumber: deviceDetails.partNumber,
        serialNumber: deviceDetails.serialNumber,
        normalRanges: {
            temperature: {
            min: NORMAL_RANGES.temperature.min,
            max: NORMAL_RANGES.temperature.max
            },
            humidity: {
            min: NORMAL_RANGES.humidity.min,
            max: NORMAL_RANGES.humidity.max
            },
            flowRate: {
            min: NORMAL_RANGES.flowRate.min,
            max: NORMAL_RANGES.flowRate.max
          }
        },
        alertThresholds: {
                flowRate: {
            warning: NORMAL_RANGES.flowRate.warningTimeThreshold,
            critical: NORMAL_RANGES.flowRate.criticalTimeThreshold,
            noFlowDuration: deviceDetails.alerts?.conditions?.flowRate?.noFlowDuration || 30
          }
        },
        alerts: {
          enabled: deviceDetails.alerts?.enabled || false,
          recipients: deviceDetails.alerts?.recipients || [],
              conditions: {
                temperature: {
              enabled: deviceDetails.alerts?.conditions?.temperature?.enabled || false,
              threshold: deviceDetails.alerts?.conditions?.temperature?.threshold || NORMAL_RANGES.temperature.max
                },
                humidity: {
              enabled: deviceDetails.alerts?.conditions?.humidity?.enabled || false,
              threshold: deviceDetails.alerts?.conditions?.humidity?.threshold || NORMAL_RANGES.humidity.max
                },
                flowRate: {
              enabled: deviceDetails.alerts?.conditions?.flowRate?.enabled || false,
              noFlowDuration: deviceDetails.alerts?.conditions?.flowRate?.noFlowDuration || 30
                }
            }
        }
      });
    }
  }, [deviceDetails]);

  // Handle settings form changes
  const handleSettingsChange = (field, value) => {
    setSettingsForm(prev => {
      const newForm = { ...prev };
      if (field.includes('.')) {
        const [category, subField, type] = field.split('.');
        if (!newForm[category]) newForm[category] = {};
        if (!newForm[category][subField]) newForm[category][subField] = {};
        newForm[category][subField][type] = parseFloat(value);
      } else {
        newForm[field] = value;
      }
      return newForm;
    });
  };

  // Handle email recipient changes
  const handleEmailChange = (index, value) => {
    setSettingsForm(prev => {
      const newForm = { ...prev };
      newForm.alerts.recipients[index] = value;
      return newForm;
    });
  };

  // Add new email recipient
  const addEmailRecipient = () => {
    setSettingsForm(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        recipients: [...prev.alerts.recipients, '']
      }
    }));
  };

  // Remove email recipient
  const removeEmailRecipient = (index) => {
    setSettingsForm(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        recipients: prev.alerts.recipients.filter((_, i) => i !== index)
      }
    }));
  };

  // Handle alert condition changes
  const handleAlertConditionChange = (metric, field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        conditions: {
          ...prev.alerts.conditions,
          [metric]: {
            ...prev.alerts.conditions[metric],
            [field]: value
          }
        }
      }
    }));
  };

  // Handle combination alert changes
  const handleCombinationAlertChange = (alertId, field, value) => {
    setSettingsForm(prev => ({
      ...prev,
      alerts: {
        ...prev.alerts,
        combinationAlerts: prev.alerts.combinationAlerts.map(alert => {
          if (alert.id === alertId) {
            if (field.includes('.')) {
              const [category, subField, type] = field.split('.');
              return {
                ...alert,
                conditions: {
                  ...alert.conditions,
                  [category]: {
                    ...alert.conditions[category],
                    [subField]: type ? value : parseFloat(value)
                  }
                }
              };
            }
            return { ...alert, [field]: value };
          }
          return alert;
        })
      }
    }));
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      // Update device details
      const updatedDetails = {
        id: deviceDetails.id,
        icealert_id: deviceDetails.iceAlertSerial,
        device_name: settingsForm.name,
        location: settingsForm.location,
        part_number: settingsForm.partNumber,
        serial_number: settingsForm.serialNumber,
        temperature_min: parseFloat(settingsForm.normalRanges.temperature.min),
        temperature_max: parseFloat(settingsForm.normalRanges.temperature.max),
        humidity_min: parseFloat(settingsForm.normalRanges.humidity.min),
        humidity_max: parseFloat(settingsForm.normalRanges.humidity.max),
        flow_rate_min: parseFloat(settingsForm.normalRanges.flowRate.min),
        flow_rate_max: parseFloat(settingsForm.normalRanges.flowRate.max),
        flow_rate_warning_hours: parseFloat(settingsForm.alertThresholds.flowRate.warning),
        flow_rate_critical_hours: parseFloat(settingsForm.alertThresholds.flowRate.critical),
        email_alerts_enabled: settingsForm.alerts.enabled,
        temperature_alert_enabled: settingsForm.alerts.conditions.temperature.enabled,
        temperature_alert_threshold: parseFloat(settingsForm.alerts.conditions.temperature.threshold),
        humidity_alert_enabled: settingsForm.alerts.conditions.humidity.enabled,
        humidity_alert_threshold: parseFloat(settingsForm.alerts.conditions.humidity.threshold),
        flow_rate_alert_enabled: settingsForm.alerts.conditions.flowRate.enabled,
        no_flow_alert_minutes: parseFloat(settingsForm.alerts.conditions.flowRate.noFlowDuration),
        alert_recipients: settingsForm.alerts.recipients.filter(email => email.trim())
      };

      // Update device settings in the database
      await deviceService.updateDeviceSettings(deviceDetails.id, updatedDetails);

      // Update local state
      const mappedDeviceDetails = {
        ...deviceDetails,
        name: updatedDetails.device_name,
        location: updatedDetails.location,
        partNumber: updatedDetails.part_number,
        serialNumber: updatedDetails.serial_number,
        alerts: {
          enabled: updatedDetails.email_alerts_enabled,
          recipients: updatedDetails.alert_recipients,
          conditions: {
        temperature: {
              enabled: updatedDetails.temperature_alert_enabled,
              threshold: updatedDetails.temperature_alert_threshold
        },
        humidity: {
              enabled: updatedDetails.humidity_alert_enabled,
              threshold: updatedDetails.humidity_alert_threshold
        },
        flowRate: {
              enabled: updatedDetails.flow_rate_alert_enabled,
              noFlowDuration: updatedDetails.no_flow_alert_minutes
            }
          }
        }
      };
      setDeviceDetails(mappedDeviceDetails);

      // Update NORMAL_RANGES
      Object.assign(NORMAL_RANGES, {
        temperature: {
          min: updatedDetails.temperature_min,
          max: updatedDetails.temperature_max
        },
        humidity: {
          min: updatedDetails.humidity_min,
          max: updatedDetails.humidity_max
        },
        flowRate: {
          min: updatedDetails.flow_rate_min,
          max: updatedDetails.flow_rate_max,
          warningTimeThreshold: updatedDetails.flow_rate_warning_hours,
          criticalTimeThreshold: updatedDetails.flow_rate_critical_hours
        }
      });

      // Start monitoring for alerts if enabled
      if (updatedDetails.email_alerts_enabled) {
        startAlertMonitoring();
      }

      // Close the modal
      setIsSettingsOpen(false);

    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  // Calculate advanced statistics
  const calculateAdvancedStats = (data, metric) => {
    if (!data || data.length === 0) return null;
    
    const values = data.map(item => item[metric]);
    const sortedValues = [...values].sort((a, b) => a - b);
    const len = sortedValues.length;
    
    const median = len % 2 === 0
      ? (sortedValues[len / 2 - 1] + sortedValues[len / 2]) / 2
      : sortedValues[Math.floor(len / 2)];
    
    const mean = values.reduce((a, b) => a + b, 0) / len;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / len;
    const stdDev = Math.sqrt(variance);
    
    const firstHalf = values.slice(0, Math.floor(len / 2));
    const secondHalf = values.slice(Math.floor(len / 2));
    const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    const trend = secondHalfAvg - firstHalfAvg;

    return {
      min: Math.min(...values).toFixed(1),
      max: Math.max(...values).toFixed(1),
      avg: mean.toFixed(1),
      median: median.toFixed(1),
      stdDev: stdDev.toFixed(2),
      trend: trend.toFixed(2),
      anomalies: values.filter(v => Math.abs(v - mean) > 2 * stdDev).length,
      stability: ((1 - (stdDev / mean)) * 100).toFixed(1)
    };
  };

  // Function to check if a value is within normal range
  const isInRange = (value, metric) => {
    if (!value) return true;
    const range = NORMAL_RANGES[metric];
    return value >= range.min && value <= range.max;
  };

  // Generate data for metrics
  const generateDataForMetric = (metric, timeRange) => {
    if (!deviceDetails) return [];

    const hoursMap = {
      '12h': 24,     // 24 points for 12 hours (30-min intervals)
      '24h': 48,     // 48 points for 24 hours (30-min intervals)
      '48h': 96      // 96 points for 48 hours (30-min intervals)
    };
    const points = hoursMap[timeRange] || 48;

    const baseValues = {
      temperature: parseFloat(deviceDetails.temperature),
      humidity: parseFloat(deviceDetails.humidity),
      flowRate: parseFloat(deviceDetails.flowRate)
    };

    const variations = {
      temperature: () => baseValues.temperature + (Math.random() * 2 - 1),
      humidity: () => baseValues.humidity + (Math.random() * 4 - 2),
      flowRate: () => baseValues.flowRate * (1 + (Math.random() * 0.4 - 0.2))
    };

    return Array.from({ length: points }, (_, i) => ({
      timestamp: new Date(Date.now() - (points - 1 - i) * 1800000).toISOString(),
      [metric]: variations[metric]()
    }));
  };

  // Handle individual metric updates
  const handleTimeRangeChange = (metric, newRange) => {
    setTimeRanges(prev => ({
      ...prev,
      [metric]: newRange
    }));

    setHistoricalData(prev => ({
      ...prev,
      [metric]: generateDataForMetric(metric, newRange)
    }));
  };

  // Function to monitor device data and trigger alerts
  const startAlertMonitoring = () => {
    if (window.alertMonitoringInterval) {
      clearInterval(window.alertMonitoringInterval);
    }

    window.alertMonitoringInterval = setInterval(async () => {
      try {
        const currentData = {
          name: deviceDetails.name,
          temperature: historicalData.temperature[historicalData.temperature.length - 1]?.temperature,
          humidity: historicalData.humidity[historicalData.humidity.length - 1]?.humidity,
          flowRate: historicalData.flowRate[historicalData.flowRate.length - 1]?.flowRate
        };

        const response = await fetch(`${API_BASE_URL}/api/alerts/check/${icealertId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentData)
        });

        if (!response.ok) {
          throw new Error('Failed to check alerts');
        }
      } catch (error) {
        console.error('Error checking alerts:', error);
      }
    }, 60000); // Check every minute
  };

  // Clean up monitoring interval on component unmount
  useEffect(() => {
    return () => {
      if (window.alertMonitoringInterval) {
        clearInterval(window.alertMonitoringInterval);
      }
    };
  }, []);

  // Initial data load
  useEffect(() => {
    if (!deviceDetails) {
      return;
    }

    // Only generate initial data if we don't have real data
    if (!historicalData.temperature.length) {
      // Generate initial data for all metrics
      const initialData = {
        temperature: generateDataForMetric('temperature', timeRanges.temperature),
        humidity: generateDataForMetric('humidity', timeRanges.humidity),
        flowRate: generateDataForMetric('flowRate', timeRanges.flowRate)
      };

      setHistoricalData(initialData);
    }
  }, [deviceDetails, historicalData.temperature.length]); // Depend on deviceDetails and whether we have real data

  // Add export data function
  const handleExportData = () => {
    try {
      if (!historicalData.temperature?.length) {
        console.error('No data available to export');
        return;
      }

      const getStatusForMetric = (value, metric) => {
        if (value === undefined || value === null) return 'No Data';
        return (value >= NORMAL_RANGES[metric].min && 
                value <= NORMAL_RANGES[metric].max) ? 'Normal' : 'Out of Range';
      };

      const formatTimestamp = (timestamp) => {
        try {
          return new Date(timestamp).toLocaleString();
        } catch (e) {
          return timestamp;
        }
      };

      const exportData = historicalData.temperature.map((temp, index) => ({
        timestamp: formatTimestamp(temp.timestamp),
        temperature: temp.temperature?.toFixed(2) ?? 'N/A',
        humidity: historicalData.humidity[index]?.humidity?.toFixed(2) ?? 'N/A',
        flowRate: historicalData.flowRate[index]?.flowRate?.toFixed(2) ?? 'N/A',
        temperatureStatus: getStatusForMetric(temp.temperature, 'temperature'),
        humidityStatus: getStatusForMetric(historicalData.humidity[index]?.humidity, 'humidity'),
        flowRateStatus: getStatusForMetric(historicalData.flowRate[index]?.flowRate, 'flowRate')
      }));

      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        return `"${String(value).replace(/"/g, '""')}"`;
      };

      const headers = [
        'Timestamp',
        'Temperature (°C)',
        'Temperature Status',
        'Humidity (%)',
        'Humidity Status',
        'Flow Rate (L/min)',
        'Flow Rate Status'
      ];

      const deviceInfo = [
        ['Device Information'],
        [`Device Name,${escapeCSV(deviceDetails.name)}`],
        [`Location,${escapeCSV(deviceDetails.location)}`],
        [`Part Number,${escapeCSV(deviceDetails.partNumber)}`],
        [`Serial Number,${escapeCSV(deviceDetails.serialNumber)}`],
        [`IceAlert ID,${escapeCSV(deviceDetails.iceAlertSerial)}`],
        [''],
        ['Normal Operating Ranges'],
        [`Temperature,${NORMAL_RANGES.temperature.min}°C - ${NORMAL_RANGES.temperature.max}°C`],
        [`Humidity,${NORMAL_RANGES.humidity.min}% - ${NORMAL_RANGES.humidity.max}%`],
        [`Flow Rate,${NORMAL_RANGES.flowRate.min} L/min - ${NORMAL_RANGES.flowRate.max} L/min`],
        [''],
        headers,
      ];

      const dataRows = exportData.map(row => [
        escapeCSV(row.timestamp),
        escapeCSV(row.temperature),
        escapeCSV(row.temperatureStatus),
        escapeCSV(row.humidity),
        escapeCSV(row.humidityStatus),
        escapeCSV(row.flowRate),
        escapeCSV(row.flowRateStatus)
      ]);

      const csvContent = [
        ...deviceInfo,
        ...dataRows
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `${deviceDetails.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_data_export_${
        new Date().toISOString().split('T')[0]
      }.csv`;

      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading device data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
  }

  if (!deviceDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate('/')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors"
            >
              <span className="text-xl">←</span>
              <span className="font-medium">Dashboard</span>
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
                <span>❄️</span>
                Device Analytics
              </h1>
            </div>
          </div>

          {/* Device Info Bar */}
          <div className="flex justify-between items-center py-3 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <div>
                <h2 className="text-lg font-semibold text-blue-900">{deviceDetails?.name}</h2>
                <p className="text-sm text-gray-600">{deviceDetails?.location}</p>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <p className="text-gray-500">Part Number</p>
                  <p className="font-medium">{deviceDetails?.partNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">Serial Number</p>
                  <p className="font-medium">{deviceDetails?.serialNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500">IceAlert ID</p>
                  <p className="font-medium">{deviceDetails?.iceAlertSerial}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Device Settings</span>
              </button>
              <button 
                onClick={handleExportData}
                className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <span>Export Data</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats */}
        <QuickStats deviceDetails={deviceDetails} />

        {/* Charts */}
        <ChartComponent
          data={historicalData.temperature}
          metric="temperature"
          title="Temperature"
          color="#3b82f6"
          unit="°C"
          stats={calculateAdvancedStats(historicalData.temperature, 'temperature')}
          isInRange={(value) => isInRange(value, 'temperature')}
          timeRange={timeRanges.temperature}
          onTimeRangeChange={handleTimeRangeChange}
        />

        <ChartComponent
          data={historicalData.flowRate}
          metric="flowRate"
          title="Flow Rate"
          color="#10b981"
          unit=" L/min"
          stats={calculateAdvancedStats(historicalData.flowRate, 'flowRate')}
          isInRange={(value) => isInRange(value, 'flowRate')}
          timeRange={timeRanges.flowRate}
          onTimeRangeChange={handleTimeRangeChange}
        />

        <ChartComponent
          data={historicalData.humidity}
          metric="humidity"
          title="Humidity"
          color="#6366f1"
          unit="%"
          stats={calculateAdvancedStats(historicalData.humidity, 'humidity')}
          isInRange={(value) => isInRange(value, 'humidity')}
          timeRange={timeRanges.humidity}
          onTimeRangeChange={handleTimeRangeChange}
        />
                    </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settingsForm={settingsForm}
        handleSettingsChange={handleSettingsChange}
        handleEmailChange={handleEmailChange}
        addEmailRecipient={addEmailRecipient}
        removeEmailRecipient={removeEmailRecipient}
        handleAlertConditionChange={handleAlertConditionChange}
        handleCombinationAlertChange={handleCombinationAlertChange}
        handleSaveSettings={handleSaveSettings}
      />
    </div>
  );
};

export default DeviceAnalytics;
