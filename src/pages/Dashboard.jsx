import React from 'react';
import DeviceCard from '../components/DeviceCard';

function Dashboard() {
  const machines = [
    {
      name: "Ice Machine 1",
      location: "Main Kitchen",
      partNumber: "KM-1900SAJ",
      serialNumber: "M12345-67890",
      iceAlertSerial: "IA-2024-0001",
      temperature: "22.5°C",
      humidity: "50%",
      flowRate: "2.5 L/min",
      lastFlowDetection: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastUpdated: "6:33:55 AM"
    },
    {
      name: "Ice Machine 2",
      location: "Bar Area",
      partNumber: "ICE0500A3",
      serialNumber: "I98765-43210",
      iceAlertSerial: "IA-2024-0002",
      temperature: "28.5°C",
      humidity: "48%",
      flowRate: "1.8 L/min",
      lastFlowDetection: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      lastUpdated: "5:33:55 AM"
    },
    {
      name: "Ice Machine 3",
      location: "Storage Room",
      partNumber: "CIM0530HA",
      serialNumber: "S24680-13579",
      iceAlertSerial: "IA-2024-0003",
      temperature: "23.5°C",
      humidity: "62%",
      flowRate: "2.1 L/min",
      lastFlowDetection: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      lastUpdated: "4:33:55 AM"
    },
    {
      name: "Ice Machine 4",
      location: "Banquet Hall",
      partNumber: "KM-1601SRJ",
      serialNumber: "M13579-24680",
      iceAlertSerial: "IA-2024-0004",
      temperature: "24.5°C",
      humidity: "52%",
      flowRate: "0.8 L/min",
      lastFlowDetection: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
      lastUpdated: "6:33:55 AM"
    },
    {
      name: "Ice Machine 5",
      location: "Secondary Kitchen",
      partNumber: "ICE1205HA",
      serialNumber: "I11111-22222",
      iceAlertSerial: "IA-2024-0005",
      temperature: "26.8°C",
      humidity: "49%",
      flowRate: "2.2 L/min",
      lastFlowDetection: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      lastUpdated: "5:03:55 AM"
    }
  ];

  // Calculate counts for each status
  const getCounts = () => {
    return machines.reduce((acc, machine) => {
      const tempValue = parseFloat(machine.temperature.replace(/[^\d.-]/g, ''));
      const humidityValue = parseFloat(machine.humidity.replace(/[^\d.-]/g, ''));
      const hoursSinceFlow = Math.round((Date.now() - new Date(machine.lastFlowDetection).getTime()) / (1000 * 60 * 60));

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

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-gray-100 min-h-screen">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">❄️</span>
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              IceAlert
              <span className="text-blue-600 text-2xl ml-2">Dashboard</span>
            </h1>
            <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full mt-1"></div>
          </div>
        </div>
        <p className="text-gray-600 ml-1">Real-time monitoring and alerts for your connected ice machines</p>
      </div>

      {/* Status Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-600">📊 Total Machines</div>
          <div className="text-2xl font-bold">{machines.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-600">✅ Safe</div>
          <div className="text-2xl font-bold text-green-600">
            {counts.good}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-600">⚠️ Warning</div>
          <div className="text-2xl font-bold text-yellow-500">
            {counts.warning}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-600">🚨 Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {counts.critical}
          </div>
        </div>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-2 gap-6">
        {machines.map((machine, index) => (
          <DeviceCard 
            key={index}
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