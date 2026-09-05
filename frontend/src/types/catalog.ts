export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
}

export interface Brand {
  id: string
  name: string
  slug: string
  logo_url?: string | null
  description?: string | null
  created_at?: string | null
}

export interface Product {
  id: string
  category_id: string | null
  brand_id?: string | null
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  image_url: string | null
  images: string[]
  stock: number
  is_featured: boolean
  created_at?: string | null
  updated_at?: string | null
  categories: Category | null
  brands?: Brand | null
}

export interface ProductFilters {
  categoryId?: string
  brandId?: string
  search?: string
  maxPrice?: number
  isFeatured?: boolean
  sortBy?: 'newest' | 'price_asc' | 'price_desc'
  limit?: number
}

export interface FlashSale {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string
  is_active: boolean
  products: Product[]
}
