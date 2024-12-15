const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',  // or your preferred email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD  // Use app-specific password
  }
});

// Email templates for different alert types
const emailTemplates = {
  singleCondition: (deviceName, condition, value, threshold, unit) => ({
    subject: `Alert: ${condition} Issue Detected - ${deviceName}`,
    html: `
      <h2>Alert: ${condition} Issue Detected</h2>
      <p>Device: ${deviceName}</p>
      <p>Current Value: ${value}${unit}</p>
      <p>Threshold: ${threshold}${unit}</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  }),
  
  combinationAlert: (deviceName, conditions) => ({
    subject: `Alert: Multiple Issues Detected - ${deviceName}`,
    html: `
      <h2>Alert: Multiple Issues Detected</h2>
      <p>Device: ${deviceName}</p>
      <h3>Conditions:</h3>
      <ul>
        ${conditions.map(c => `<li>${c}</li>`).join('')}
      </ul>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  }),

  noFlow: (deviceName, duration) => ({
    subject: `Alert: No Flow Detected - ${deviceName}`,
    html: `
      <h2>Alert: No Flow Detected</h2>
      <p>Device: ${deviceName}</p>
      <p>Duration: ${duration} minutes</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    `
  })
};

// Function to send email alerts
const sendAlert = async (recipients, templateName, templateData) => {
  try {
    const template = emailTemplates[templateName](
      templateData.deviceName,
      ...Object.values(templateData).slice(1)
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipients.join(', '),
      subject: template.subject,
      html: template.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Function to check alert conditions and send emails
const checkAndSendAlerts = async (deviceData, alertSettings) => {
  if (!alertSettings.enabled || !alertSettings.recipients.length) {
    return;
  }

  const { temperature, humidity, flowRate } = deviceData;
  const { conditions, combinationAlerts, recipients } = alertSettings;

  // Check individual conditions
  if (conditions.temperature.enabled) {
    if (conditions.temperature.outOfRange &&
        (temperature < NORMAL_RANGES.temperature.min || temperature > NORMAL_RANGES.temperature.max)) {
      await sendAlert(recipients, 'singleCondition', {
        deviceName: deviceData.name,
        condition: 'Temperature',
        value: temperature,
        threshold: `${NORMAL_RANGES.temperature.min}-${NORMAL_RANGES.temperature.max}`,
        unit: '°C'
      });
    }
  }

  if (conditions.humidity.enabled) {
    if (conditions.humidity.outOfRange &&
        (humidity < NORMAL_RANGES.humidity.min || humidity > NORMAL_RANGES.humidity.max)) {
      await sendAlert(recipients, 'singleCondition', {
        deviceName: deviceData.name,
        condition: 'Humidity',
        value: humidity,
        threshold: `${NORMAL_RANGES.humidity.min}-${NORMAL_RANGES.humidity.max}`,
        unit: '%'
      });
    }
  }

  if (conditions.flowRate.enabled) {
    if (conditions.flowRate.noFlow && flowRate === 0) {
      await sendAlert(recipients, 'noFlow', {
        deviceName: deviceData.name,
        duration: conditions.flowRate.noFlowDuration
      });
    }
  }

  // Check combination alerts
  for (const alert of combinationAlerts) {
    if (!alert.enabled) continue;

    const activeConditions = [];
    let allConditionsMet = true;

    if (alert.conditions.temperature?.enabled) {
      const tempOutOfRange = temperature < NORMAL_RANGES.temperature.min || 
                            temperature > NORMAL_RANGES.temperature.max;
      if (!tempOutOfRange) {
        allConditionsMet = false;
      } else {
        activeConditions.push(`Temperature out of range: ${temperature}°C`);
      }
    }

    if (alert.conditions.humidity?.enabled) {
      const humidityOutOfRange = humidity < NORMAL_RANGES.humidity.min || 
                                humidity > NORMAL_RANGES.humidity.max;
      if (!humidityOutOfRange) {
        allConditionsMet = false;
      } else {
        activeConditions.push(`Humidity out of range: ${humidity}%`);
      }
    }

    if (alert.conditions.flowRate?.enabled && flowRate === 0) {
      activeConditions.push(`No flow detected for ${alert.conditions.flowRate.duration} minutes`);
    } else if (alert.conditions.flowRate?.enabled) {
      allConditionsMet = false;
    }

    if (allConditionsMet && activeConditions.length > 0) {
      await sendAlert(recipients, 'combinationAlert', {
        deviceName: deviceData.name,
        conditions: activeConditions
      });
    }
  }
};

module.exports = {
  sendAlert,
  checkAndSendAlerts
}; 