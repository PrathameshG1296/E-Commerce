import React, { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { fetchOrderById, cancelOrderApi } from '../lib/cartApi'
import type { Order } from '../types/cart'
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  Home,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Printer,
  ShoppingBag,
  CreditCard,
  MapPin,
  XCircle,
  RotateCcw,
} from 'lucide-react'

const orderSteps = [
  { key: 'pending', label: 'Order Placed', desc: 'Awaiting payment confirmation', icon: Clock },
  { key: 'paid', label: 'Payment Confirmed', desc: 'Order is being prepared', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', desc: 'In transit with courier', icon: Truck },
  { key: 'delivered', label: 'Delivered', desc: 'Package handed over', icon: Home },
]

export const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>()
  const { user, getAuthHeaders } = useAuth()
  const { addToCart } = useCart()
  const navigate = useNavigate()

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!orderId || !user) return

    const loadOrder = async () => {
      setLoading(true)
      try {
        const headers = await getAuthHeaders()
        const data = await fetchOrderById(orderId, headers)
        setOrder(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details')
      } finally {
        setLoading(false)
      }
    }

    loadOrder()
  }, [orderId, user, getAuthHeaders])

  const handleCancelOrder = async () => {
    if (!orderId) return
    setCancelling(true)
    try {
      const headers = await getAuthHeaders()
      const updated = await cancelOrderApi(orderId, headers)
      setOrder(updated)
      setCancelModalOpen(false)
      setActionSuccess('Your order has been cancelled successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setCancelling(false)
    }
  }

  const handleReorder = async () => {
    if (!order || !order.order_items) return
    for (const item of order.order_items) {
      if (item.product_id) {
        await addToCart(item.product_id, item.quantity)
      }
    }
    navigate('/cart')
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-stone-500">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <span className="text-sm font-medium">Fetching order tracking info...</span>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="p-6 border border-rose-500/20 bg-rose-500/10 text-rose-300 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-stone-900">Error loading order</p>
              <p className="text-sm text-rose-300/80">{error || 'Order not found'}</p>
            </div>
          </div>
          <Link
            to="/orders"
            className="px-4 py-2 bg-white border border-rose-200 hover:border-rose-300 text-sm font-semibold rounded-xl text-stone-900 inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to orders
          </Link>
        </div>
      </div>
    )
  }

  const getStepStatus = (stepKey: string) => {
    if (order.status === 'cancelled' || order.status === 'failed') return 'inactive'
    const statusOrder = ['pending', 'paid', 'shipped', 'delivered']
    const currentIndex = statusOrder.indexOf(order.status)
    const stepIndex = statusOrder.indexOf(stepKey)

    if (currentIndex >= stepIndex) return 'completed'
    if (currentIndex === stepIndex - 1) return 'current'
    return 'pending'
  }

  const canCancel = ['pending', 'paid'].includes(order.status)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-500 hover:text-rose-300 mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Orders
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-stone-900">
              Order #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                order.status === 'paid'
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                  : order.status === 'delivered'
                  ? 'text-rose-300 bg-rose-400/10 border-rose-400/20'
                  : order.status === 'shipped'
                  ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
                  : order.status === 'cancelled' || order.status === 'failed'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Placed on {order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : '—'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-white border border-rose-200 hover:border-rose-300 hover:bg-rose-100 text-stone-700 text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Invoice
          </button>
          <button
            onClick={handleReorder}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors shadow-lg shadow-rose-500/20"
          >
            <RotateCcw className="w-4 h-4" /> Buy Again
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Visual Tracking Progress Timeline */}
      <div className="mb-8 p-6 sm:p-8 bg-white/80 border border-rose-200/80 backdrop-blur-xl rounded-2xl shadow-xl">
        <h2 className="text-sm font-semibold text-stone-700 mb-6 flex items-center gap-2">
          <Package className="w-4 h-4 text-rose-300" /> Delivery Status Tracker
        </h2>

        {order.status === 'cancelled' || order.status === 'failed' ? (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-300">
            <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
            <div>
              <p className="font-semibold text-stone-900">Order {order.status === 'cancelled' ? 'Cancelled' : 'Failed'}</p>
              <p className="text-xs text-rose-300/80">
                {order.status === 'cancelled'
                  ? 'This order was cancelled. Any debited amount will be refunded according to your payment provider guidelines.'
                  : 'Payment for this order could not be completed.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline track */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              {orderSteps.map((step) => {
                const status = getStepStatus(step.key)
                const Icon = step.icon
                const isCompleted = status === 'completed'
                const isCurrent = status === 'current'

                return (
                  <div key={step.key} className="flex md:flex-col items-center md:text-center gap-4 md:gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20'
                          : isCurrent
                          ? 'bg-rose-400/20 border-2 border-rose-400 text-rose-300 animate-pulse shadow-lg shadow-rose-400/20'
                          : 'bg-rose-50 border border-rose-200 text-stone-500'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isCurrent
                            ? 'text-rose-300'
                            : 'text-stone-400'
                        }`}
                      >
                        {step.label}
                      </p>
                      <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tracking Info */}
            {(order.tracking_number || order.carrier) && (
              <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">Tracking Information</p>
                    <p className="text-xs text-stone-500">
                      Shipped via <span className="font-bold text-stone-700">{order.carrier || 'Standard Courier'}</span>
                    </p>
                  </div>
                </div>
                {order.tracking_number && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-stone-500 tracking-wider">Tracking Number</p>
                    <p className="font-mono font-bold text-stone-900 text-sm">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Order Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Itemized Order List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white/70 border border-rose-200/80 backdrop-blur-xl rounded-2xl">
            <h3 className="font-display font-bold text-lg text-stone-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-rose-300" /> Items in this Order ({(order.order_items || []).length})
            </h3>

            <div className="divide-y divide-slate-800">
              {(order.order_items || []).map((item) => {
                const prod = item.products
                return (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-rose-50 border border-rose-200 overflow-hidden shrink-0 flex items-center justify-center">
                      {prod?.image_url ? (
                        <img
                          src={prod.image_url}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-stone-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {prod?.slug ? (
                        <Link
                          to={`/products/${prod.slug}`}
                          className="text-sm font-semibold text-stone-900 hover:text-rose-300 transition-colors line-clamp-1"
                        >
                          {prod.name}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-stone-900 line-clamp-1">{prod?.name || 'Product'}</p>
                      )}
                      <p className="text-xs text-stone-500 mt-1">
                        Qty: <span className="text-stone-800 font-medium">{item.quantity}</span> × ₹{item.price.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-stone-900">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cancellation Option */}
          {canCancel && (
            <div className="p-6 bg-white/50 border border-rose-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone-700">Need to cancel this order?</p>
                <p className="text-xs text-stone-400 mt-0.5">
                  You can cancel your order anytime before it is dispatched for delivery.
                </p>
              </div>
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl transition-colors shrink-0"
              >
                Cancel Order
              </button>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Summary & Delivery Info */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="p-6 bg-white/70 border border-rose-200/80 backdrop-blur-xl rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-rose-300" /> Payment & Summary
            </h3>

            <div className="space-y-2 text-xs text-stone-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-stone-800 font-medium">₹{order.total_amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-emerald-400 font-medium">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Tax</span>
                <span className="text-stone-800 font-medium">Included</span>
              </div>
              <div className="pt-3 border-t border-rose-200 flex justify-between text-sm font-bold text-stone-900">
                <span>Total Paid</span>
                <span className="text-rose-300 text-base">₹{order.total_amount.toLocaleString()}</span>
              </div>
            </div>

            {order.razorpay_payment_id && (
              <div className="pt-3 border-t border-rose-200/80 text-[11px] text-stone-400 space-y-1 font-mono">
                <p>Payment Ref: {order.razorpay_payment_id}</p>
                {order.razorpay_order_id && <p>Razorpay Order: {order.razorpay_order_id}</p>}
              </div>
            )}
          </div>

          {/* Shipping Address Card */}
          <div className="p-6 bg-white/70 border border-rose-200/80 backdrop-blur-xl rounded-2xl space-y-3">
            <h3 className="font-display font-bold text-base text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-300" /> Delivery Address
            </h3>

            {order.shipping_address ? (
              <div className="text-xs text-stone-700 space-y-1 leading-relaxed">
                <p className="font-bold text-stone-900">{order.shipping_address.full_name}</p>
                <p className="text-stone-500">{order.shipping_address.phone}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && <p>{order.shipping_address.address_line2}</p>}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                  <span className="font-mono text-stone-800">{order.shipping_address.postal_code}</span>
                </p>
                <p className="text-stone-500">{order.shipping_address.country || 'India'}</p>
              </div>
            ) : (
              <p className="text-xs text-stone-400">No address recorded</p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Order Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-50/80 backdrop-blur-sm">
          <div className="bg-white border border-rose-200 p-6 rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">Cancel this order?</h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Are you sure you want to cancel order #{order.id.slice(0, 8).toUpperCase()}? This action will immediately release reserved inventory.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-rose-100 transition-colors"
              >
                No, Keep Order
              </button>
              <button
                type="button"
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20"
              >
                {cancelling && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Yes, Cancel Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
