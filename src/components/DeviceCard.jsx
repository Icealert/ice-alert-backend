import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const DeviceCard = ({ 
  name, 
  location, 
  partNumber,
  serialNumber,
  iceAlertSerial,
  temperature, 
  humidity, 
  flowRate,
  lastFlowDetection,
  lastUpdated 
}) => {
  const navigate = useNavigate();

  // Parse values from strings
  const tempValue = parseFloat(temperature.replace(/[^\d.-]/g, ''));
  const humidityValue = parseFloat(humidity.replace(/[^\d.-]/g, ''));
  const hoursSinceFlow = Math.round((Date.now() - new Date(lastFlowDetection).getTime()) / (1000 * 60 * 60));

  // Define normal ranges
  const TEMP_MIN = 20;
  const TEMP_MAX = 25;
  const HUMIDITY_MIN = 45;
  const HUMIDITY_MAX = 55;
  const CRITICAL_FLOW_TIME = 4; // hours

  // Determine status based on conditions
  const determineStatus = () => {
    const isTempAbnormal = tempValue < TEMP_MIN || tempValue > TEMP_MAX;
    const isFlowCritical = hoursSinceFlow >= CRITICAL_FLOW_TIME;
    const isHumidityAbnormal = humidityValue < HUMIDITY_MIN || humidityValue > HUMIDITY_MAX;

    if (isTempAbnormal && isFlowCritical) {
      return "Critical";
    }
    if (isTempAbnormal || isFlowCritical || isHumidityAbnormal) {
      return "Warning";
    }
    return "Good";
  };

  // Sample data for the graphs
  const tempData = Array.from({ length: 48 }, (_, i) => ({
    time: i,
    value: 22 + Math.random() * 5
  }));

  const flowData = Array.from({ length: 48 }, (_, i) => ({
    time: i,
    value: Math.random() > 0.3 ? 2.5 + Math.random() : 0
  }));

  const humidityData = Array.from({ length: 48 }, (_, i) => ({
    time: i,
    value: 45 + Math.random() * 10
  }));

  const status = determineStatus();

  const statusStyles = {
    Good: 'bg-green-100 text-green-800 border-green-300',
    Warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    Critical: 'bg-red-100 text-red-800 border-red-300'
  };

  const getMetricTextColor = (value, min, max) => {
    return (value < min || value > max) ? 'text-red-600' : 'text-gray-900';
  };

  const getHoursTextColor = (hours) => {
    return hours >= CRITICAL_FLOW_TIME ? 'text-red-600' : 'text-gray-900';
  };

  const handleCardClick = () => {
    navigate(`/devices/${iceAlertSerial}`, {
      state: {
        deviceDetails: {
          name,
          location,
          partNumber,
          serialNumber,
          iceAlertSerial,
          temperature,
          humidity,
          flowRate,
          lastFlowDetection,
          lastUpdated
        }
      }
    });
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white p-1.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 relative group"
    >
      <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg"></div>
      
      <div className="absolute bottom-2 right-2">
        <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-sm hover:bg-blue-700 transition-colors">
          View Details →
        </span>
      </div>

      <div className="flex justify-between items-center mb-0.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-blue-600">❄️</span>
            <h3 className="text-sm font-bold text-blue-900">{name}</h3>
          </div>
          <span className="text-[10px] text-gray-400">|</span>
          <div className="flex items-center gap-1">
            <span className="text-blue-600 text-[10px] font-semibold">IceAlert:</span>
            <span className="text-[10px] text-gray-600">{iceAlertSerial}</span>
          </div>
        </div>
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${statusStyles[status]}`}>
          {status}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 mb-1">
        <p className="text-gray-600 text-xs">{location}</p>
        <div className="flex gap-2 text-[10px] text-gray-500">
          <span>PN: {partNumber}</span>
          <span>•</span>
          <span>SN: {serialNumber}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-1.5">
        <div className="flex items-start gap-1">
          <span className="text-sm mt-0.5">🌡️</span>
          <div className="w-full">
            <p className="text-gray-600 text-[10px] leading-tight">Temperature</p>
            <p className={`font-bold text-xs leading-tight ${getMetricTextColor(tempValue, TEMP_MIN, TEMP_MAX)}`}>
              {temperature}
            </p>
            <p className="text-[8px] text-gray-500 leading-tight">Normal: {TEMP_MIN}°C - {TEMP_MAX}°C</p>
            <div className="h-8 mt-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tempData}>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#93c5fd" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-sm mt-0.5">🌊</span>
          <div className="w-full">
            <p className="text-gray-600 text-[10px] leading-tight">Last Flow Rate</p>
            <p className="font-bold text-xs leading-tight">{flowRate}</p>
            <p className="text-[8px] text-gray-500 leading-tight">
              at {new Date(lastFlowDetection).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <div className="h-8 mt-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData}>
                  <Area type="monotone" dataKey="value" stroke="#10b981" fill="#6ee7b7" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-sm mt-0.5">💧</span>
          <div className="w-full">
            <p className="text-gray-600 text-[10px] leading-tight">Humidity</p>
            <p className={`font-bold text-xs leading-tight ${getMetricTextColor(humidityValue, HUMIDITY_MIN, HUMIDITY_MAX)}`}>
              {humidity}
            </p>
            <p className="text-[8px] text-gray-500 leading-tight">Normal: {HUMIDITY_MIN}% - {HUMIDITY_MAX}%</p>
            <div className="h-8 mt-0.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={humidityData}>
                  <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#a5b4fc" strokeWidth={1} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="flex items-start gap-1">
          <span className="text-sm mt-0.5">⏱️</span>
          <div>
            <p className="text-gray-600 text-[10px] leading-tight">Hours Since Flow</p>
            <p className={`font-bold text-xs leading-tight ${getHoursTextColor(hoursSinceFlow)}`}>
              {hoursSinceFlow} hrs
            </p>
            <p className="text-[8px] text-gray-500 leading-tight">Critical after: {CRITICAL_FLOW_TIME} hrs</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceCard;