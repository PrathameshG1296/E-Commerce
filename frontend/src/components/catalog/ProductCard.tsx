import React from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../../types/catalog'
import { getDiscountPercentage } from '../../utils/catalog'
import { ShoppingBag, ArrowRight } from 'lucide-react'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const discount = getDiscountPercentage(product.price, product.compare_at_price)

  return (
    <div className="bg-slate-900/30 border border-slate-850 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-slate-700/80 transition-all duration-300 group h-full">
      <div className="aspect-square relative overflow-hidden bg-slate-950">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">
            <ShoppingBag className="w-12 h-12" />
          </div>
        )}

        {discount && (
          <span className="absolute top-3 left-3 bg-red-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            {discount}% OFF
          </span>
        )}

        {product.is_featured && (
          <span className="absolute top-3 right-3 bg-indigo-500 text-white font-bold text-[10px] px-2 py-0.5 rounded-md">
            Featured
          </span>
        )}

        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center text-sm font-bold text-rose-400 uppercase tracking-wide">
            Out of Stock
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
        <div>
          {(product.brands || product.categories) && (
            <div className="flex items-center gap-2 flex-wrap">
              {product.brands && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
                  {product.brands.name}
                </span>
              )}
              {product.brands && product.categories && (
                <span className="text-slate-600">·</span>
              )}
              {product.categories && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                  {product.categories.name}
                </span>
              )}
            </div>
          )}
          <h4 className="font-semibold text-white mt-1 text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {product.name}
          </h4>
          <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {product.description || 'No description provided.'}
          </p>
        </div>

        <div className="pt-2">
          <div className="flex items-baseline space-x-2">
            <span className="text-lg font-bold text-white">₹{product.price.toLocaleString()}</span>
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-xs text-slate-500 line-through">
                ₹{product.compare_at_price.toLocaleString()}
              </span>
            )}
          </div>

          <div className="mt-4">
            <Link
              to={`/products/${product.slug}`}
              className="w-full py-2 bg-slate-900 border border-slate-800 text-slate-300 group-hover:bg-slate-800 group-hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1"
            >
              <span>View Details</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
