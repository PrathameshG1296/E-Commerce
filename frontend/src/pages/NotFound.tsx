import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
      <p className="text-8xl font-display font-extrabold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-3 text-sm text-slate-400 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or head back to the store.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Browse Shop</span>
        </Link>
      </div>
      <Link to="/" className="mt-6 inline-flex items-center text-xs text-slate-500 hover:text-indigo-400 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Return to NovaCart
      </Link>
    </div>
  )
}
