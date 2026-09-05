import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../lib/api'
import { Server, ShieldCheck, Database, ArrowRight } from 'lucide-react'

export function DevHealth() {
  const { user } = useAuth()
  const [backendStatus, setBackendStatus] = useState<'loading' | 'online' | 'offline'>('loading')
  const backendUrl = `${API_BASE_URL}/api/health`

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(backendUrl)
        const data = await response.json()
        setBackendStatus(data.status === 'healthy' ? 'online' : 'offline')
      } catch {
        setBackendStatus('offline')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 5000)
    return () => clearInterval(interval)
  }, [backendUrl])

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 w-full">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="px-3 py-1 text-xs font-semibold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 rounded-full">
          Developer Status Panel
        </span>
        <h1 className="mt-6 font-display font-extrabold text-4xl sm:text-5xl tracking-tight text-white leading-none">
          System Health Check
        </h1>
        <p className="mt-4 text-slate-400">
          Monitor frontend, backend, and database connectivity.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="text-xs font-semibold px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white rounded-xl">
            Go to Store
          </Link>
          {user ? (
            <Link to="/dashboard" className="text-xs font-semibold px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl flex items-center space-x-1">
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link to="/auth" className="text-xs font-semibold px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl">
              Login
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Active
            </span>
          </div>
          <h3 className="mt-4 font-semibold text-lg text-white">React Frontend</h3>
          <p className="mt-2 text-sm text-slate-400">Vite + React 19 + TypeScript + Tailwind CSS</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl border ${
              backendStatus === 'online'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : backendStatus === 'offline'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <Server className="w-6 h-6" />
            </div>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
              backendStatus === 'online'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : backendStatus === 'offline'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
            }`}>
              {backendStatus === 'online' ? 'Connected' : backendStatus === 'offline' ? 'Offline' : 'Connecting...'}
            </span>
          </div>
          <h3 className="mt-4 font-semibold text-lg text-white">FastAPI Backend</h3>
          <p className="mt-2 text-sm text-slate-400">{backendUrl}</p>
        </div>

        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
              <Database className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Connected
            </span>
          </div>
          <h3 className="mt-4 font-semibold text-lg text-white">Supabase</h3>
          <p className="mt-2 text-sm text-slate-400">PostgreSQL + Auth + Storage</p>
        </div>
      </div>
    </div>
  )
}
