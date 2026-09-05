import type {
  CartItem,
  CreateOrderResponse,
  Order,
  ShippingAddress,
  VerifyPaymentPayload,
} from '../types/cart'
import { authFetch } from './apiAuth'

export async function fetchCart(headers: Record<string, string>): Promise<CartItem[]> {
  return authFetch<CartItem[]>('/api/cart', headers)
}

export async function addToCartApi(
  productId: string,
  quantity: number,
  headers: Record<string, string>,
): Promise<CartItem> {
  return authFetch<CartItem>('/api/cart', headers, {
    method: 'POST',
    body: JSON.stringify({ product_id: productId, quantity }),
  })
}

export async function updateCartItemApi(
  cartItemId: string,
  quantity: number,
  headers: Record<string, string>,
): Promise<CartItem> {
  return authFetch<CartItem>(`/api/cart/${cartItemId}`, headers, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  })
}

export async function removeCartItemApi(
  cartItemId: string,
  headers: Record<string, string>,
): Promise<void> {
  await authFetch(`/api/cart/${cartItemId}`, headers, { method: 'DELETE' })
}

export async function clearCartApi(headers: Record<string, string>): Promise<void> {
  await authFetch('/api/cart', headers, { method: 'DELETE' })
}

export async function createOrderApi(
  shippingAddress: ShippingAddress,
  headers: Record<string, string>,
): Promise<CreateOrderResponse> {
  return authFetch<CreateOrderResponse>('/api/orders/create', headers, {
    method: 'POST',
    body: JSON.stringify({ shipping_address: shippingAddress }),
  })
}

export async function verifyPaymentApi(
  payload: VerifyPaymentPayload,
  headers: Record<string, string>,
): Promise<{ status: string; order_id: string }> {
  return authFetch('/api/orders/verify-payment', headers, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function fetchOrders(headers: Record<string, string>): Promise<Order[]> {
  return authFetch<Order[]>('/api/orders', headers)
}

export async function fetchOrderById(
  orderId: string,
  headers: Record<string, string>,
): Promise<Order> {
  return authFetch<Order>(`/api/orders/${orderId}`, headers)
}

export async function cancelOrderApi(
  orderId: string,
  headers: Record<string, string>,
): Promise<Order> {
  return authFetch<Order>(`/api/orders/${orderId}/cancel`, headers, {
    method: 'POST',
  })
}

