import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories } from '../lib/api'
import type { Category } from '../types/catalog'
import { Loader2, ArrowRight, Grid3X3 } from 'lucide-react'

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load categories'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-10">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Categories</h1>
        <p className="mt-2 text-sm text-slate-400">Shop by department — electronics, fashion, home, and more.</p>
      </div>

      {loading && (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <span className="text-sm">Loading categories...</span>
        </div>
      )}

      {error && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/categories/${cat.slug}`}
              className="group bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
                <Grid3X3 className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                {cat.name}
              </h3>
              {cat.description && (
                <p className="mt-2 text-xs text-slate-500 line-clamp-2">{cat.description}</p>
              )}
              <span className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-400">
                Browse
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
