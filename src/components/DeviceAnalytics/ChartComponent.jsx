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
  const lastReading = data[data.length - 1];
  const hasData = data.length > 0;

  // Safely access stats with defaults
  const safeStats = {
    min: stats?.min || '0',
    max: stats?.max || '0',
    median: stats?.median || '0',
    stdDev: stats?.stdDev || '0',
    anomalies: stats?.anomalies || 0,
    trend: stats?.trend || '0'
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
            hasData && isInRange(lastReading?.[metric]) ? 'text-gray-900' : 'text-red-600'
          }`}>
            {hasData ? lastReading[metric]?.toFixed(1) : 'N/A'}{hasData ? unit : ''}
          </div>
          <div className="text-sm text-gray-500">
            {hasData ? new Date(lastReading.timestamp).toLocaleTimeString() : 'No data'}
          </div>
        </div>

        {/* Min/Max Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Range</div>
          <div className="flex items-end gap-2">
            <span className={`text-sm ${
              isInRange(parseFloat(safeStats.min)) ? 'text-blue-600' : 'text-red-600'
            }`}>
              Min: {safeStats.min}{unit}
            </span>
            <span className="text-gray-400 mx-1">|</span>
            <span className={`text-sm ${
              isInRange(parseFloat(safeStats.max)) ? 'text-blue-600' : 'text-red-600'
            }`}>
              Max: {safeStats.max}{unit}
            </span>
          </div>
        </div>

        {/* Anomalies Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Anomalies</div>
          <div className="text-lg font-semibold">
            {safeStats.anomalies}
          </div>
          <div className="text-xs text-gray-500">
            {hasData ? `(${((safeStats.anomalies / data.length) * 100).toFixed(1)}% of readings)` : 'No data'}
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="text-gray-600 text-xs mb-1">Analysis</div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Median</span>
              <span className={`font-medium ${
                isInRange(parseFloat(safeStats.median)) ? 'text-gray-900' : 'text-red-600'
              }`}>
                {safeStats.median}{unit}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Std Dev</span>
              <span className="font-medium">{safeStats.stdDev}{unit}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart 
              data={data} 
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
              />
              <YAxis 
                tickFormatter={(value) => `${value}${unit}`}
                tick={{ fontSize: 12, fill: '#4B5563' }}
                tickLine={{ stroke: '#9CA3AF' }}
                axisLine={{ stroke: '#9CA3AF' }}
                domain={[
                  (dataMin) => Math.floor(Math.min(normalRange.min * 0.95, dataMin || 0)),
                  (dataMax) => Math.ceil(Math.max(normalRange.max * 1.05, dataMax || 0))
                ]}
                width={65}
              />
              {/* Normal range area */}
              <Area
                y1={normalRange.min}
                y2={normalRange.max}
                fill="#4ade8033"
                strokeWidth={0}
              />
              {/* Reference lines */}
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
                  `${value?.toFixed(2)}${unit} ${isInRange(value) ? '✓' : '⚠️'}`,
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
              {data
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
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Chart Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-sm text-gray-600">
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
  );
};

export default ChartComponent; 
