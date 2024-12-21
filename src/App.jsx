import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DeviceAnalytics from './pages/DeviceAnalytics'
import './index.css'

const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/devices/by-icealert/:icealertId" element={<DeviceAnalytics />} />
          <Route path="/analytics" element={<DeviceAnalytics />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 