import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { createOrderApi, verifyPaymentApi } from '../lib/cartApi'
import { loadRazorpayScript, openRazorpayCheckout } from '../lib/razorpay'
import type { ShippingAddress } from '../types/cart'
import { Loader2, ArrowLeft, CreditCard, MapPin } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi',
]

export const Checkout: React.FC = () => {
  const { user, profile, getAuthHeaders, updateProfile } = useAuth()
  const { items, subtotal, loading: cartLoading, refreshCart } = useCart()
  const navigate = useNavigate()

  const [form, setForm] = useState<ShippingAddress>({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    address_line1: profile?.address_line1 ?? '',
    address_line2: profile?.address_line2 ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? 'Maharashtra',
    postal_code: profile?.postal_code ?? '',
    country: profile?.country ?? 'India',
  })
  const [saveToProfile, setSaveToProfile] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (profile) {
      setForm((prev) => ({
        full_name: prev.full_name || profile.full_name || '',
        phone: prev.phone || profile.phone || '',
        address_line1: prev.address_line1 || profile.address_line1 || '',
        address_line2: prev.address_line2 || profile.address_line2 || '',
        city: prev.city || profile.city || '',
        state: prev.state || profile.state || 'Maharashtra',
        postal_code: prev.postal_code || profile.postal_code || '',
        country: prev.country || profile.country || 'India',
      }))
    }
  }, [profile])

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Login required</h1>
        <p className="mt-2 text-sm text-slate-400">Please log in to complete checkout.</p>
        <Link to="/auth" className="mt-6 inline-flex px-5 py-2.5 bg-indigo-500 text-white text-sm font-semibold rounded-xl">
          Login
        </Link>
      </div>
    )
  }

  if (!cartLoading && items.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1 className="text-2xl font-bold text-white">Cart is empty</h1>
        <Link to="/shop" className="mt-4 inline-flex text-sm text-indigo-400 hover:text-indigo-300">
          Continue shopping
        </Link>
      </div>
    )
  }

  const updateField = (field: keyof ShippingAddress, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPaying(true)

    try {
      // If user opted to save to profile, update profile in background
      if (saveToProfile) {
        updateProfile({
          full_name: form.full_name,
          phone: form.phone,
          address_line1: form.address_line1,
          address_line2: form.address_line2,
          city: form.city,
          state: form.state,
          postal_code: form.postal_code,
          country: form.country,
        }).catch((err) => console.warn('Non-blocking profile sync failed:', err))
      }

      const headers = await getAuthHeaders()
      const orderData = await createOrderApi(form, headers)

      const loaded = await loadRazorpayScript()
      if (!loaded) {
        throw new Error('Failed to load Razorpay checkout')
      }

      openRazorpayCheckout({
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'NovaCart',
        description: 'Order payment',
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: form.full_name,
          email: user.email ?? undefined,
          contact: form.phone,
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          try {
            await verifyPaymentApi(
              {
                order_id: orderData.order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              headers,
            )
            await refreshCart()
            navigate(`/orders/${orderData.order_id}/success`)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed')
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed')
      setPaying(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <Link to="/cart" className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to cart
      </Link>

      <h1 className="font-display font-extrabold text-3xl text-white mb-8">Checkout</h1>

      {error && (
        <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handlePay} className="lg:col-span-2 space-y-6">
          <section className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-white font-semibold">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Shipping Address
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400">Full name</span>
                <input
                  required
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Phone</span>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400">Address line 1</span>
                <input
                  required
                  value={form.address_line1}
                  onChange={(e) => updateField('address_line1', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-semibold text-slate-400">Address line 2 (optional)</span>
                <input
                  value={form.address_line2 ?? ''}
                  onChange={(e) => updateField('address_line2', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">City</span>
                <input
                  required
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">State</span>
                <select
                  required
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Postal code</span>
                <input
                  required
                  value={form.postal_code}
                  onChange={(e) => updateField('postal_code', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-400">Country</span>
                <input
                  required
                  value={form.country}
                  onChange={(e) => updateField('country', e.target.value)}
                  className="mt-1 w-full px-3 py-2.5 bg-slate-950 border border-slate-850 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
              </label>

              <div className="sm:col-span-2 pt-2 border-t border-slate-800/60">
                <label className="inline-flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 select-none hover:text-white transition-colors">
                  <input
                    type="checkbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500/30 cursor-pointer"
                  />
                  <span>Save / update this as my default shipping address in my profile</span>
                </label>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={paying || cartLoading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {paying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Pay ₹{subtotal.toLocaleString()} with Razorpay
              </>
            )}
          </button>
        </form>

        <aside className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl h-fit space-y-4">
          <h2 className="font-semibold text-white">Order Summary</h2>
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm gap-4">
                <span className="text-slate-400 line-clamp-1">
                  {item.products?.name} × {item.quantity}
                </span>
                <span className="text-white shrink-0">
                  ₹{((item.products?.price ?? 0) * item.quantity).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
          <div className="pt-4 border-t border-slate-800 flex justify-between font-bold text-white">
            <span>Total</span>
            <span>₹{subtotal.toLocaleString()}</span>
          </div>
        </aside>
      </div>
    </div>
  )
}
