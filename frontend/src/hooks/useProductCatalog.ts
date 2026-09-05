import { useState, useEffect, useCallback } from 'react'
import { fetchCategories, fetchProducts } from '../lib/api'
import { filterOfferProducts } from '../utils/catalog'
import type { Category, Product } from '../types/catalog'
import type { ProductFilters } from '../types/catalog'

export interface CatalogDefaults {
  categoryId?: string
  search?: string
  sortBy?: ProductFilters['sortBy']
  isFeatured?: boolean
  offersOnly?: boolean
}

export function useProductCatalog(defaults: CatalogDefaults = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedCategory, setSelectedCategory] = useState(defaults.categoryId ?? 'all')
  const [searchQuery, setSearchQuery] = useState(defaults.search ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(defaults.search ?? '')
  const [priceRange, setPriceRange] = useState(30000)
  const [sortBy, setSortBy] = useState<ProductFilters['sortBy']>(defaults.sortBy ?? 'newest')
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(defaults.isFeatured ?? false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error('Failed to load categories:', err))
  }, [])

  useEffect(() => {
    if (defaults.categoryId) setSelectedCategory(defaults.categoryId)
  }, [defaults.categoryId])

  useEffect(() => {
    if (defaults.search !== undefined) {
      setSearchQuery(defaults.search)
      setDebouncedSearch(defaults.search)
    }
  }, [defaults.search])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data = await fetchProducts({
        categoryId: selectedCategory,
        search: debouncedSearch,
        maxPrice: priceRange,
        isFeatured: showFeaturedOnly || undefined,
        sortBy,
        limit: 100,
      })
      if (defaults.offersOnly) {
        data = filterOfferProducts(data)
      }
      setProducts(data)
    } catch (err) {
      setProducts([])
      setError(err instanceof Error ? err.message : 'Could not load products from the API.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, debouncedSearch, priceRange, sortBy, showFeaturedOnly, defaults.offersOnly])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCategory(defaults.categoryId ?? 'all')
    setPriceRange(30000)
    setSortBy(defaults.sortBy ?? 'newest')
    setShowFeaturedOnly(defaults.isFeatured ?? false)
  }

  return {
    products,
    categories,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    showFeaturedOnly,
    setShowFeaturedOnly,
    showFilters,
    setShowFilters,
    loadProducts,
    resetFilters,
  }
}
