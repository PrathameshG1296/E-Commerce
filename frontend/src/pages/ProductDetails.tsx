import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { fetchProductBySlug } from '../lib/api'
import { trackProductView, trackAddToCart } from '../lib/analytics'
import { getSessionId as _getSessionId } from '../lib/session'  // kept for tree-shaking safety
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import type { Product } from '../types/catalog'
import { ShoppingBag, ArrowLeft, Loader2, Check, AlertCircle, RefreshCw } from 'lucide-react'

export const ProductDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const loadProduct = async () => {
    if (!slug) return
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProductBySlug(slug)
      setProduct(data)
      if (data.image_url) setActiveImage(data.image_url)
      trackProductView(data.id, data.name)
    } catch (err) {
      setProduct(null)
      setError(err instanceof Error ? err.message : 'Failed to load product.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProduct()
  }, [slug])

  const getDiscountPercentage = (price: number, comparePrice: number | null) => {
    if (!comparePrice || comparePrice <= price) return null
    return Math.round(((comparePrice - price) / comparePrice) * 100)
  }

  const handleAddToCart = async () => {
    if (!product) return
    if (!user) {
      navigate('/auth')
      return
    }
    setAdding(true)
    setCartError(null)
    const result = await addToCart(product.id, quantity)
    setAdding(false)
    if (result.error) {
      setCartError(result.error)
      return
    }
    trackAddToCart(product.id, quantity, product.price, product.name)
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-stone-500">
        <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
        <span className="text-sm font-medium">Loading product from API...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mb-4" />
        <h3 className="text-lg font-bold text-stone-900 mb-2">Product Not Found</h3>
        <p className="text-sm text-stone-400 mb-6 max-w-sm">
          {error || 'The product you are looking for does not exist or has been removed.'}
        </p>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={loadProduct}
            className="px-4 py-2 bg-white border border-rose-200 text-stone-700 text-xs font-semibold rounded-xl flex items-center space-x-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-rose-400 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl"
          >
            Back to store
          </button>
        </div>
      </div>
    )
  }

  const discount = getDiscountPercentage(product.price, product.compare_at_price)
  const imageGallery = [product.image_url, ...(product.images || [])].filter((img): img is string => !!img)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 w-full">
      <Link
        to="/"
        className="inline-flex items-center space-x-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Store</span>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <div className="aspect-square bg-rose-50 border border-rose-100 rounded-3xl overflow-hidden relative">
            {activeImage ? (
              <img src={activeImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-500">
                <ShoppingBag className="w-16 h-16" />
              </div>
            )}
            {discount && (
              <span className="absolute top-4 left-4 bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                {discount}% OFF
              </span>
            )}
          </div>

          {imageGallery.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-1">
              {imageGallery.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveImage(img)}
                  className={`w-20 h-20 bg-rose-50 border rounded-xl overflow-hidden transition-all shrink-0 ${
                    activeImage === img
                      ? 'border-rose-400 ring-2 ring-rose-400/30 scale-95'
                      : 'border-rose-100 hover:border-rose-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-center">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {product.categories && (
                <Link
                  to={`/categories/${product.categories.slug}`}
                  className="px-3 py-1 bg-rose-400/10 text-rose-300 border border-rose-400/20 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-rose-400/20 transition-colors"
                >
                  {product.categories.name}
                </Link>
              )}
              {product.brands && (
                <Link
                  to={`/brands/${product.brands.slug}`}
                  className="px-3 py-1 bg-pink-400/10 text-pink-300 border border-pink-400/20 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-pink-400/20 transition-colors"
                >
                  {product.brands.name}
                </Link>
              )}
            </div>
            {product.stock > 0 ? (
              <span className={`text-xs font-semibold ${product.stock <= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {product.stock <= 5 ? `Only ${product.stock} left in stock!` : 'In Stock'}
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-500">Out of Stock</span>
            )}
          </div>

          <div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-stone-900 leading-tight">
              {product.name}
            </h2>
            <span className="text-xs font-mono text-stone-400 mt-1 block">SKU: {product.slug}</span>
          </div>

          <div className="flex items-baseline space-x-3 p-4 bg-white/50 border border-rose-100 rounded-2xl">
            <span className="text-3xl font-extrabold text-stone-900">₹{product.price.toLocaleString()}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-sm text-stone-400 line-through">
                ₹{product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">Description</h4>
            <p className="text-sm text-stone-700 leading-relaxed">
              {product.description || 'Detailed specifications and product literature are currently unavailable.'}
            </p>
          </div>

          <div className="pt-6 border-t border-rose-100 space-y-4">
            {product.stock > 0 && (
              <div className="flex items-center space-x-4">
                <label htmlFor="quantity" className="text-xs font-bold uppercase tracking-wider text-stone-500">Qty:</label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-xl text-sm font-semibold text-stone-700 focus:outline-none"
                >
                  {[...Array(Math.min(product.stock, 5))].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={product.stock <= 0 || adding}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                product.stock <= 0
                  ? 'bg-white border border-rose-100 text-stone-400 cursor-not-allowed'
                  : addedToCart
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/15'
                    : 'bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 shadow-lg shadow-rose-400/20'
              }`}
            >
              {adding ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : addedToCart ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <span>{product.stock <= 0 ? 'Out of Stock' : 'Add to Shopping Cart'}</span>
              )}
            </button>

            {cartError && (
              <p className="text-xs text-rose-400">{cartError}</p>
            )}

            {!user && product.stock > 0 && (
              <p className="text-[10px] text-stone-400">Login required to add items to cart</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
