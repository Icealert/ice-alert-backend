import React from 'react'
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DeviceAnalytics from './pages/DeviceAnalytics'
import './index.css'

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Dashboard />} />
      <Route path="/devices/by-icealert/:icealertId" element={<DeviceAnalytics />} />
      <Route path="/analytics" element={<DeviceAnalytics />} />
    </>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_normalizeFormMethod: true
    }
  }
)

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <RouterProvider router={router} />
    </div>
  )
}

export default App 