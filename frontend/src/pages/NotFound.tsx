import React from 'react'
import { Link } from 'react-router-dom'
import { Home, Search, ArrowLeft } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
      <p className="text-8xl font-display font-extrabold bg-gradient-to-r from-rose-300 to-pink-400 bg-clip-text text-transparent">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold text-stone-900">Page not found</h1>
      <p className="mt-3 text-sm text-stone-500 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or head back to the store.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-white border border-rose-200 text-stone-700 hover:text-stone-900 text-sm font-semibold rounded-xl transition-all"
        >
          <Search className="w-4 h-4" />
          <span>Browse Shop</span>
        </Link>
      </div>
      <Link to="/" className="mt-6 inline-flex items-center text-xs text-stone-400 hover:text-rose-300 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
        Return to NovaCart
      </Link>
    </div>
  )
}
