import type { Product } from '../types/catalog'

export function getDiscountPercentage(price: number, comparePrice: number | null): number | null {
  if (!comparePrice || comparePrice <= price) return null
  return Math.round(((comparePrice - price) / comparePrice) * 100)
}

export function filterOfferProducts(products: Product[]): Product[] {
  return products.filter(
    (p) => p.compare_at_price != null && p.compare_at_price > p.price
  )
}
