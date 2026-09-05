import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../lib/api'
import {
  LogOut,
  User as UserIcon,
  Shield,
  Key,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  MapPin,
  Save,
  Package,
  ShoppingBag,
  ArrowRight,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry'
]

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, getAuthHeaders, updateProfile } = useAuth()

  // Profile and Address Form state
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: 'Maharashtra',
    postal_code: '',
    country: 'India',
  })

  const [savingProfile, setSavingProfile] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // API Token verification state
  const [apiResponse, setApiResponse] = useState<any>(null)
  const [apiLoading, setApiLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Sync profile data when loaded
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || 'Maharashtra',
        postal_code: profile.postal_code || '',
        country: profile.country || 'India',
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setSaveSuccess(false)
    setSaveError(null)
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      const { error } = await updateProfile({
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postal_code: formData.postal_code.trim(),
        country: formData.country.trim() || 'India',
      })

      if (error) {
        throw error
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 4000)
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile. Please try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const testSecureApi = async () => {
    setApiLoading(true)
    setApiError(null)
    setApiResponse(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/profile/me`, {
        method: 'GET',
        headers: headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      setApiResponse(data)
    } catch (err: any) {
      console.error('API call failed:', err)
      setApiError(err.message || 'Failed to fetch profile from FastAPI backend.')
    } finally {
      setApiLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 md:p-8 flex flex-col justify-between">
      <div className="max-w-6xl mx-auto w-full py-6 flex-grow">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6 mb-8">
          <div>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-tr from-indigo-500 to-purple-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                <UserIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-display font-extrabold text-2xl text-white">
                  Account & Profile Settings
                </h1>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage your personal details, default shipping address, and security.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/shop"
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Shop</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-1.5 px-4 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center space-x-3 animate-in fade-in duration-200">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">
              Profile and shipping address updated successfully!
            </span>
          </div>
        )}

        {saveError && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{saveError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Profile Summary & Quick Shortcuts */}
          <div className="space-y-6">
            {/* User Identity Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 p-1 rounded-2xl text-indigo-400 mb-4 flex items-center justify-center">
                  <span className="font-display font-black text-2xl text-indigo-300">
                    {(formData.full_name || user?.email || 'U')[0].toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-lg text-white">
                  {profile?.full_name || 'Member'}
                </h3>
                <span className="text-xs text-slate-400 mt-1 font-mono break-all">
                  {user?.email}
                </span>

                {profile?.is_admin && (
                  <span className="mt-3 text-xs font-semibold px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full flex items-center space-x-1.5 shadow-sm">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </span>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-slate-800/60 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Member Since:
                  </span>
                  <span className="text-slate-300 font-medium">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    Email Verified:
                  </span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Yes
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Quick Navigation
              </h4>

              <Link
                to="/orders"
                className="flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-850/60 border border-slate-800/60 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg group-hover:bg-indigo-500/20">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">My Orders</p>
                    <p className="text-[11px] text-slate-500">Track and view history</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                to="/cart"
                className="flex items-center justify-between p-3 bg-slate-950/50 hover:bg-slate-850/60 border border-slate-800/60 hover:border-slate-700 rounded-xl transition-all group"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg group-hover:bg-purple-500/20">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Shopping Cart</p>
                    <p className="text-[11px] text-slate-500">Review saved items</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </Link>

              {profile?.is_admin && (
                <Link
                  to="/admin"
                  className="flex items-center justify-between p-3 bg-purple-950/30 hover:bg-purple-900/30 border border-purple-500/20 hover:border-purple-500/40 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-500/20 text-purple-300 rounded-lg">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-200">Admin Control Center</p>
                      <p className="text-[11px] text-purple-400/80">Manage store catalog</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </Link>
              )}
            </div>
          </div>

          {/* Right Column: Editable Profile & Shipping Address */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Section 1: Contact Information */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <h2 className="font-bold text-sm text-white">Personal Information</h2>
                  </div>
                  <span className="text-[11px] text-slate-500">Used for orders & communications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => handleInputChange('full_name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone / Mobile Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Account Email Address
                    </label>
                    <div className="relative opacity-80">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        disabled
                        value={user?.email || ''}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Email address is managed securely by Supabase authentication.
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Default Shipping Address */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <h2 className="font-bold text-sm text-white">Default Shipping Address</h2>
                  </div>
                  <span className="text-[11px] text-slate-500">Auto-populates during checkout</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Address Line 1 (Flat, House no., Building, Street) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address_line1}
                      onChange={(e) => handleInputChange('address_line1', e.target.value)}
                      placeholder="e.g. 102, Blue Horizon Apts, MG Road"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Address Line 2 (Area, Landmark, Sector)
                    </label>
                    <input
                      type="text"
                      value={formData.address_line2}
                      onChange={(e) => handleInputChange('address_line2', e.target.value)}
                      placeholder="e.g. Near City Center Mall"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      City <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      State <span className="text-rose-400">*</span>
                    </label>
                    <select
                      required
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    >
                      {INDIAN_STATES.map((stateName) => (
                        <option key={stateName} value={stateName} className="bg-slate-900 text-white">
                          {stateName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      PIN Code / Postal Code <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="e.g. 400001"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Country
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      placeholder="India"
                      className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    {savingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Profile & Address</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Backend Verification & Health Panel */}
            <div className="bg-slate-900/30 border border-slate-800/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  FastAPI Backend Bridge Verification
                </h3>
                <button
                  onClick={testSecureApi}
                  disabled={apiLoading}
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-3 py-1.5 rounded-lg transition-all"
                >
                  {apiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Test Bridge</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 mb-3">
                Verify authenticated FastAPI communication using the Supabase JWT token.
              </p>

              {apiError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{apiError}</span>
                </div>
              )}

              {apiResponse && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs space-y-1 font-mono">
                  <div className="font-semibold flex items-center gap-1.5 text-emerald-400 font-sans">
                    <CheckCircle className="w-4 h-4" /> Endpoint Verified: /api/profile/me
                  </div>
                  <pre className="text-[11px] overflow-auto max-h-32 text-slate-300 mt-1">
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full text-center text-xs text-slate-600 py-6 border-t border-slate-900">
        NovaCart • Secure User Profile and Shipping System
      </div>
    </div>
  )
}
