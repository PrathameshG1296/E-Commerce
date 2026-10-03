import type { Brand, Category, FlashSale, Product, ProductFilters } from '../types/catalog'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, init)
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const detail = typeof body.detail === 'string' ? body.detail : `Request failed (${response.status})`
    throw new Error(detail)
  }
  return response.json() as Promise<T>
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories')
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams()

  if (filters.categoryId && filters.categoryId !== 'all') {
    params.set('category_id', filters.categoryId)
  }
  if (filters.brandId) {
    params.set('brand_id', filters.brandId)
  }
  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }
  if (filters.maxPrice !== undefined) {
    params.set('max_price', String(filters.maxPrice))
  }
  if (filters.isFeatured) {
    params.set('is_featured', 'true')
  }
  if (filters.sortBy) {
    params.set('sort_by', filters.sortBy)
  }
  if (filters.limit) {
    params.set('limit', String(filters.limit))
  }

  const query = params.toString()
  return apiFetch<Product[]>(`/api/products${query ? `?${query}` : ''}`)
}

export async function fetchProductBySlug(slug: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${slug}`)
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await apiFetch<Category>(`/api/categories/${slug}`)
  } catch {
    return null
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  return apiFetch<Brand[]>('/api/brands')
}

export async function fetchBrandBySlug(slug: string): Promise<Brand | null> {
  try {
    return await apiFetch<Brand>(`/api/brands/${slug}`)
  } catch {
    return null
  }
}

export async function fetchBrandProducts(slug: string, limit = 50): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/brands/${slug}/products?limit=${limit}`)
}

export async function fetchFlashSale(): Promise<FlashSale> {
  return apiFetch<FlashSale>('/api/collections/flash-sale')
}

export async function fetchBestSellers(limit = 12): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/collections/best-sellers?limit=${limit}`)
}

export async function fetchTrending(limit = 12): Promise<Product[]> {
  return apiFetch<Product[]>(`/api/collections/trending?limit=${limit}`)
}

export async function trackProductView(productId: string, sessionId: string): Promise<void> {
  await apiFetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_type: 'product_view',
      session_id: sessionId,
      metadata: { product_id: productId },
    }),
  })
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const data = await apiFetch<{ status: string }>('/api/health')
    return data.status === 'healthy'
  } catch {
    return false
  }
}
