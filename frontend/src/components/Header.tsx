import React, { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { mainNav } from '../config/navigation'
import {
  ShoppingBag,
  Search,
  Heart,
  ShoppingCart,
  Menu,
  X,
  User,
} from 'lucide-react'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors whitespace-nowrap ${
    isActive ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
  }`

export const Header: React.FC = () => {
  const { user, profile } = useAuth()
  const { itemCount } = useCart()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`)
      setMobileOpen(false)
    }
  }

  return (
    <header className="border-b border-rose-100 bg-rose-50/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center space-x-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="bg-gradient-to-tr from-rose-400 to-purple-600 p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-stone-900" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-stone-900">NovaCart</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-white/80 border border-rose-200 text-stone-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400"
              />
            </div>
          </form>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              to="/wishlist"
              className="p-2 text-stone-500 hover:text-stone-900 hover:bg-white rounded-xl transition-all"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="relative p-2 text-stone-500 hover:text-stone-900 hover:bg-white rounded-xl transition-all"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-rose-400 text-white rounded-full">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 bg-white border border-rose-200 text-stone-800 hover:text-stone-900 hover:bg-rose-50 rounded-xl transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 bg-rose-400 hover:bg-rose-500 text-white rounded-xl transition-all shadow-md shadow-rose-400/10"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-stone-500 hover:text-stone-900 rounded-xl"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6 pb-3 overflow-x-auto scrollbar-none">
          {mainNav.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
          {profile?.is_admin && (
            <Link to="/admin" className="text-sm font-semibold text-pink-300 hover:text-purple-300 whitespace-nowrap">
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-rose-100 bg-rose-50 px-6 py-4 space-y-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-rose-200 text-stone-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400/30"
              />
            </div>
          </form>
          <nav className="flex flex-col space-y-1">
            {mainNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive ? 'bg-rose-400/10 text-rose-300' : 'text-stone-700 hover:bg-white'
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </NavLink>
            ))}
            {profile?.is_admin && (
              <Link
                to="/admin"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-pink-300 hover:bg-white"
                onClick={() => setMobileOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            {user ? (
              <Link
                to="/dashboard"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-stone-700 hover:bg-white"
                onClick={() => setMobileOpen(false)}
              >
                My Account
              </Link>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-rose-400 text-white text-center"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}