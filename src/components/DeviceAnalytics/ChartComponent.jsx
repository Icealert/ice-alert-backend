import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot, ReferenceLine } from 'recharts';
import { NORMAL_RANGES } from './constants';

const ChartComponent = ({ 
  data = [], 
  metric, 
  title, 
  color, 
  unit,
  stats = {},
  isInRange,
  timeRange,
  onTimeRangeChange 
}) => {
  const normalRange = NORMAL_RANGES[metric] || { min: 0, max: 0 };
  
  // Ensure data is an array and not null
  const safeData = Array.isArray(data) ? data : [];
  const lastDataPoint = safeData[safeData.length - 1] || {};
  const lastValue = lastDataPoint[metric];

  // Helper function to safely parse numbers
  const safeParseFloat = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? null : parsed;
  };

  // Helper function to format value
  const formatValue = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(1);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-semibold">{title}</h3>
          <select 
            className="border rounded-lg px-3 py-1.5 bg-white shadow-sm text-sm"
            value={timeRange}
            onChange={(e) => onTimeRangeChange(metric, e.target.value)}
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
        {/* Primary Stats */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Last Recorded</div>
          <div className={`text-2xl font-bold ${
            lastValue && isInRange(lastValue) ? 'text-gray-900' : 'text-red-600'
          }`}>
            {formatValue(lastValue)}{unit}
          </div>
          <div className="text-sm text-gray-500">
            {lastDataPoint?.timestamp ? new Date(lastDataPoint.timestamp).toLocaleTimeString() : 'No data'}
          </div>
        </div>

        {/* Min/Max Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Range</div>
          <div className="flex items-end gap-2">
            <span className={`text-sm ${
              stats.min && isInRange(safeParseFloat(stats.min)) ? 'text-blue-600' : 'text-red-600'
            }`}>
              Min: {formatValue(stats.min)}{unit}
            </span>
            <span className="text-gray-400 mx-1">|</span>
            <span className={`text-sm ${
              stats.max && isInRange(safeParseFloat(stats.max)) ? 'text-blue-600' : 'text-red-600'
            }`}>
              Max: {formatValue(stats.max)}{unit}
            </span>
          </div>
        </div>

        {/* Anomalies Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Anomalies</div>
          <div className="text-lg font-semibold">
            {stats.anomalies || 0}
          </div>
          <div className="text-xs text-gray-500">
            ({((stats.anomalies || 0) / (safeData.length || 1) * 100).toFixed(1)}% of readings)
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Analysis</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Median</span>
              <span className={`font-medium ${
                stats.median && isInRange(safeParseFloat(stats.median)) ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatValue(stats.median)}{unit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Average</span>
              <span className={`font-medium ${
                stats.average && isInRange(safeParseFloat(stats.average)) ? 'text-gray-900' : 'text-red-600'
              }`}>
                {formatValue(stats.average)}{unit}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={safeData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
            />
            <YAxis domain={['auto', 'auto']} />
            <Tooltip
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
              formatter={(value) => [formatValue(value) + unit, metric]}
            />
            <ReferenceLine y={normalRange.min} stroke="#666" strokeDasharray="3 3" />
            <ReferenceLine y={normalRange.max} stroke="#666" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={color}
              fillOpacity={1}
              fill={`url(#gradient-${metric})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartComponent; 
