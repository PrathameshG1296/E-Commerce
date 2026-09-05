import React from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react'
import { useProductCatalog, type CatalogDefaults } from '../../hooks/useProductCatalog'
import { CatalogFilters } from './CatalogFilters'
import { ProductGrid } from './ProductGrid'
import type { Category } from '../../types/catalog'

interface ProductCatalogProps {
  title: string
  subtitle?: string
  defaults?: CatalogDefaults
  hideCategoryPills?: boolean
  lockCategory?: boolean
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  title,
  subtitle,
  defaults = {},
  hideCategoryPills = false,
  lockCategory = false,
}) => {
  const catalog = useProductCatalog(defaults)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-slate-400 max-w-2xl">{subtitle}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className={`lg:col-span-1 ${catalog.showFilters ? 'block' : 'hidden lg:block'}`}>
          <CatalogFilters
            categories={catalog.categories}
            selectedCategory={catalog.selectedCategory}
            onCategoryChange={lockCategory ? () => {} : catalog.setSelectedCategory}
            priceRange={catalog.priceRange}
            onPriceRangeChange={catalog.setPriceRange}
            sortBy={catalog.sortBy}
            onSortByChange={catalog.setSortBy}
            showFeaturedOnly={catalog.showFeaturedOnly}
            onFeaturedChange={catalog.setShowFeaturedOnly}
            onReset={catalog.resetFilters}
            productCount={catalog.products.length}
            loading={catalog.loading}
            hideCategoryPills={hideCategoryPills || lockCategory}
          />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={catalog.searchQuery}
                onChange={(e) => catalog.setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-900/40 border border-slate-850 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => catalog.setShowFilters(!catalog.showFilters)}
              className="lg:hidden px-4 py-2.5 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {!hideCategoryPills && !lockCategory && (
            <CategoryPills
              categories={catalog.categories}
              selectedCategory={catalog.selectedCategory}
              onSelect={catalog.setSelectedCategory}
            />
          )}

          {catalog.error && (
            <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl flex items-start justify-between gap-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Could not load products</p>
                  <p className="text-xs mt-1">{catalog.error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={catalog.loadProducts}
                className="shrink-0 flex items-center space-x-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {!catalog.error && (
            <ProductGrid
              products={catalog.products}
              loading={catalog.loading}
              onReset={catalog.resetFilters}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function CategoryPills({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: Category[]
  selectedCategory: string
  onSelect: (id: string) => void
}) {
  const pillClass = (active: boolean) =>
    `px-4 py-1.5 rounded-full text-xs font-semibold transition-all border shrink-0 ${
      active
        ? 'bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/10'
        : 'bg-slate-900/40 border-slate-850 text-slate-400 hover:text-white hover:border-slate-700'
    }`

  return (
    <div className="flex overflow-x-auto space-x-2 pb-2 scrollbar-none">
      <button type="button" onClick={() => onSelect('all')} className={pillClass(selectedCategory === 'all')}>
        All
      </button>
      {categories.map((cat) => (
        <Link key={cat.id} to={`/categories/${cat.slug}`} className={pillClass(false)}>
          {cat.name}
        </Link>
      ))}
    </div>
  )
}
