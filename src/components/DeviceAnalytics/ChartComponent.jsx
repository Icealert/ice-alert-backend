import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';

// Helper functions for safe value handling
const safeParseFloat = (value) => {
  if (value === null || value === undefined || isNaN(value)) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const formatValue = (value, unit) => {
  if (value === null || value === undefined) return 'N/A';
  return `${value.toFixed(1)}${unit}`;
};

const ChartComponent = ({
  data,
  metric,
  title,
  color,
  unit,
  stats,
  isInRange,
  timeRange,
  onTimeRangeChange
}) => {
  // Ensure data is an array and contains valid entries
  const safeData = Array.isArray(data) ? data : [];
  
  // Get the last data point safely
  const lastDataPoint = safeData[safeData.length - 1];
  const lastValue = lastDataPoint ? safeParseFloat(lastDataPoint[metric]) : null;

  // Format the timestamp for display
  const formatTimestamp = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Invalid Time';
    }
  };

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const value = safeParseFloat(payload[0].value);
    if (value === null) return null;

    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="text-gray-600">{formatTimestamp(label)}</p>
        <p className="font-medium text-gray-800">
          {formatValue(value, unit)}
        </p>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-gray-500">
            Current: {formatValue(lastValue, unit)}
            {lastValue !== null && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-sm ${
                isInRange(lastValue) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {isInRange(lastValue) ? 'Normal' : 'Out of Range'}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {['12h', '24h', '48h'].map((range) => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(metric, range)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={safeData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTimestamp}
              stroke="#9ca3af"
            />
            <YAxis stroke="#9ca3af" />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            {stats?.normalRange && (
              <>
                <ReferenceLine
                  y={stats.normalRange.min}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                />
                <ReferenceLine
                  y={stats.normalRange.max}
                  stroke="#cbd5e1"
                  strokeDasharray="3 3"
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Min</p>
            <p className="font-medium">{formatValue(stats.min, unit)}</p>
          </div>
          <div>
            <p className="text-gray-500">Max</p>
            <p className="font-medium">{formatValue(stats.max, unit)}</p>
          </div>
          <div>
            <p className="text-gray-500">Average</p>
            <p className="font-medium">{formatValue(stats.avg, unit)}</p>
          </div>
          <div>
            <p className="text-gray-500">Trend</p>
            <p className={`font-medium ${
              stats.trend > 0 ? 'text-green-600' : stats.trend < 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {stats.trend > 0 ? '↑' : stats.trend < 0 ? '↓' : '→'} {Math.abs(stats.trend).toFixed(2)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartComponent; 
