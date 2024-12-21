import React from 'react'
import { 
  BrowserRouter as Router, 
  Routes, 
  Route,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider 
} from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import DeviceAnalytics from './pages/DeviceAnalytics'
import './index.css'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="/" element={<Dashboard />} />
      <Route path="/devices/by-icealert/:icealertId" element={<DeviceAnalytics />} />
      <Route path="/analytics" element={<DeviceAnalytics />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <RouterProvider router={router} />
    </div>
  );
}

export default App 