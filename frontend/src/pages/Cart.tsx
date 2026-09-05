import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { Loader2, ShoppingCart, Trash2, Minus, Plus, ArrowRight } from 'lucide-react'

export const Cart: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items, loading, subtotal, itemCount, updateQuantity, removeItem } = useCart()
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 text-center">
        <ShoppingCart className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white">Your cart is waiting</h1>
        <p className="mt-2 text-sm text-slate-400">Log in to view and manage your cart.</p>
        <Link
          to="/auth"
          className="mt-6 inline-flex px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl"
        >
          Login / Sign up
        </Link>
      </div>
    )
  }

  const handleQuantity = async (cartItemId: string, quantity: number, maxStock: number) => {
    const next = Math.max(1, Math.min(quantity, maxStock))
    setUpdatingId(cartItemId)
    setError(null)
    const result = await updateQuantity(cartItemId, next)
    if (result.error) setError(result.error)
    setUpdatingId(null)
  }

  const handleRemove = async (cartItemId: string) => {
    setUpdatingId(cartItemId)
    setError(null)
    const result = await removeItem(cartItemId)
    if (result.error) setError(result.error)
    setUpdatingId(null)
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white">Shopping Cart</h1>
        <p className="mt-2 text-sm text-slate-400">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <span className="text-sm">Loading cart...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-slate-800 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">Your cart is empty</p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center text-sm font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Continue shopping
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const product = item.products
              if (!product) return null
              const lineTotal = product.price * item.quantity
              const isUpdating = updatingId === item.id

              return (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-slate-900/40 border border-slate-800 rounded-2xl"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="w-24 h-24 shrink-0 bg-slate-950 border border-slate-850 rounded-xl overflow-hidden"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-slate-400 mt-1">₹{product.price.toLocaleString()} each</p>

                    <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleQuantity(item.id, item.quantity - 1, product.stock)}
                          className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={isUpdating || item.quantity >= product.stock}
                          onClick={() => handleQuantity(item.id, item.quantity + 1, product.stock)}
                          className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-white">₹{lineTotal.toLocaleString()}</span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 bg-slate-900/40 border border-slate-800 rounded-2xl sticky top-24 space-y-4">
              <h2 className="font-semibold text-white">Order Summary</h2>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="text-white font-semibold">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Shipping</span>
                <span className="text-emerald-400 font-semibold">Free</span>
              </div>
              <div className="pt-4 border-t border-slate-800 flex justify-between">
                <span className="font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">₹{subtotal.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-500/20"
              >
                Proceed to Checkout
              </button>
              <Link to="/shop" className="block text-center text-xs text-slate-500 hover:text-slate-300">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
