import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import DeviceAnalytics from './pages/DeviceAnalytics'
import './index.css'

const router = createBrowserRouter([
  {
    path: "/device/:icealertId",
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
    <RouterProvider router={router} />
  );
}

export default App 