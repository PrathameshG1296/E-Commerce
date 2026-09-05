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
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 sticky top-24 backdrop-blur-sm">
      <div className="flex justify-between items-center pb-4 border-b border-slate-800">
        <h3 className="font-semibold text-white flex items-center">
          <SlidersHorizontal className="w-4 h-4 mr-2 text-indigo-400" />
          Filters
        </h3>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
        >
          Reset
        </button>
      </div>

      {!hideCategoryPills && categories.length > 0 && (
        <div className="mt-6 space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Max Price</label>
        <div className="flex justify-between text-xs text-slate-500 font-mono">
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
          className="w-full accent-indigo-500 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <div className="mt-6 space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as ProductFilters['sortBy'])}
          className="block w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
            className="accent-indigo-500 rounded"
          />
          <span className="text-xs text-slate-300">Featured only</span>
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
