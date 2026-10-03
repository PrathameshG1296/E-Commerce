export interface CartProduct {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  stock: number
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at?: string | null
  updated_at?: string | null
  products: CartProduct | null
}

export interface ShippingAddress {
  full_name: string
  phone: string
  address_line1: string
  address_line2?: string
  city: string
  state: string
  postal_code: string
  country: string
}

export interface OrderItem {
  id: string
  product_id: string | null
  quantity: number
  price: number
  products?: CartProduct | null
}

export interface Order {
  id: string
  user_id: string | null
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  status: string
  total_amount: number
  tracking_number?: string | null
  carrier?: string | null
  shipping_address: ShippingAddress
  created_at?: string | null
  order_items?: OrderItem[]
}

export interface CreateOrderResponse {
  order_id: string
  razorpay_order_id: string
  amount: number
  currency: string
  key_id: string
}

export interface VerifyPaymentPayload {
  order_id: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}
