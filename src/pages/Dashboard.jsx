import React, { useState, useEffect } from 'react';
import DeviceCard from '../components/DeviceCard';
import deviceService from '../api/deviceService';

function Dashboard() {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        setLoading(true);
        const data = await deviceService.getDevices();
        setMachines(data);
      } catch (error) {
        console.error('Error fetching devices:', error);
        setError(error.message || 'Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  // Calculate counts for each status
  const getCounts = () => {
    return machines.reduce((acc, machine) => {
      const tempValue = parseFloat(machine.temperature?.replace(/[^\d.-]/g, '') || '0');
      const humidityValue = parseFloat(machine.humidity?.replace(/[^\d.-]/g, '') || '0');
      const hoursSinceFlow = machine.lastFlowDetection ? 
        Math.round((Date.now() - new Date(machine.lastFlowDetection).getTime()) / (1000 * 60 * 60)) : 0;

      const isTempAbnormal = tempValue < 20 || tempValue > 25;
      const isFlowCritical = hoursSinceFlow >= 4;
      const isHumidityAbnormal = humidityValue < 45 || humidityValue > 55;

      if (isTempAbnormal && isFlowCritical) {
        acc.critical++;
      } else if (isTempAbnormal || isFlowCritical || isHumidityAbnormal) {
        acc.warning++;
      } else {
        acc.good++;
      }
      return acc;
    }, { good: 0, warning: 0, critical: 0 });
  };

  const counts = getCounts();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading devices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Devices</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Status Overview */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Device Status Overview</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Good</p>
                <p className="text-2xl font-bold text-green-700">{counts.good}</p>
              </div>
              <div className="bg-green-100 rounded-full p-2">
                <span className="text-green-500 text-xl">✓</span>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 text-sm font-medium">Warning</p>
                <p className="text-2xl font-bold text-yellow-700">{counts.warning}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-2">
                <span className="text-yellow-500 text-xl">⚠️</span>
              </div>
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-600 text-sm font-medium">Critical</p>
                <p className="text-2xl font-bold text-red-700">{counts.critical}</p>
              </div>
              <div className="bg-red-100 rounded-full p-2">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-2 gap-6">
        {machines.map((machine) => (
          <DeviceCard 
            key={machine.icealert_id}
            {...machine}
          />
        ))}
      </div>

      <div className="text-sm text-gray-500 mt-6">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default Dashboard; 