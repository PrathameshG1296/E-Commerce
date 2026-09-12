import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  adminOnly?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center justify-center text-stone-500 font-sans">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <span className="text-sm font-medium tracking-wide">Loading credentials...</span>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  if (adminOnly && (!profile || !profile.is_admin)) {
    // If not admin, redirect to normal user dashboard
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
