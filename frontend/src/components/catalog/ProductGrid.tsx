import React from 'react'
import type { Product } from '../../types/catalog'
import { ProductCard } from './ProductCard'
import { Loader2 } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  emptyMessage?: string
  onReset?: () => void
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading,
  emptyMessage = 'No products found.',
  onReset,
}) => {
  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <span className="text-sm">Loading products...</span>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="h-96 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6">
        <p className="text-slate-400 font-medium">{emptyMessage}</p>
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="mt-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl"
          >
            Reset filters
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
