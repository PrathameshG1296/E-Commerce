import React from 'react'
import { ProductCatalog } from '../components/catalog/ProductCatalog'

export const Offers: React.FC = () => (
  <ProductCatalog
    title="Offers & Deals"
    subtitle="Products with special discounts — save on compare-at prices."
    defaults={{ offersOnly: true, sortBy: 'price_asc' }}
  />
)
