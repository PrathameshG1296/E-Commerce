import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchBrands } from '../lib/api'
import type { Brand } from '../types/catalog'
import { Loader2, ArrowRight, Award } from 'lucide-react'

export const Brands: React.FC = () => {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBrands()
      .then(setBrands)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load brands'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-10">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">Brands</h1>
        <p className="mt-2 text-sm text-stone-500">Shop from trusted brands across electronics, fashion, and home.</p>
      </div>

      {loading && (
        <div className="h-64 flex flex-col items-center justify-center text-stone-500">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
          <span className="text-sm">Loading brands...</span>
        </div>
      )}

      {error && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              to={`/brands/${brand.slug}`}
              className="group bg-white/60 border border-rose-200/80 rounded-2xl p-6 hover:border-rose-400/40 hover:bg-white/80 transition-all"
            >
              <div className="w-14 h-14 rounded-xl bg-rose-400/10 border border-rose-400/20 flex items-center justify-center mb-4 overflow-hidden">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
                ) : (
                  <Award className="w-7 h-7 text-rose-300 group-hover:scale-110 transition-transform" />
                )}
              </div>
              <h3 className="font-semibold text-stone-900 group-hover:text-rose-300 transition-colors">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="mt-2 text-xs text-stone-400 line-clamp-2">{brand.description}</p>
              )}
              <span className="mt-4 inline-flex items-center text-xs font-semibold text-rose-300">
                Shop brand
                <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
