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
    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
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
    <header className="border-b border-slate-900 bg-slate-950/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        {/* Top bar */}
        <div className="h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center space-x-2.5 shrink-0" onClick={() => setMobileOpen(false)}>
            <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-white">NovaCart</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/60 border border-slate-800 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
              />
            </div>
          </form>

          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              to="/wishlist"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>
            <Link
              to="/cart"
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
              aria-label="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-indigo-500 text-white rounded-full">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold px-4 py-2 bg-slate-900 border border-slate-800 text-slate-200 hover:text-white hover:bg-slate-850 rounded-xl transition-all"
              >
                <User className="w-3.5 h-3.5" />
                <span>Account</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="hidden sm:inline-flex text-xs font-semibold px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all shadow-md shadow-indigo-500/10"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl"
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
            <Link to="/admin" className="text-sm font-semibold text-purple-400 hover:text-purple-300 whitespace-nowrap">
              Admin
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 px-6 py-4 space-y-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
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
                    isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-300 hover:bg-slate-900'
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
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-purple-400 hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            {user ? (
              <Link
                to="/dashboard"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:bg-slate-900"
                onClick={() => setMobileOpen(false)}
              >
                My Account
              </Link>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-2.5 rounded-xl text-sm font-semibold bg-indigo-500 text-white text-center"
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
