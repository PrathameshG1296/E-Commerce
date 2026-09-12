import React from 'react'
import type { Category } from '../../types/catalog'
import type { ProductFilters } from '../../types/catalog'
import { SlidersHorizontal } from 'lucide-react'

interface CatalogFiltersProps {
  categories: Category[]
  selectedCategory: string
  onCategoryChange: (id: string) => void
  priceRange: number
  onPriceRangeChange: (value: number) => void
  sortBy: ProductFilters['sortBy']
  onSortByChange: (value: ProductFilters['sortBy']) => void
  showFeaturedOnly: boolean
  onFeaturedChange: (value: boolean) => void
  onReset: () => void
  productCount?: number
  loading?: boolean
  hideCategoryPills?: boolean
}

export const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  sortBy,
  onSortByChange,
  showFeaturedOnly,
  onFeaturedChange,
  onReset,
  productCount,
  loading,
  hideCategoryPills,
}) => {
  return (
    <div className="bg-white/60 border border-rose-200/80 rounded-2xl p-6 sticky top-24 backdrop-blur-sm">
      <div className="flex justify-between items-center pb-4 border-b border-rose-200">
        <h3 className="font-semibold text-stone-900 flex items-center">
          <SlidersHorizontal className="w-4 h-4 mr-2 text-rose-300" />
          Filters
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-stone-400 hover:text-rose-300 transition-colors"
        >
          Reset
        </button>
      </div>

      {!hideCategoryPills && categories.length > 0 && (
        <div className="mt-6 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="block w-full px-3 py-2 bg-rose-50 border border-rose-200 text-stone-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Max Price</label>
        <div className="flex justify-between text-xs text-stone-400 font-mono">
          <span>₹0</span>
          <span>₹{priceRange.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={500}
          max={30000}
          step={500}
          value={priceRange}
          onChange={(e) => onPriceRangeChange(Number(e.target.value))}
          className="w-full accent-rose-400 bg-rose-100 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mt-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as ProductFilters['sortBy'])}
          className="block w-full px-3 py-2 bg-rose-50 border border-rose-200 text-stone-700 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-400"
        >
          <option value="newest">Newest Releases</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="mt-6">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showFeaturedOnly}
            onChange={(e) => onFeaturedChange(e.target.checked)}
            className="accent-rose-400 rounded"
          />
          <span className="text-xs text-stone-700">Featured only</span>
        </label>
      </div>

      {!loading && productCount !== undefined && (
        <p className="mt-6 text-xs text-emerald-400/80 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3">
          {productCount} product{productCount !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  )
}
