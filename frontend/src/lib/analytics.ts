/**
 * analytics.ts
 *
 * Fire-and-forget analytics helpers. Every function is safe to call without
 * await — errors are swallowed so they never affect the user experience.
 *
 * Backend endpoint: POST /api/analytics/track
 * Payload: { event_type, session_id, metadata }
 */

import { API_BASE_URL } from './api'
import { getSessionId } from './session'

// ---------------------------------------------------------------------------
// Internal fire-and-forget POST
// ---------------------------------------------------------------------------

function track(eventType: string, metadata: Record<string, unknown> = {}): void {
  const sessionId = getSessionId()
  fetch(`${API_BASE_URL}/api/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: eventType, session_id: sessionId, metadata }),
  }).catch(() => {
    // Silently ignore — analytics must never break the UI
  })
}

// ---------------------------------------------------------------------------
// Public event helpers
// ---------------------------------------------------------------------------

/**
 * Fired when a user lands on a product detail page.
 * Already called in ProductDetails.tsx via the legacy trackProductView import;
 * this version consolidates everything into one place.
 */
export function trackProductView(productId: string, productName?: string): void {
  track('product_view', { product_id: productId, product_name: productName })
}

/**
 * Fired when a user successfully adds a product to their cart.
 */
export function trackAddToCart(
  productId: string,
  quantity: number,
  price?: number,
  productName?: string,
): void {
  track('add_to_cart', {
    product_id: productId,
    quantity,
    price,
    product_name: productName,
  })
}

/**
 * Fired once after a successful payment on the OrderSuccess page.
 */
export function trackPurchase(
  orderId: string,
  totalAmount: number,
  itemCount: number,
): void {
  track('purchase', {
    order_id: orderId,
    total_amount: totalAmount,
    item_count: itemCount,
  })
}

/**
 * Fired when a user performs a search query (debounced on the Search page).
 */
export function trackSearch(query: string, resultsCount?: number): void {
  if (!query.trim()) return
  track('search', { query: query.trim(), results_count: resultsCount })
}

/**
 * Fired when a user clicks through to a category page.
 */
export function trackCategoryView(categorySlug: string, categoryName?: string): void {
  track('category_view', { category_slug: categorySlug, category_name: categoryName })
}
