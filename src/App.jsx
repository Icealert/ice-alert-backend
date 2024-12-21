import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import DeviceAnalytics from './pages/DeviceAnalytics'
import './index.css'

const router = createBrowserRouter([
  {
    path: "/devices/by-icealert/:icealertId",
    element: <DeviceAnalytics />,
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  },
  {
    path: "/",
    element: <div>Home Page</div>
  }
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
});

const App = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <RouterProvider router={router} />
    </div>
  );
}

export default App 