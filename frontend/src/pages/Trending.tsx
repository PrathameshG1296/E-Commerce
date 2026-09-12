import React, { useEffect, useState } from 'react'
import { fetchTrending } from '../lib/api'
import type { Product } from '../types/catalog'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { AlertCircle, RefreshCw } from 'lucide-react'

export const Trending: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetchTrending(24)
      .then(setProducts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load trending products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">Trending Now</h1>
        <p className="mt-2 text-sm text-stone-500">Most viewed products right now — updated from live analytics.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl flex items-start justify-between gap-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      <ProductGrid
        products={products}
        loading={loading}
        emptyMessage="No trending data yet — browse products to help populate this list."
      />
    </div>
  )
}
