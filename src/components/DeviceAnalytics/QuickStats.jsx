import React from 'react';
import { NORMAL_RANGES } from './constants';

const QuickStats = ({ deviceDetails }) => {
  const isInRange = (value, metric) => {
    const range = NORMAL_RANGES[metric];
    return value >= range.min && value <= range.max;
  };

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {/* Temperature Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌡️</span>
            <h3 className="font-medium text-gray-900">Temperature</h3>
          </div>
          <span className="text-xs text-gray-500">Now</span>
        </div>
        <p className={`text-2xl font-bold ${
          isInRange(deviceDetails?.temperature, 'temperature') 
            ? 'text-blue-900' 
            : 'text-red-600'
        }`}>
          {deviceDetails?.temperature}°C
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isInRange(deviceDetails?.temperature, 'temperature')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {isInRange(deviceDetails?.temperature, 'temperature') 
              ? 'Within Range' 
              : 'Out of Range'
            }
          </span>
          <span className="text-xs text-gray-500">
            Normal: {NORMAL_RANGES.temperature.min}°C - {NORMAL_RANGES.temperature.max}°C
          </span>
        </div>
      </div>
      
      {/* Humidity Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">💧</span>
            <h3 className="font-medium text-gray-900">Humidity</h3>
          </div>
          <span className="text-xs text-gray-500">Now</span>
        </div>
        <p className={`text-2xl font-bold ${
          isInRange(deviceDetails?.humidity, 'humidity') 
            ? 'text-blue-900' 
            : 'text-red-600'
        }`}>
          {deviceDetails?.humidity}%
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isInRange(deviceDetails?.humidity, 'humidity')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {isInRange(deviceDetails?.humidity, 'humidity') 
              ? 'Within Range' 
              : 'Out of Range'
            }
          </span>
          <span className="text-xs text-gray-500">
            Normal: {NORMAL_RANGES.humidity.min}% - {NORMAL_RANGES.humidity.max}%
          </span>
        </div>
      </div>
      
      {/* Flow Rate Stats */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌊</span>
            <h3 className="font-medium text-gray-900">Flow Rate</h3>
          </div>
          <span className="text-xs text-gray-500">Now</span>
        </div>
        <p className={`text-2xl font-bold ${
          isInRange(deviceDetails?.flowRate, 'flowRate') 
            ? 'text-blue-900' 
            : 'text-red-600'
        }`}>
          {deviceDetails?.flowRate} L/min
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isInRange(deviceDetails?.flowRate, 'flowRate')
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}>
            {isInRange(deviceDetails?.flowRate, 'flowRate') 
              ? 'Active' 
              : 'Warning'
            }
          </span>
          <span className="text-xs text-gray-500">
            Normal: {NORMAL_RANGES.flowRate.min} - {NORMAL_RANGES.flowRate.max} L/min
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickStats; 
