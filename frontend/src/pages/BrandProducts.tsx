import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchBrandBySlug, fetchBrandProducts } from '../lib/api'
import type { Brand, Product } from '../types/catalog'
import { ProductGrid } from '../components/catalog/ProductGrid'
import { Loader2, ArrowLeft, Award } from 'lucide-react'

export const BrandProducts: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    setError(null)

    Promise.all([fetchBrandBySlug(slug), fetchBrandProducts(slug)])
      .then(([brandData, productList]) => {
        if (!brandData) {
          setNotFound(true)
          setBrand(null)
          setProducts([])
        } else {
          setBrand(brandData)
          setProducts(productList)
          setNotFound(false)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load brand'))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <span className="text-sm">Loading brand...</span>
      </div>
    )
  }

  if (notFound || !brand) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h2 className="text-xl font-bold text-white">Brand not found</h2>
        <Link to="/brands" className="mt-4 inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300">
          <ArrowLeft className="w-4 h-4 mr-1" />
          All brands
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <Link to="/brands" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        All brands
      </Link>

      <div className="flex items-start gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 overflow-hidden">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
          ) : (
            <Award className="w-8 h-8 text-indigo-400" />
          )}
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">{brand.name}</h1>
          {brand.description && <p className="mt-2 text-sm text-slate-400 max-w-2xl">{brand.description}</p>}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      <ProductGrid
        products={products}
        loading={false}
        emptyMessage={`No products found for ${brand.name}.`}
      />
    </div>
  )
}
