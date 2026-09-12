import React from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { footerShop, footerCompany, footerLegal } from '../config/navigation'

export const Footer: React.FC = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-rose-100 bg-rose-50/80 mt-auto relative z-10">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-tr from-rose-400 to-purple-600 p-1.5 rounded-lg">
                <ShoppingBag className="w-4 h-4 text-stone-900" />
              </div>
              <span className="font-display font-bold text-lg text-stone-900">NovaCart</span>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
              Your premium destination for electronics, fashion, home essentials, and more. Secure checkout powered by Razorpay.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Shop</h4>
            <ul className="space-y-2">
              {footerShop.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-xs text-stone-400 hover:text-rose-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Company</h4>
            <ul className="space-y-2">
              {footerCompany.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-xs text-stone-400 hover:text-rose-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLegal.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="text-xs text-stone-400 hover:text-rose-300 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-rose-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500">
          <span>© {year} NovaCart. All rights reserved.</span>
          <span>Built with React + FastAPI + Supabase</span>
        </div>
      </div>
    </footer>
  )
}