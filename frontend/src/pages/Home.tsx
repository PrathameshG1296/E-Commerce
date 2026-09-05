import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchCategories, fetchProducts, fetchBestSellers, fetchTrending, fetchFlashSale } from '../lib/api'
import type { Category, Product } from '../types/catalog'
import { ProductCard } from '../components/catalog/ProductCard'
import {
  Sparkles,
  ArrowRight,
  ShoppingBag,
  Zap,
  Tag,
  Grid3X3,
  Loader2,
  TrendingUp,
  Award,
  Flame,
} from 'lucide-react'

export const Home: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [featured, setFeatured] = useState<Product[]>([])
  const [newArrivals, setNewArrivals] = useState<Product[]>([])
  const [bestSellers, setBestSellers] = useState<Product[]>([])
  const [trending, setTrending] = useState<Product[]>([])
  const [flashSaleCount, setFlashSaleCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchCategories(),
      fetchProducts({ isFeatured: true, limit: 4 }),
      fetchProducts({ sortBy: 'newest', limit: 4 }),
      fetchBestSellers(4).catch(() => []),
      fetchTrending(4).catch(() => []),
      fetchFlashSale().then((s) => s.products.length).catch(() => 0),
    ])
      .then(([cats, feat, newest, bestsellers, trendingProducts, flashCount]) => {
        setCategories(cats)
        setFeatured(feat)
        setNewArrivals(newest)
        setBestSellers(bestsellers)
        setTrending(trendingProducts)
        setFlashSaleCount(flashCount)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-10 pb-6 w-full">
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="max-w-xl relative z-10 space-y-4">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Welcome to NovaCart</span>
            </span>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl leading-tight text-white">
              Shop smarter. <br />
              <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Live deals from Supabase.
              </span>
            </h1>
            <p className="text-sm text-slate-400 max-w-md">
              Premium electronics, fashion, and home essentials — delivered with secure Razorpay checkout.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                to="/shop"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-500/10 transition-all group"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Now</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/offers"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white text-xs font-bold rounded-xl transition-all"
              >
                <Tag className="w-4 h-4" />
                <span>View Offers</span>
              </Link>
            </div>
          </div>
          <ShoppingBag className="absolute right-4 bottom-4 w-32 h-32 md:w-48 md:h-48 text-white opacity-5 md:opacity-10 pointer-events-none" />
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-6xl mx-auto px-6 pb-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/flash-sale', label: 'Flash Sale', icon: Flame, color: 'text-rose-400', badge: flashSaleCount > 0 ? `${flashSaleCount} deals` : undefined },
            { to: '/best-sellers', label: 'Best Sellers', icon: Award, color: 'text-amber-400' },
            { to: '/trending', label: 'Trending', icon: TrendingUp, color: 'text-cyan-400' },
            { to: '/brands', label: 'Brands', icon: Grid3X3, color: 'text-indigo-400' },
          ].map(({ to, label, icon: Icon, color, badge }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center space-x-3 p-4 bg-slate-900/30 border border-slate-850 rounded-2xl hover:border-slate-700 transition-all group relative"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">{label}</span>
              {badge && (
                <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 bg-rose-500/20 text-rose-400 rounded-md">
                  {badge}
                </span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Secondary quick links */}
      <section className="max-w-6xl mx-auto px-6 pb-6 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/new-arrivals', label: 'New Arrivals', icon: Zap, color: 'text-emerald-400' },
            { to: '/offers', label: 'Offers', icon: Tag, color: 'text-rose-400' },
            { to: '/categories', label: 'Categories', icon: Grid3X3, color: 'text-indigo-400' },
            { to: '/shop', label: 'All Products', icon: ShoppingBag, color: 'text-purple-400' },
          ].map(({ to, label, icon: Icon, color }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center space-x-3 p-4 bg-slate-900/30 border border-slate-850 rounded-2xl hover:border-slate-700 transition-all group"
            >
              <Icon className={`w-5 h-5 ${color}`} />
              <span className="text-xs font-semibold text-slate-300 group-hover:text-white">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Categories preview */}
      {!loading && categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-white">Shop by Category</h2>
            <Link to="/categories" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/categories/${cat.slug}`}
                className="p-5 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-indigo-500/30 transition-all text-center group"
              >
                <Grid3X3 className="w-8 h-8 mx-auto text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-white">{cat.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white">Featured Products</h2>
          <Link to="/shop?featured=true" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
            See all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Best sellers */}
      {!loading && bestSellers.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-white">Best Sellers</h2>
            <Link to="/best-sellers" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {bestSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Trending */}
      {!loading && trending.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-8 w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-white">Trending Now</h2>
            <Link to="/trending" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
              View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* New arrivals */}
      <section className="max-w-6xl mx-auto px-6 py-8 pb-12 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl text-white">New Arrivals</h2>
          <Link to="/new-arrivals" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center">
            View all <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
