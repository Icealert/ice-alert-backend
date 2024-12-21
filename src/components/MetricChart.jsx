import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceDot } from 'recharts';
import { calculateAdvancedStats, getAnomalyDetails, isInRange, NORMAL_RANGES } from '../utils/analytics';

const MetricChart = ({ data, metric, title, color }) => {
  const stats = useMemo(() => calculateAdvancedStats(data, metric), [data, metric]);
  const anomalyDetails = useMemo(() => getAnomalyDetails(data, metric), [data, metric]);
  const normalRange = NORMAL_RANGES[metric];
  const unit = normalRange.unit;

  // Get last recorded value
  const lastRecording = useMemo(() => {
    return data[data.length - 1]?.[metric] || 0;
  }, [data, metric]);

  // Find anomalous points for visualization
  const anomalousPoints = useMemo(() => {
    if (!data || !stats) return [];
    const mean = parseFloat(stats.avg);
    const stdDev = parseFloat(stats.stdDev);
    return data.map((point, index) => ({
      ...point,
      isAnomaly: Math.abs(point[metric] - mean) > 2 * stdDev,
      index
    })).filter(point => point.isAnomaly);
  }, [data, stats, metric]);

  if (!stats || !anomalyDetails) return null;

  const isTemperature = metric === 'temperature';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{title}</h3>
        <div className="text-sm text-gray-600">
          Normal Range: {normalRange.min} - {normalRange.max}{unit}
        </div>
      </div>
      
      {/* Primary Stats - Emphasized for Temperature */}
      <div className={`grid ${isTemperature ? 'grid-cols-2' : 'grid-cols-4'} gap-4 mb-6`}>
        {/* Last Recorded Value - Larger for Temperature */}
        <div className={`bg-gray-50 p-4 rounded-lg ${isTemperature ? 'col-span-1' : ''}`}>
          <div className="text-gray-600 text-sm mb-1">Last Recorded</div>
          <div className={`${isTemperature ? 'text-4xl' : 'text-2xl'} font-bold ${
            isInRange(lastRecording, metric) ? 'text-gray-900' : 'text-red-600'
          }`}>
            {lastRecording.toFixed(1)}{unit}
          </div>
          <div className="text-sm text-gray-500">
            {new Date(data[data.length - 1]?.timestamp).toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {isInRange(lastRecording, metric) ? 'Within Range' : 'Out of Range'}
          </div>
        </div>

        {/* Anomalies Card - Emphasized for Temperature */}
        <div className={`bg-gray-50 p-4 rounded-lg ${isTemperature ? 'col-span-1' : ''}`}>
          <div className="text-gray-600 text-sm mb-1">Anomalies Detected</div>
          <div className={`${isTemperature ? 'text-4xl' : 'text-2xl'} font-bold flex items-center gap-2 
            ${anomalyDetails.count > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            {anomalyDetails.count}
            <span className={`${isTemperature ? 'text-lg' : 'text-xs'} text-gray-500 font-normal`}>
              ({anomalyDetails.percentage}%)
            </span>
          </div>
          <div className={`text-sm mt-1 ${
            anomalyDetails.severity === 'High' ? 'text-red-600' : 
            anomalyDetails.severity === 'Medium' ? 'text-amber-600' : 
            'text-green-600'
          }`}>
            {anomalyDetails.severity} Severity
          </div>
          {isTemperature && anomalyDetails.count > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Click anomaly points on chart for details
            </div>
          )}
        </div>

        {/* Additional Stats - Condensed for Temperature */}
        {!isTemperature && (
          <>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600 text-xs mb-1">Range</div>
              <div className="flex flex-col gap-1">
                <span className={`text-sm ${
                  isInRange(parseFloat(stats.min), metric) ? 'text-blue-600' : 'text-red-600'
                }`}>
                  Min: {stats.min}{unit}
                </span>
                <span className={`text-sm ${
                  isInRange(parseFloat(stats.max), metric) ? 'text-blue-600' : 'text-red-600'
                }`}>
                  Max: {stats.max}{unit}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-gray-600 text-xs mb-1">Analysis</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Median:</span>
                  <span className="font-medium">{stats.median}{unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Std Dev:</span>
                  <span className="font-medium">{stats.stdDev}{unit}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detailed Stats for Temperature - Collapsed by Default */}
      {isTemperature && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-sm mb-2">Statistical Analysis</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Range:</span>
                <span className="font-medium">
                  {stats.min}{unit} - {stats.max}{unit}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Median:</span>
                <span className="font-medium">{stats.median}{unit}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Std Dev:</span>
                <span className="font-medium">{stats.stdDev}{unit}</span>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-gray-600 text-sm mb-2">Readings Analysis</div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Readings:</span>
                <span className="font-medium">{data.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Out of Range:</span>
                <span className={`font-medium ${
                  data.filter(d => !isInRange(d[metric], metric)).length > 0 ? 
                  'text-red-600' : 'text-green-600'
                }`}>
                  {data.filter(d => !isInRange(d[metric], metric)).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Stability:</span>
                <span className="font-medium">{stats.stability}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()} 
              className="text-xs"
            />
            <YAxis 
              className="text-xs"
              domain={[
                Math.min(normalRange.min * 0.9, Math.min(...data.map(d => d[metric]))),
                Math.max(normalRange.max * 1.1, Math.max(...data.map(d => d[metric])))
              ]}
            />
            <Area
              y1={normalRange.min}
              y2={normalRange.max}
              fill="#4ade8033"
              strokeWidth={0}
            />
            <Tooltip 
              labelFormatter={(label) => new Date(label).toLocaleString()}
              formatter={(value) => [
                `${value.toFixed(2)}${unit} ${isInRange(value, metric) ? '✓' : '⚠️'}`,
                title
              ]}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={metric} 
              stroke={color} 
              fill={`${color}33`}
              strokeWidth={2}
            />
            {/* Anomaly Points */}
            {anomalousPoints.map((point) => (
              <ReferenceDot
                key={point.index}
                x={point.timestamp}
                y={point[metric]}
                r={4}
                fill="red"
                stroke="none"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend for Temperature */}
      {isTemperature && (
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Anomaly</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Normal Reading</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 rounded-full"></div>
            <span>Normal Range</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(MetricChart); 