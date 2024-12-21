import React from 'react';
import { NORMAL_RANGES } from './constants';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  settingsForm, 
  handleSettingsChange,
  handleEmailChange,
  addEmailRecipient,
  removeEmailRecipient,
  handleAlertConditionChange,
  handleCombinationAlertChange,
  handleSaveSettings
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Device Settings</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Device Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => handleSettingsChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={settingsForm.location}
                      onChange={(e) => handleSettingsChange('location', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Part Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.partNumber}
                      onChange={(e) => handleSettingsChange('partNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.serialNumber}
                      onChange={(e) => handleSettingsChange('serialNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Normal Ranges */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Normal Operating Ranges</h3>
              <div className="space-y-4">
                {/* Temperature Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature Range (°C)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.temperature.min}
                        onChange={(e) => handleSettingsChange('normalRanges.temperature.min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.temperature.max}
                        onChange={(e) => handleSettingsChange('normalRanges.temperature.max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Humidity Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Humidity Range (%)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.humidity.min}
                        onChange={(e) => handleSettingsChange('normalRanges.humidity.min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.humidity.max}
                        onChange={(e) => handleSettingsChange('normalRanges.humidity.max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Flow Rate Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flow Rate Range (L/min)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.flowRate.min}
                        onChange={(e) => handleSettingsChange('normalRanges.flowRate.min', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                      <input
                        type="number"
                        value={settingsForm.normalRanges.flowRate.max}
                        onChange={(e) => handleSettingsChange('normalRanges.flowRate.max', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Alert Settings</h3>
              
              {/* Global Alert Toggle */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Enable Email Alerts</label>
                  <button
                    type="button"
                    className={`${
                      settingsForm.alerts.enabled ? 'bg-blue-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    onClick={() => handleSettingsChange('alerts.enabled', !settingsForm.alerts.enabled)}
                  >
                    <span
                      className={`${
                        settingsForm.alerts.enabled ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                    />
                  </button>
                </div>
              </div>

              {settingsForm.alerts.enabled && (
                <>
                  {/* Email Recipients */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Recipients
                    </label>
                    <div className="space-y-3">
                      {settingsForm.alerts.recipients.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => handleEmailChange(index, e.target.value)}
                            placeholder="Enter email address"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                          />
                          {settingsForm.alerts.recipients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeEmailRecipient(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addEmailRecipient}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Another Recipient
                      </button>
                    </div>
                  </div>

                  {/* Alert Conditions */}
                  <div className="space-y-6">
                    {/* Temperature Alerts */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Temperature Alerts</h4>
                        <button
                          type="button"
                          className={`${
                            settingsForm.alerts.conditions.temperature.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                          onClick={() => handleAlertConditionChange('temperature', 'enabled', 
                            !settingsForm.alerts.conditions.temperature.enabled)}
                        >
                          <span
                            className={`${
                              settingsForm.alerts.conditions.temperature.enabled ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                      {settingsForm.alerts.conditions.temperature.enabled && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.temperature.outOfRange}
                              onChange={(e) => handleAlertConditionChange('temperature', 'outOfRange', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert when temperature is out of normal range
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.temperature.threshold}
                              onChange={(e) => handleAlertConditionChange('temperature', 'threshold', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert when temperature exceeds
                            </label>
                            <input
                              type="number"
                              value={settingsForm.alerts.conditions.temperature.thresholdValue}
                              onChange={(e) => handleAlertConditionChange('temperature', 'thresholdValue', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              disabled={!settingsForm.alerts.conditions.temperature.threshold}
                            />
                            <span className="text-sm text-gray-700">°C</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Humidity Alerts */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Humidity Alerts</h4>
                        <button
                          type="button"
                          className={`${
                            settingsForm.alerts.conditions.humidity.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                          onClick={() => handleAlertConditionChange('humidity', 'enabled', 
                            !settingsForm.alerts.conditions.humidity.enabled)}
                        >
                          <span
                            className={`${
                              settingsForm.alerts.conditions.humidity.enabled ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                      {settingsForm.alerts.conditions.humidity.enabled && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.humidity.outOfRange}
                              onChange={(e) => handleAlertConditionChange('humidity', 'outOfRange', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert when humidity is out of normal range
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.humidity.threshold}
                              onChange={(e) => handleAlertConditionChange('humidity', 'threshold', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert when humidity exceeds
                            </label>
                            <input
                              type="number"
                              value={settingsForm.alerts.conditions.humidity.thresholdValue}
                              onChange={(e) => handleAlertConditionChange('humidity', 'thresholdValue', parseFloat(e.target.value))}
                              className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              disabled={!settingsForm.alerts.conditions.humidity.threshold}
                            />
                            <span className="text-sm text-gray-700">%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Flow Rate Alerts */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-gray-900">Flow Rate Alerts</h4>
                        <button
                          type="button"
                          className={`${
                            settingsForm.alerts.conditions.flowRate.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                          onClick={() => handleAlertConditionChange('flowRate', 'enabled', 
                            !settingsForm.alerts.conditions.flowRate.enabled)}
                        >
                          <span
                            className={`${
                              settingsForm.alerts.conditions.flowRate.enabled ? 'translate-x-5' : 'translate-x-0'
                            } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                          />
                        </button>
                      </div>
                      {settingsForm.alerts.conditions.flowRate.enabled && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.flowRate.outOfRange}
                              onChange={(e) => handleAlertConditionChange('flowRate', 'outOfRange', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert when flow rate is out of normal range
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={settingsForm.alerts.conditions.flowRate.noFlow}
                              onChange={(e) => handleAlertConditionChange('flowRate', 'noFlow', e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label className="text-sm text-gray-700">
                              Alert on no flow detection
                            </label>
                          </div>
                          {settingsForm.alerts.conditions.flowRate.noFlow && (
                            <div className="flex items-center gap-3 ml-7">
                              <label className="text-sm text-gray-700">
                                Alert after
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={settingsForm.alerts.conditions.flowRate.noFlowDuration}
                                onChange={(e) => handleAlertConditionChange('flowRate', 'noFlowDuration', Math.max(1, parseInt(e.target.value)))}
                                className="w-20 px-2 py-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                              <label className="text-sm text-gray-700">
                                minutes of no flow
                              </label>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 
