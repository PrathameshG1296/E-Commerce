import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchOrderById } from '../lib/cartApi'
import { trackPurchase } from '../lib/analytics'
import type { Order } from '../types/cart'
import { CheckCircle, Loader2, Package, ArrowRight } from 'lucide-react'

export const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { getAuthHeaders } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId) return
    getAuthHeaders()
      .then((headers) => fetchOrderById(orderId, headers))
      .then((data) => {
        setOrder(data)
        if (data) {
          trackPurchase(data.id, data.total_amount, data.order_items?.length || 0)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load order'))
      .finally(() => setLoading(false))
  }, [orderId, getAuthHeaders])

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center text-stone-500">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <span className="text-sm">Loading order...</span>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-center">
      <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
      <h1 className="font-display font-extrabold text-3xl text-stone-900">Payment Successful!</h1>
      <p className="mt-3 text-sm text-stone-500">
        Thank you for your order. We&apos;ll send updates to your email.
      </p>

      {error && (
        <div className="mt-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {order && (
        <div className="mt-8 p-6 bg-white/60 border border-rose-200 rounded-2xl text-left space-y-3">
          <div className="flex items-center gap-2 text-stone-900 font-semibold">
            <Package className="w-5 h-5 text-rose-300" />
            Order #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <p className="text-sm text-stone-500">
            Status: <span className="text-emerald-400 font-semibold capitalize">{order.status}</span>
          </p>
          <p className="text-sm text-stone-500">
            Total: <span className="text-stone-900 font-bold">₹{order.total_amount.toLocaleString()}</span>
          </p>
          {order.razorpay_payment_id && (
            <p className="text-xs text-stone-400 font-mono">Payment ID: {order.razorpay_payment_id}</p>
          )}
        </div>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/orders"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl"
        >
          View all orders
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-white border border-rose-200 text-stone-700 text-sm font-semibold rounded-xl hover:text-stone-900"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  )
}
