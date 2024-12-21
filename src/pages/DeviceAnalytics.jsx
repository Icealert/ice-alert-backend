import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot, ReferenceLine } from 'recharts';
import API_BASE_URL from '../api/config';
import deviceService from '../api/deviceService';

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
    normalRanges: {
      temperature: { min: 20, max: 25 },
      humidity: { min: 45, max: 55 },
      flowRate: { min: 1.5, max: 3.0 }
    },
    alertThresholds: {
      flowRate: {
        warning: 2,
        critical: 4,
        noFlowDuration: 30 // Default 30 minutes
      }
    },
    alerts: {
      enabled: true,
      recipients: [''],
      conditions: {
        temperature: {
          enabled: true,
          outOfRange: true,
          threshold: true,
          thresholdValue: 30,
          frequency: 'immediate'
        },
        humidity: {
          enabled: true,
          outOfRange: true,
          threshold: true,
          thresholdValue: 60,
          frequency: 'immediate'
        },
        flowRate: {
          enabled: true,
          outOfRange: true,
          noFlow: true,
          noFlowDuration: 30,
          frequency: 'immediate'
        }
      },
      combinationAlerts: [
        {
          id: 1,
          enabled: false,
          name: "Temperature and Flow Issues",
          conditions: {
            temperature: {
              enabled: true,
              outOfRange: true
            },
            flowRate: {
              enabled: true,
              noFlow: true,
              duration: 15
            }
          },
          frequency: 'immediate'
        },
        {
          id: 2,
          enabled: false,
          name: "All Parameters Alert",
          conditions: {
            temperature: {
              enabled: true,
              outOfRange: true
            },
            humidity: {
              enabled: true,
              outOfRange: true
            },
            flowRate: {
              enabled: true,
              noFlow: true,
              duration: 15
            }
          },
          frequency: 'immediate'
        }
      ]
    }
  });

  // Initialize settings form when device details are available
  useEffect(() => {
    if (deviceDetails) {
      setSettingsForm({
        name: deviceDetails.name,
        location: deviceDetails.location,
        partNumber: deviceDetails.partNumber,
        serialNumber: deviceDetails.serialNumber,
        normalRanges: { ...NORMAL_RANGES },
        alertThresholds: {
          flowRate: {
            warning: NORMAL_RANGES.flowRate.warningTimeThreshold,
            critical: NORMAL_RANGES.flowRate.criticalTimeThreshold,
            noFlowDuration: deviceDetails.noFlowDuration || 30
          }
        },
        alerts: deviceDetails.alerts || {
          enabled: true,
          recipients: [''],
          conditions: {
            temperature: {
              enabled: true,
              outOfRange: true,
              threshold: true,
              thresholdValue: 30,
              frequency: 'immediate'
            },
            humidity: {
              enabled: true,
              outOfRange: true,
              threshold: true,
              thresholdValue: 60,
              frequency: 'immediate'
            },
            flowRate: {
              enabled: true,
              outOfRange: true,
              noFlow: true,
              noFlowDuration: deviceDetails.noFlowDuration || 30,
              frequency: 'immediate'
            }
          },
          combinationAlerts: [
            {
              id: 1,
              enabled: false,
              name: "Temperature and Flow Issues",
              conditions: {
                temperature: {
                  enabled: true,
                  outOfRange: true
                },
                flowRate: {
                  enabled: true,
                  noFlow: true,
                  duration: 15
                }
              },
              frequency: 'immediate'
            },
            {
              id: 2,
              enabled: false,
              name: "All Parameters Alert",
              conditions: {
                temperature: {
                  enabled: true,
                  outOfRange: true
                },
                humidity: {
                  enabled: true,
                  outOfRange: true
                },
                flowRate: {
                  enabled: true,
                  noFlow: true,
                  duration: 15
                }
              },
              frequency: 'immediate'
            }
          ]
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

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      // Update device details
      const updatedDetails = {
        ...deviceDetails,
        name: settingsForm.name,
        location: settingsForm.location,
        partNumber: settingsForm.partNumber,
        serialNumber: settingsForm.serialNumber
      };
      setDeviceDetails(updatedDetails);

      // Create a new NORMAL_RANGES object to trigger re-renders
      const updatedRanges = {
        temperature: {
          ...NORMAL_RANGES.temperature,
          min: parseFloat(settingsForm.normalRanges.temperature.min),
          max: parseFloat(settingsForm.normalRanges.temperature.max)
        },
        humidity: {
          ...NORMAL_RANGES.humidity,
          min: parseFloat(settingsForm.normalRanges.humidity.min),
          max: parseFloat(settingsForm.normalRanges.humidity.max)
        },
        flowRate: {
          ...NORMAL_RANGES.flowRate,
          min: parseFloat(settingsForm.normalRanges.flowRate.min),
          max: parseFloat(settingsForm.normalRanges.flowRate.max),
          warningTimeThreshold: parseFloat(settingsForm.alertThresholds.flowRate.warning),
          criticalTimeThreshold: parseFloat(settingsForm.alertThresholds.flowRate.critical)
        }
      };

      // Update the NORMAL_RANGES object
      Object.assign(NORMAL_RANGES, updatedRanges);

      // Save alert settings to backend
      const alertSettings = {
        icealert_id: icealertId,
        enabled: settingsForm.alerts.enabled,
        recipients: settingsForm.alerts.recipients.filter(email => email.trim()),
        conditions: settingsForm.alerts.conditions,
        combinationAlerts: settingsForm.alerts.combinationAlerts,
        normalRanges: updatedRanges
      };

      await deviceService.updateAlertSettings(icealertId, alertSettings);

      // Force re-generation of data with new ranges
      const newData = {
        temperature: generateDataForMetric('temperature', timeRanges.temperature),
        humidity: generateDataForMetric('humidity', timeRanges.humidity),
        flowRate: generateDataForMetric('flowRate', timeRanges.flowRate)
      };

      // Update historical data to trigger re-renders
      setHistoricalData(newData);

      // Start monitoring for alerts if enabled
      if (alertSettings.enabled) {
        startAlertMonitoring();
      }

      // Close the modal
      setIsSettingsOpen(false);

    } catch (error) {
      console.error('Error saving settings:', error);
      // Show error message to user
      alert('Failed to save settings. Please try again.');
    }
  };

  // Function to monitor device data and trigger alerts
  const startAlertMonitoring = () => {
    // Clear any existing interval
    if (window.alertMonitoringInterval) {
      clearInterval(window.alertMonitoringInterval);
    }

    // Set up new monitoring interval
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

  // Separate the data generation into its own function outside useEffect
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

  // Initial data load
  useEffect(() => {
    if (!deviceDetails) {
      navigate('/');
      return;
    }

    // Generate initial data for all metrics
    const initialData = {
      temperature: generateDataForMetric('temperature', timeRanges.temperature),
      humidity: generateDataForMetric('humidity', timeRanges.humidity),
      flowRate: generateDataForMetric('flowRate', timeRanges.flowRate)
    };

    setHistoricalData(initialData);
  }, [deviceDetails, navigate]); // Only depend on deviceDetails and navigate

  // Handle individual metric updates
  const handleTimeRangeChange = (metric, newRange) => {
    // Update the time range state
    setTimeRanges(prev => ({
      ...prev,
      [metric]: newRange
    }));

    // Immediately update only the changed metric's data
    setHistoricalData(prev => ({
      ...prev,
      [metric]: generateDataForMetric(metric, newRange)
    }));
  };

  const NORMAL_RANGES = {
    temperature: { min: 20, max: 25, unit: '°C' },
    flowRate: { 
      min: 1.5, 
      max: 3.0, 
      unit: 'L/min',
      criticalTimeThreshold: 4,
      warningTimeThreshold: 2
    },
    humidity: { min: 45, max: 55, unit: '%' }
  };

  const renderChart = (metric, title, color, unit) => {
    const stats = calculateAdvancedStats(historicalData[metric], metric);
    if (!stats) return null;
    
    const normalRange = NORMAL_RANGES[metric];
    
    const isInRange = (value) => {
      return value >= normalRange.min && value <= normalRange.max;
    };

    // Calculate time since last flow rate
    const getTimeSinceLastFlow = () => {
      if (metric !== 'flowRate') return null;
      
      const lastTimestamp = historicalData[metric][historicalData[metric].length - 1]?.timestamp;
      if (!lastTimestamp) return null;

      const lastTime = new Date(lastTimestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastTime) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes} minutes ago`;
      } else if (diffMinutes < 1440) { // less than 24 hours
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        return `${hours}h ${mins}m ago`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        const hours = Math.floor((diffMinutes % 1440) / 60);
        return `${days}d ${hours}h ago`;
      }
    };

    // Calculate flow status and warning level
    const getFlowStatus = () => {
      if (metric !== 'flowRate') return null;

      const lastTimestamp = historicalData[metric][historicalData[metric].length - 1]?.timestamp;
      if (!lastTimestamp) return { status: 'No Data', class: 'text-red-600' };

      const lastTime = new Date(lastTimestamp);
      const now = new Date();
      const diffHours = (now - lastTime) / (1000 * 60 * 60);

      if (diffHours >= normalRange.criticalTimeThreshold) {
        return { 
          status: 'Critical', 
          class: 'text-red-600 font-bold animate-pulse',
          alert: true
        };
      } else if (diffHours >= normalRange.warningTimeThreshold) {
        return { 
          status: 'Warning', 
          class: 'text-amber-500 font-bold',
          alert: true
        };
      }
      return { 
        status: 'Active', 
        class: 'text-green-600'
      };
    };

    const timeSinceLastFlow = getTimeSinceLastFlow();
    const flowStatus = getFlowStatus();

    // Calculate anomaly details
    const getAnomalyDetails = () => {
      const values = historicalData[metric].map(item => item[metric]);
      const anomalies = values.filter(v => !isInRange(v));
      const anomalyCount = anomalies.length;
      const severity = anomalyCount > 5 ? 'High' : anomalyCount > 2 ? 'Medium' : 'Low';
      
      return {
        count: anomalyCount,
        severity,
        percentage: ((anomalyCount / values.length) * 100).toFixed(1)
      };
    };

    const anomalyDetails = getAnomalyDetails();
    const lastRecordedValue = historicalData[metric][historicalData[metric].length - 1]?.[metric];

    return (
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold">{title}</h3>
            <select 
              className="border rounded-lg px-3 py-1.5 bg-white shadow-sm text-sm"
              value={timeRanges[metric]}
              onChange={(e) => handleTimeRangeChange(metric, e.target.value)}
              aria-label={`Select Time Range for ${title}`}
            >
              <option value="12h">Last 12 Hours</option>
              <option value="24h">Last 24 Hours</option>
              <option value="48h">Last 48 Hours</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            Normal Range: {normalRange.min} - {normalRange.max}{unit}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Primary Stats - Enhanced for Flow Rate */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-xs mb-1 group relative cursor-help">
              Last Recorded
              <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                Most recent measurement taken from the device
              </span>
            </div>
            <div className={`text-2xl font-bold ${
              isInRange(lastRecordedValue) ? 'text-gray-900' : 'text-red-600'
            }`}>
              {lastRecordedValue?.toFixed(1)}{unit}
            </div>
            <div className="text-sm text-gray-500">
              {new Date(historicalData[metric][historicalData[metric].length - 1]?.timestamp).toLocaleTimeString()}
            </div>
            {metric === 'flowRate' && (
              <>
                <div className={`text-sm mt-1 ${flowStatus.class}`}>
                  {flowStatus.status}
                  {timeSinceLastFlow && (
                    <span className="block text-xs mt-0.5">
                      {timeSinceLastFlow}
                    </span>
                  )}
                </div>
                {flowStatus.alert && (
                  <div className="mt-2 text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {flowStatus.status === 'Critical' ? 
                      'Immediate attention required' : 
                      'Check system soon'
                    }
                  </div>
                )}
              </>
            )}
            {metric !== 'flowRate' && (
              <div className="text-sm text-gray-500 mt-1">
                {isInRange(lastRecordedValue) ? 'Within Range' : 'Out of Range'}
              </div>
            )}
          </div>
          
          {/* Min/Max Card */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-xs mb-1 group relative cursor-help">
              Range
              <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                The lowest and highest values recorded in the selected time period
              </span>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-sm ${
                isInRange(parseFloat(stats.min)) ? 'text-blue-600' : 'text-red-600'
              }`}>
                Min: {stats.min}{unit}
              </span>
              <span className="text-gray-400 mx-1">|</span>
              <span className={`text-sm ${
                isInRange(parseFloat(stats.max)) ? 'text-blue-600' : 'text-red-600'
              }`}>
                Max: {stats.max}{unit}
              </span>
            </div>
            {metric === 'flowRate' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="text-xs text-gray-600">Warning Thresholds:</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <span className="text-xs text-amber-600">
                    Warning after {normalRange.warningTimeThreshold}h no flow
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs text-red-600">
                    Critical after {normalRange.criticalTimeThreshold}h no flow
                  </span>
                </div>
              </div>
            )}
            {metric === 'temperature' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="text-xs text-gray-600">Temperature Trend:</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      parseFloat(stats.trend) > 0.5 ? 'bg-red-500' :
                      parseFloat(stats.trend) < -0.5 ? 'bg-blue-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-xs">
                      {parseFloat(stats.trend) > 0.5 ? 'Rising' :
                       parseFloat(stats.trend) < -0.5 ? 'Falling' :
                       'Stable'}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    parseFloat(stats.trend) > 0.5 ? 'text-red-600' :
                    parseFloat(stats.trend) < -0.5 ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {Math.abs(parseFloat(stats.trend)).toFixed(1)}{unit}/h
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">
                    Stability: {stats.stability}%
                  </span>
                </div>
              </div>
            )}
            {metric === 'humidity' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="text-xs text-gray-600">Humidity Pattern:</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      parseFloat(stats.trend) > 2 ? 'bg-red-500' :
                      parseFloat(stats.trend) < -2 ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-xs">
                      {parseFloat(stats.trend) > 2 ? 'Increasing' :
                       parseFloat(stats.trend) < -2 ? 'Decreasing' :
                       'Steady'}
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    parseFloat(stats.trend) > 2 ? 'text-red-600' :
                    parseFloat(stats.trend) < -2 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {Math.abs(parseFloat(stats.trend)).toFixed(1)}%/h
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">
                      Fluctuation
                    </span>
                  </div>
                  <span className={`text-xs font-medium ${
                    parseFloat(stats.stdDev) > 3 ? 'text-red-600' :
                    parseFloat(stats.stdDev) > 1.5 ? 'text-amber-600' :
                    'text-blue-600'
                  }`}>
                    ±{stats.stdDev}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Anomaly Card with tooltips */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-xs mb-1 group relative cursor-help">
              Anomalies Detected
              <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                Values that deviate significantly from the normal pattern
              </span>
            </div>
            <div className={`text-lg font-semibold flex items-center gap-1 group relative cursor-help
              ${anomalyDetails.count > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {anomalyDetails.count}
              <span className="text-xs text-gray-500 font-normal ml-1">
                ({anomalyDetails.percentage}% of readings)
              </span>
              {anomalyDetails.count > 0 && (
                <div className="hidden group-hover:block absolute bottom-full left-0 w-64 bg-gray-900 text-white text-xs rounded p-2 mb-1 z-10">
                  <div className="font-normal mb-1">Out of range values detected at:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {historicalData[metric]
                      .map((item, i) => ({
                        value: item[metric],
                        time: new Date(item.timestamp).toLocaleTimeString(),
                        isAnomaly: !isInRange(item[metric])
                      }))
                      .filter(item => item.isAnomaly)
                      .map((anomaly, i) => (
                        <div key={i} className="flex justify-between items-center border-t border-gray-700 pt-1 first:border-t-0 first:pt-0">
                          <span>{anomaly.time}</span>
                          <span className={`font-medium ${
                            anomaly.value > NORMAL_RANGES[metric].max ? 'text-red-300' : 'text-blue-300'
                          }`}>
                            {anomaly.value.toFixed(2)}{unit}
                            {anomaly.value > NORMAL_RANGES[metric].max ? ' (High)' : ' (Low)'}
                          </span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>

            {/* Metric-specific tooltips */}
            {metric === 'temperature' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-xs group relative cursor-help">
                  <span className="text-gray-600">
                    Deviation Threshold
                    <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                      Temperature changes beyond this range are considered unusual
                    </span>
                  </span>
                  <span className="font-medium">��{(parseFloat(stats.stdDev) * 2).toFixed(1)}°C</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anomalyDetails.count > 5 ? 'bg-red-500' : 
                    anomalyDetails.count > 0 ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {anomalyDetails.count === 0 ? 'Temperature stable' :
                     anomalyDetails.count > 5 ? 'Frequent anomalies' :
                     'Occasional anomalies'}
                  </span>
                </div>
              </div>
            )}

            {metric === 'humidity' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-xs group relative cursor-help">
                  <span className="text-gray-600">
                    Deviation Range
                    <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                      Humidity variations beyond this range indicate unusual conditions
                    </span>
                  </span>
                  <span className="font-medium">±{(parseFloat(stats.stdDev) * 2).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anomalyDetails.count > 5 ? 'bg-red-500' : 
                    anomalyDetails.count > 0 ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {anomalyDetails.count === 0 ? 'Humidity consistent' :
                     anomalyDetails.count > 5 ? 'High variability' :
                     'Minor fluctuations'}
                  </span>
                </div>
              </div>
            )}

            {metric === 'flowRate' && (
              <div className="mt-3 space-y-1.5 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-xs group relative cursor-help">
                  <span className="text-gray-600">
                    Flow Variation
                    <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                      Normal range of flow rate fluctuation. Larger variations may indicate issues
                    </span>
                  </span>
                  <span className="font-medium">±{(parseFloat(stats.stdDev) * 2).toFixed(2)} L/min</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    anomalyDetails.count > 5 ? 'bg-red-500' : 
                    anomalyDetails.count > 0 ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`}></div>
                  <span className="text-xs text-gray-600">
                    {anomalyDetails.count === 0 ? 'Flow rate stable' :
                     anomalyDetails.count > 5 ? 'Irregular flow detected' :
                     'Minor flow variations'}
                  </span>
                </div>
                {anomalyDetails.count > 0 && (
                  <div className="text-xs text-amber-600 mt-1">
                    Recommend flow system check
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Statistics Card */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-xs mb-1">Analysis</div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm group relative cursor-help">
                <span className="text-gray-600">
                  Median
                  <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                    The middle value when all readings are ordered from lowest to highest
                  </span>
                </span>
                <span className={`font-medium ${
                  isInRange(parseFloat(stats.median)) ? 'text-gray-900' : 'text-red-600'
                }`}>
                  {stats.median}{unit}
                </span>
              </div>
              <div className="flex justify-between text-sm group relative cursor-help">
                <span className="text-gray-600">
                  Std Dev
                  <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                    Standard Deviation: Measures how spread out the values are from the average
                  </span>
                </span>
                <span className="font-medium">{stats.stdDev}{unit}</span>
              </div>
              <div className="flex justify-between text-sm group relative cursor-help">
                <span className="text-gray-600">
                  Out of Range
                  <span className="hidden group-hover:block absolute bottom-full left-0 w-48 bg-gray-900 text-white text-xs rounded p-2 mb-1">
                    Number of readings that fall outside the normal operating range
                  </span>
                </span>
                <span className={`font-medium ${
                  historicalData[metric].filter(d => !isInRange(d[metric])).length > 0 ? 
                  'text-red-600' : 'text-green-600'
                }`}>
                  {historicalData[metric].filter(d => !isInRange(d[metric])).length} readings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={historicalData[metric]} 
              margin={{ top: 10, right: 10, left: 10, bottom: 12 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(timestamp) => {
                  const date = new Date(timestamp);
                  return date.toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit'
                  });
                }}
                interval="preserveStartEnd"
                tick={{ fontSize: 12, fill: '#4B5563' }}
                tickLine={{ stroke: '#9CA3AF' }}
                axisLine={{ stroke: '#9CA3AF' }}
                minTickGap={30}
                height={35}
                label={{
                  value: 'Time',
                  position: 'bottom',
                  offset: -2,
                  fontSize: 12,
                  fill: '#4B5563'
                }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}${unit}`}
                tick={{ fontSize: 12, fill: '#4B5563' }}
                tickLine={{ stroke: '#9CA3AF' }}
                axisLine={{ stroke: '#9CA3AF' }}
                label={{
                  value: title,
                  angle: -90,
                  position: 'insideLeft',
                  offset: 5,
                  fontSize: 12,
                  fill: '#4B5563'
                }}
                domain={[
                  (dataMin) => Math.floor(Math.min(normalRange.min * 0.95, dataMin)),
                  (dataMax) => Math.ceil(Math.max(normalRange.max * 1.05, dataMax))
                ]}
                allowDecimals={false}
                width={65}
              />
              {/* Normal range area */}
              <Area
                y1={normalRange.min}
                y2={normalRange.max}
                fill="#4ade8033"
                strokeWidth={0}
              />
              {/* Reference lines without labels */}
              <ReferenceLine
                y={normalRange.min}
                stroke="#4ade80"
                strokeDasharray="3 3"
              />
              <ReferenceLine
                y={normalRange.max}
                stroke="#4ade80"
                strokeDasharray="3 3"
              />
              <Tooltip 
                labelFormatter={(label) => {
                  const date = new Date(label);
                  return date.toLocaleString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                }}
                formatter={(value) => [
                  `${value.toFixed(2)}${unit} ${isInRange(value) ? '✓' : '⚠️'}`,
                  title
                ]}
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
                cursor={{ stroke: '#9CA3AF', strokeWidth: 1 }}
              />
              <Area 
                type="monotone" 
                dataKey={metric} 
                stroke={color} 
                fill={`${color}33`}
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: 'white',
                  stroke: color,
                  strokeWidth: 2
                }}
                activeDot={{
                  r: 5,
                  fill: color,
                  stroke: 'white',
                  strokeWidth: 2
                }}
              />
              {/* Anomaly dots */}
              {historicalData[metric]
                .map((item, i) => ({
                  ...item,
                  isAnomaly: !isInRange(item[metric])
                }))
                .filter(item => item.isAnomaly)
                .map((item, i) => (
                  <ReferenceDot
                    key={i}
                    x={item.timestamp}
                    y={item[metric]}
                    r={4}
                    fill="red"
                    stroke="white"
                    strokeWidth={1}
                  />
                ))
              }
            </AreaChart>
          </ResponsiveContainer>
          {/* Chart Legend - Further reduced top margin */}
          <div className="flex items-center justify-center gap-6 mt-0.5 mb-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span>Actual Value</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Out of Range</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-green-500"></div>
              <span>Normal Range ({normalRange.min}-{normalRange.max}{unit})</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Add export data function
  const handleExportData = () => {
    try {
      // Ensure we have data to export
      if (!historicalData.temperature?.length) {
        console.error('No data available to export');
        return;
      }

      // Helper function to check if value is in range
      const getStatusForMetric = (value, metric) => {
        if (value === undefined || value === null) return 'No Data';
        return (value >= NORMAL_RANGES[metric].min && 
                value <= NORMAL_RANGES[metric].max) ? 'Normal' : 'Out of Range';
      };

      // Format timestamp helper
      const formatTimestamp = (timestamp) => {
        try {
          return new Date(timestamp).toLocaleString();
        } catch (e) {
          return timestamp;
        }
      };

      // Combine all metrics data with proper timestamps
      const exportData = historicalData.temperature.map((temp, index) => ({
        timestamp: formatTimestamp(temp.timestamp),
        temperature: temp.temperature?.toFixed(2) ?? 'N/A',
        humidity: historicalData.humidity[index]?.humidity?.toFixed(2) ?? 'N/A',
        flowRate: historicalData.flowRate[index]?.flowRate?.toFixed(2) ?? 'N/A',
        temperatureStatus: getStatusForMetric(temp.temperature, 'temperature'),
        humidityStatus: getStatusForMetric(historicalData.humidity[index]?.humidity, 'humidity'),
        flowRateStatus: getStatusForMetric(historicalData.flowRate[index]?.flowRate, 'flowRate')
      }));

      // Create CSV content with proper escaping
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

      // Create and trigger download
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
      // Here you might want to show a user-friendly error message
      // using your preferred notification system
    }
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

  // Add handler for combination alerts
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

  const fetchDeviceData = async () => {
    try {
      const data = await deviceService.getDeviceByIceAlertId(icealertId);
      setDeviceDetails(data);
    } catch (error) {
      console.error('Error fetching device data:', error);
    }
  };

  const fetchReadings = async () => {
    try {
      const data = await deviceService.getDeviceReadings(icealertId, timeRange);
      setReadings(data);
    } catch (error) {
      console.error('Error fetching readings:', error);
    }
  };

  const fetchAlertSettings = async () => {
    try {
      const data = await deviceService.getAlertSettings(icealertId);
      setAlertSettings(data);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    }
  };

  // Add useEffect to fetch device data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await deviceService.getDeviceByIceAlertId(icealertId);
        setDeviceDetails(data);
      } catch (error) {
        console.error('Error fetching device data:', error);
        setError(error.message || 'Failed to load device data');
        // If there's an error and no state data, navigate back
        if (!location.state?.deviceDetails) {
          navigate('/', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we don't have device details from state
    if (!location.state?.deviceDetails) {
      fetchData();
    }
  }, [icealertId, navigate, location.state]);

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
      {/* Enhanced Header Section */}
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Device Settings</h2>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Device Name
                        </label>
                        <input
                          type="text"
                          value={settingsForm.name}
                          onChange={(e) => handleSettingsChange('name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={settingsForm.location}
                          onChange={(e) => handleSettingsChange('location', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Part Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.partNumber}
                          onChange={(e) => handleSettingsChange('partNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Serial Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.serialNumber}
                          onChange={(e) => handleSettingsChange('serialNumber', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        IceAlert ID (Read Only)
                      </label>
                      <input
                        type="text"
                        value={deviceDetails?.iceAlertSerial || ''}
                        disabled
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Normal Ranges */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Normal Operating Ranges</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Temperature Range (°C)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.temperature.min}
                            onChange={(e) => handleSettingsChange('normalRanges.temperature.min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.temperature.max}
                            onChange={(e) => handleSettingsChange('normalRanges.temperature.max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Humidity Range (%)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.humidity.min}
                            onChange={(e) => handleSettingsChange('normalRanges.humidity.min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.humidity.max}
                            onChange={(e) => handleSettingsChange('normalRanges.humidity.max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Flow Rate Range (L/min)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.flowRate.min}
                            onChange={(e) => handleSettingsChange('normalRanges.flowRate.min', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                          <input
                            type="number"
                            value={settingsForm.normalRanges.flowRate.max}
                            onChange={(e) => handleSettingsChange('normalRanges.flowRate.max', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Thresholds */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Flow Rate Alert Thresholds</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        No Flow Detection Thresholds (hours)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Warning After</label>
                          <input
                            type="number"
                            value={settingsForm.alertThresholds.flowRate.warning}
                            onChange={(e) => handleSettingsChange('alertThresholds.flowRate.warning', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Critical After</label>
                          <input
                            type="number"
                            value={settingsForm.alertThresholds.flowRate.critical}
                            onChange={(e) => handleSettingsChange('alertThresholds.flowRate.critical', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alert Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Settings</h3>
                  
                  {/* Global Alert Toggle */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">Enable Email Alerts</label>
                      <button
                        type="button"
                        className={`${
                          settingsForm.alerts.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                        onClick={() => setSettingsForm(prev => ({
                          ...prev,
                          alerts: { ...prev.alerts, enabled: !prev.alerts.enabled }
                        }))}
                      >
                        <span
                          className={`${
                            settingsForm.alerts.enabled ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                        >
                          <span
                            className={`${
                              settingsForm.alerts.enabled ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                              <path
                                d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </span>
                          <span
                            className={`${
                              settingsForm.alerts.enabled ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'
                            } absolute inset-0 flex h-full w-full items-center justify-center transition-opacity`}
                          >
                            <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 12 12">
                              <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                            </svg>
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>

                  {settingsForm.alerts.enabled && (
                    <>
                      {/* Email Recipients */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Recipients
                        </label>
                        <div className="space-y-3">
                          {settingsForm.alerts.recipients.map((email, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(index, e.target.value)}
                                placeholder="Enter email address"
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                              {settingsForm.alerts.recipients.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeEmailRecipient(index)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addEmailRecipient}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Another Recipient
                          </button>
                        </div>
                      </div>

                      {/* Alert Conditions */}
                      <div className="space-y-6">
                        {/* Temperature Alerts */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Temperature Alerts</h4>
                            <button
                              type="button"
                              className={`${
                                settingsForm.alerts.conditions.temperature.enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              onClick={() => handleAlertConditionChange('temperature', 'enabled', 
                                !settingsForm.alerts.conditions.temperature.enabled)}
                            >
                              <span
                                className={`${
                                  settingsForm.alerts.conditions.temperature.enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                          {settingsForm.alerts.conditions.temperature.enabled && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.temperature.outOfRange}
                                  onChange={(e) => handleAlertConditionChange('temperature', 'outOfRange', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert when temperature is out of normal range
                                </label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.temperature.threshold}
                                  onChange={(e) => handleAlertConditionChange('temperature', 'threshold', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert when temperature exceeds
                                </label>
                                <input
                                  type="number"
                                  value={settingsForm.alerts.conditions.temperature.thresholdValue}
                                  onChange={(e) => handleAlertConditionChange('temperature', 'thresholdValue', parseFloat(e.target.value))}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!settingsForm.alerts.conditions.temperature.threshold}
                                />
                                <span className="text-sm text-gray-700">°C</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Alert Frequency:</label>
                                <select
                                  value={settingsForm.alerts.conditions.temperature.frequency}
                                  onChange={(e) => handleAlertConditionChange('temperature', 'frequency', e.target.value)}
                                  className="text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="immediate">Immediate</option>
                                  <option value="5min">Every 5 minutes</option>
                                  <option value="15min">Every 15 minutes</option>
                                  <option value="1hour">Every hour</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Humidity Alerts */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Humidity Alerts</h4>
                            <button
                              type="button"
                              className={`${
                                settingsForm.alerts.conditions.humidity.enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              onClick={() => handleAlertConditionChange('humidity', 'enabled', 
                                !settingsForm.alerts.conditions.humidity.enabled)}
                            >
                              <span
                                className={`${
                                  settingsForm.alerts.conditions.humidity.enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                          {settingsForm.alerts.conditions.humidity.enabled && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.humidity.outOfRange}
                                  onChange={(e) => handleAlertConditionChange('humidity', 'outOfRange', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert when humidity is out of normal range
                                </label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.humidity.threshold}
                                  onChange={(e) => handleAlertConditionChange('humidity', 'threshold', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert when humidity exceeds
                                </label>
                                <input
                                  type="number"
                                  value={settingsForm.alerts.conditions.humidity.thresholdValue}
                                  onChange={(e) => handleAlertConditionChange('humidity', 'thresholdValue', parseFloat(e.target.value))}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  disabled={!settingsForm.alerts.conditions.humidity.threshold}
                                />
                                <span className="text-sm text-gray-700">%</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Alert Frequency:</label>
                                <select
                                  value={settingsForm.alerts.conditions.humidity.frequency}
                                  onChange={(e) => handleAlertConditionChange('humidity', 'frequency', e.target.value)}
                                  className="text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="immediate">Immediate</option>
                                  <option value="5min">Every 5 minutes</option>
                                  <option value="15min">Every 15 minutes</option>
                                  <option value="1hour">Every hour</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Flow Rate Alerts */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-medium text-gray-900">Flow Rate Alerts</h4>
                            <button
                              type="button"
                              className={`${
                                settingsForm.alerts.conditions.flowRate.enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              onClick={() => handleAlertConditionChange('flowRate', 'enabled', 
                                !settingsForm.alerts.conditions.flowRate.enabled)}
                            >
                              <span
                                className={`${
                                  settingsForm.alerts.conditions.flowRate.enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>
                          {settingsForm.alerts.conditions.flowRate.enabled && (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.flowRate.outOfRange}
                                  onChange={(e) => handleAlertConditionChange('flowRate', 'outOfRange', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert when flow rate is out of normal range
                                </label>
                              </div>
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={settingsForm.alerts.conditions.flowRate.noFlow}
                                  onChange={(e) => handleAlertConditionChange('flowRate', 'noFlow', e.target.checked)}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="text-sm text-gray-700">
                                  Alert on no flow detection
                                </label>
                              </div>
                              {settingsForm.alerts.conditions.flowRate.noFlow && (
                                <div className="flex items-center gap-3 ml-7">
                                  <label className="text-sm text-gray-700">
                                    Alert after
                                  </label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={settingsForm.alerts.conditions.flowRate.noFlowDuration}
                                    onChange={(e) => handleAlertConditionChange('flowRate', 'noFlowDuration', Math.max(1, parseInt(e.target.value)))}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  />
                                  <label className="text-sm text-gray-700">
                                    minutes of no flow
                                  </label>
                                  <div className="ml-2 group relative">
                                    <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="hidden group-hover:block absolute bottom-full left-0 w-64 bg-gray-900 text-white text-xs rounded p-2 mb-2">
                                      Set how long the system should wait without detecting flow before sending an alert.
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-700">Alert Frequency:</label>
                                <select
                                  value={settingsForm.alerts.conditions.flowRate.frequency}
                                  onChange={(e) => handleAlertConditionChange('flowRate', 'frequency', e.target.value)}
                                  className="text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                >
                                  <option value="immediate">Immediate</option>
                                  <option value="5min">Every 5 minutes</option>
                                  <option value="15min">Every 15 minutes</option>
                                  <option value="1hour">Every hour</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Combination Alerts */}
                {settingsForm.alerts.enabled && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Combination Alerts</h3>
                    <div className="space-y-6">
                      {settingsForm.alerts.combinationAlerts.map((alert) => (
                        <div key={alert.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-medium text-gray-900">{alert.name}</h4>
                              <div className="group relative">
                                <svg className="w-4 h-4 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="hidden group-hover:block absolute bottom-full left-0 w-64 bg-gray-900 text-white text-xs rounded p-2 mb-2">
                                  This alert will trigger only when all selected conditions are met simultaneously.
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={`${
                                alert.enabled ? 'bg-blue-600' : 'bg-gray-200'
                              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                              onClick={() => handleCombinationAlertChange(alert.id, 'enabled', !alert.enabled)}
                            >
                              <span
                                className={`${
                                  alert.enabled ? 'translate-x-5' : 'translate-x-0'
                                } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                              />
                            </button>
                          </div>

                          {alert.enabled && (
                            <div className="space-y-4">
                              {/* Temperature Condition */}
                              {alert.conditions.temperature && (
                                <div className="ml-4">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={alert.conditions.temperature.enabled}
                                      onChange={(e) => handleCombinationAlertChange(
                                        alert.id,
                                        'conditions.temperature.enabled',
                                        e.target.checked
                                      )}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="text-sm text-gray-700">
                                      Temperature out of normal range
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Humidity Condition */}
                              {alert.conditions.humidity && (
                                <div className="ml-4">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={alert.conditions.humidity.enabled}
                                      onChange={(e) => handleCombinationAlertChange(
                                        alert.id,
                                        'conditions.humidity.enabled',
                                        e.target.checked
                                      )}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="text-sm text-gray-700">
                                      Humidity out of normal range
                                    </label>
                                  </div>
                                </div>
                              )}

                              {/* Flow Rate Condition */}
                              {alert.conditions.flowRate && (
                                <div className="ml-4">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={alert.conditions.flowRate.enabled}
                                      onChange={(e) => handleCombinationAlertChange(
                                        alert.id,
                                        'conditions.flowRate.enabled',
                                        e.target.checked
                                      )}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="text-sm text-gray-700">
                                      No flow detected for
                                    </label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={alert.conditions.flowRate.duration}
                                      onChange={(e) => handleCombinationAlertChange(
                                        alert.id,
                                        'conditions.flowRate.duration',
                                        Math.max(1, parseInt(e.target.value))
                                      )}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                      disabled={!alert.conditions.flowRate.enabled}
                                    />
                                    <span className="text-sm text-gray-700">minutes</span>
                                  </div>
                                </div>
                              )}

                              <div className="ml-4 mt-4">
                                <div className="flex items-center gap-3">
                                  <label className="text-sm text-gray-700">Alert Frequency:</label>
                                  <select
                                    value={alert.frequency}
                                    onChange={(e) => handleCombinationAlertChange(alert.id, 'frequency', e.target.value)}
                                    className="text-sm border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                  >
                                    <option value="immediate">Immediate</option>
                                    <option value="5min">Every 5 minutes</option>
                                    <option value="15min">Every 15 minutes</option>
                                    <option value="1hour">Every hour</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌡️</span>
                <h3 className="font-medium text-gray-900">Temperature</h3>
              </div>
              <span className="text-xs text-gray-500">Now</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{deviceDetails?.temperature}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Within Range
              </span>
              <span className="text-xs text-gray-500">
                Normal: 20°C - 25°C
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">💧</span>
                <h3 className="font-medium text-gray-900">Humidity</h3>
              </div>
              <span className="text-xs text-gray-500">Now</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{deviceDetails?.humidity}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Within Range
              </span>
              <span className="text-xs text-gray-500">
                Normal: 45% - 55%
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🌊</span>
                <h3 className="font-medium text-gray-900">Flow Rate</h3>
              </div>
              <span className="text-xs text-gray-500">Now</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{deviceDetails?.flowRate}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                Active
              </span>
              <span className="text-xs text-gray-500">
                Last Detection: 2 mins ago
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {renderChart('temperature', 'Temperature', '#3b82f6', '°C')}
        {renderChart('flowRate', 'Flow Rate', '#10b981', ' L/min')}
        {renderChart('humidity', 'Humidity', '#6366f1', '%')}
      </div>
    </div>
  );
};

export default DeviceAnalytics;