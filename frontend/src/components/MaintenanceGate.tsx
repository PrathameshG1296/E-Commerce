import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true'

export const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pathname } = useLocation()

  if (isMaintenanceMode && pathname !== '/maintenance') {
    return <Navigate to="/maintenance" replace />
  }

  if (!isMaintenanceMode && pathname === '/maintenance') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
