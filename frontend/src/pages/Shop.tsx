import React from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCatalog } from '../components/catalog/ProductCatalog'

export const Shop: React.FC = () => {
  const [params] = useSearchParams()
  const featured = params.get('featured') === 'true'

  return (
    <ProductCatalog
      title="Shop All Products"
      subtitle="Browse our full catalog with search, filters, and sorting powered by your live Supabase database."
      defaults={{ isFeatured: featured || undefined }}
    />
  )
}
