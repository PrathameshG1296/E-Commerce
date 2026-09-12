import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchFlashSale } from '../lib/api'
import type { FlashSale as FlashSaleData } from '../types/catalog'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { Loader2, Zap, Clock, ArrowRight } from 'lucide-react'

function useCountdown(endsAt: string | null) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    if (!endsAt) return

    const tick = () => {
      const diff = new Date(endsAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Ended')
        return
      }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1000)
      setRemaining(`${h}h ${m}m ${s}s`)
    }

    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  return remaining
}

export const FlashSale: React.FC = () => {
  const [sale, setSale] = useState<FlashSaleData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const countdown = useCountdown(sale?.ends_at ?? null)

  useEffect(() => {
    fetchFlashSale()
      .then(setSale)
      .catch((err) => setError(err instanceof Error ? err.message : 'No active flash sale'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-stone-500">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <span className="text-sm">Loading flash sale...</span>
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-16 w-full text-center">
        <Zap className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h1 className="font-display font-extrabold text-2xl text-stone-900">No Active Flash Sale</h1>
        <p className="mt-2 text-sm text-stone-500 max-w-md mx-auto">
          {error || 'Check back soon for limited-time deals.'}
        </p>
        <Link
          to="/offers"
          className="mt-6 inline-flex items-center text-sm font-semibold text-rose-300 hover:text-rose-300"
        >
          Browse offers
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-8 p-6 md:p-8 bg-gradient-to-r from-rose-950/40 to-amber-950/30 border border-rose-500/20 rounded-3xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-amber-400 bg-amber-500/10 rounded-full border border-amber-500/20 mb-3">
              <Zap className="w-3.5 h-3.5" />
              Flash Sale
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">{sale.title}</h1>
            <p className="mt-2 text-sm text-stone-500">Limited-time prices — grab them before they&apos;re gone.</p>
          </div>
          {countdown && (
            <div className="flex items-center gap-2 px-4 py-3 bg-rose-50/60 border border-rose-200 rounded-2xl">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Ends in</p>
                <p className="text-lg font-bold text-stone-900 tabular-nums">{countdown}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProductGrid
        products={sale.products}
        loading={false}
        emptyMessage="No products in this flash sale yet."
      />
    </div>
  )
}
