import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchCategoryBySlug } from '../lib/api'
import type { Category } from '../types/catalog'
import { ProductCatalog } from '../components/catalog/ProductCatalog'
import { Loader2, ArrowLeft } from 'lucide-react'

export const CategoryProducts: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    fetchCategoryBySlug(slug)
      .then((cat) => {
        if (!cat) {
          setNotFound(true)
          setCategory(null)
        } else {
          setCategory(cat)
          setNotFound(false)
        }
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <span className="text-sm">Loading category...</span>
      </div>
    )
  }

  if (notFound || !category) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-xl font-bold text-white">Category not found</h2>
        <Link to="/categories" className="mt-4 inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4 mr-1" />
          All categories
        </Link>
      </div>
    )
  }

  return (
    <ProductCatalog
      title={category.name}
      subtitle={category.description ?? `All products in ${category.name}.`}
      defaults={{ categoryId: category.id }}
      lockCategory
      hideCategoryPills
    />
  )
}
