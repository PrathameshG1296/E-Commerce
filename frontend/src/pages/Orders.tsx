import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchOrders } from '../lib/cartApi'
import type { Order } from '../types/cart'
import { Loader2, Package, ChevronRight } from 'lucide-react'

const statusColor: Record<string, string> = {
  paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  shipped: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  delivered: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  cancelled: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  failed: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export const Orders: React.FC = () => {
  const { user, getAuthHeaders } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getAuthHeaders()
      .then((headers) => fetchOrders(headers))
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load orders'))
      .finally(() => setLoading(false))
  }, [user, getAuthHeaders])

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Login required</h1>
        <Link to="/auth" className="mt-4 inline-flex text-sm text-indigo-400">Login</Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <h1 className="font-display font-extrabold text-3xl text-white mb-2">My Orders</h1>
      <p className="text-sm text-slate-400 mb-8">Track and review your purchase history.</p>

      {loading && (
        <div className="h-48 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <span className="text-sm">Loading orders...</span>
        </div>
      )}

      {error && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="py-16 text-center border border-dashed border-slate-800 rounded-2xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No orders yet</p>
          <Link to="/shop" className="mt-4 inline-flex text-sm text-indigo-400 hover:text-indigo-300">
            Start shopping
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="block p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                    Order #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {order.created_at ? new Date(order.created_at).toLocaleString() : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${
                      statusColor[order.status] ?? statusColor.pending
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold text-white">₹{order.total_amount.toLocaleString()}</span>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />
                </div>
              </div>
              {order.order_items && order.order_items.length > 0 && (
                <p className="mt-3 text-xs text-slate-500 line-clamp-1">
                  {order.order_items.length} item(s) —{' '}
                  {order.order_items.map((i) => i.products?.name).filter(Boolean).join(', ')}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
