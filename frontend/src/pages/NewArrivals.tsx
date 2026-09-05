import React from 'react'
import { ProductCatalog } from '../components/catalog/ProductCatalog'

export const NewArrivals: React.FC = () => (
  <ProductCatalog
    title="New Arrivals"
    subtitle="The latest products added to NovaCart, sorted by newest first."
    defaults={{ sortBy: 'newest' }}
  />
)
