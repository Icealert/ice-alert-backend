export const NORMAL_RANGES = {
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

export const DEFAULT_ALERT_SETTINGS = {
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
}; 
