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
        <ShoppingCart className="w-12 h-12 text-rose-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-stone-900">Your cart is waiting</h1>
        <p className="mt-2 text-sm text-stone-500">Log in to view and manage your cart.</p>
        <Link
          to="/auth"
          className="mt-6 inline-flex px-5 py-2.5 bg-rose-400 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl"
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
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900">Shopping Cart</h1>
        <p className="mt-2 text-sm text-stone-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-stone-500">
          <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
          <span className="text-sm">Loading cart...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-rose-200 rounded-2xl">
          <ShoppingCart className="w-12 h-12 text-stone-500 mx-auto mb-4" />
          <p className="text-stone-500 font-medium">Your cart is empty</p>
          <Link
            to="/shop"
            className="mt-4 inline-flex items-center text-sm font-semibold text-rose-300 hover:text-rose-300"
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
                  className="flex gap-4 p-4 bg-white/60 border border-rose-200 rounded-2xl"
                >
                  <Link
                    to={`/products/${product.slug}`}
                    className="w-24 h-24 shrink-0 bg-rose-50 border border-rose-100 rounded-xl overflow-hidden"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-500">
                        <ShoppingCart className="w-8 h-8" />
                      </div>
                    )}
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${product.slug}`}
                      className="font-semibold text-stone-900 hover:text-rose-300 transition-colors line-clamp-1"
                    >
                      {product.name}
                    </Link>
                    <p className="text-sm text-stone-500 mt-1">₹{product.price.toLocaleString()} each</p>

                    <div className="mt-3 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdating || item.quantity <= 1}
                          onClick={() => handleQuantity(item.id, item.quantity - 1, product.stock)}
                          className="p-1.5 bg-white border border-rose-200 rounded-lg text-stone-700 disabled:opacity-40"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-stone-900">{item.quantity}</span>
                        <button
                          type="button"
                          disabled={isUpdating || item.quantity >= product.stock}
                          onClick={() => handleQuantity(item.id, item.quantity + 1, product.stock)}
                          className="p-1.5 bg-white border border-rose-200 rounded-lg text-stone-700 disabled:opacity-40"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-stone-900">₹{lineTotal.toLocaleString()}</span>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleRemove(item.id)}
                          className="p-2 text-stone-400 hover:text-rose-400 transition-colors"
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
            <div className="p-6 bg-white/60 border border-rose-200 rounded-2xl sticky top-24 space-y-4">
              <h2 className="font-semibold text-stone-900">Order Summary</h2>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Subtotal</span>
                <span className="text-stone-900 font-semibold">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-stone-500">
                <span>Shipping</span>
                <span className="text-emerald-400 font-semibold">Free</span>
              </div>
              <div className="pt-4 border-t border-rose-200 flex justify-between">
                <span className="font-semibold text-stone-900">Total</span>
                <span className="text-xl font-bold text-stone-900">₹{subtotal.toLocaleString()}</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 text-sm font-semibold rounded-xl shadow-lg shadow-rose-400/20"
              >
                Proceed to Checkout
              </button>
              <Link to="/shop" className="block text-center text-xs text-stone-400 hover:text-stone-700">
                Continue shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
