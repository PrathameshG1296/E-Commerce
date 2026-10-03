import React, { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCatalog } from '../components/catalog/ProductCatalog'
import { trackSearch } from '../lib/analytics'

export const Search: React.FC = () => {
  const [params] = useSearchParams()
  const query = params.get('q') ?? ''

  useEffect(() => {
    if (query) {
      trackSearch(query)
    }
  }, [query])

  return (
    <ProductCatalog
      title={query ? `Results for "${query}"` : 'Search Products'}
      subtitle="Find products by name or description across the NovaCart catalog."
      defaults={{ search: query }}
    />
  )
}
