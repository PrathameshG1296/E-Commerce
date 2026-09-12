import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { API_BASE_URL } from '../lib/api'
import {
  Plus, Edit2, Trash2, Tag, ShoppingBag, Loader2, X, Check, Upload,
  AlertCircle, Shield, FileSpreadsheet, Percent, Calendar, Clock,
  CheckCircle2, XCircle, ArrowUpCircle,
} from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

interface Product {
  id: string
  category_id: string | null
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  image_url: string | null
  images: string[]
  stock: number
  is_featured: boolean
}

interface UploadSummary {
  inserted: number
  updated: number
  skipped: number
  errors: string[]
}

interface DiscountRecord {
  id: string
  product_id: string
  sku: string | null
  product_name: string | null
  discount_rate: number
  starts_at: string
  ends_at: string
  is_active: boolean
  original_price: number | null
  created_at: string | null
  status: string | null
}

export const Admin: React.FC = () => {
  const { getAuthHeaders } = useAuth()

  // Categories & Products state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)

  // Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'categories' | 'upload' | 'discounts'>('dashboard')

  // Bulk Upload state
  const [uploadMode, setUploadMode] = useState<'products' | 'discounts'>('products')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<UploadSummary | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [discountStartDate, setDiscountStartDate] = useState('')
  const [discountEndDate, setDiscountEndDate] = useState('')
  const [showDateModal, setShowDateModal] = useState(false)

  // Discounts tab state
  const [discountRecords, setDiscountRecords] = useState<DiscountRecord[]>([])
  const [loadingDiscounts, setLoadingDiscounts] = useState(false)
  const [deletingDiscountId, setDeletingDiscountId] = useState<string | null>(null)

  // Forms Visibility & Edit state
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showCategoryForm, setShowCategoryForm] = useState(false)

  // Product Form Fields
  const [prodName, setProdName] = useState('')
  const [prodSlug, setProdSlug] = useState('')
  const [prodDesc, setProdDesc] = useState('')
  const [prodPrice, setProdPrice] = useState('')
  const [prodComparePrice, setProdComparePrice] = useState('')
  const [prodCategory, setProdCategory] = useState('')
  const [prodStock, setProdStock] = useState('')
  const [prodImageUrl, setProdImageUrl] = useState('')
  const [prodFeatured, setProdFeatured] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Category Form Fields
  const [catName, setCatName] = useState('')
  const [catSlug, setCatSlug] = useState('')
  const [catDesc, setCatDesc] = useState('')

  // Notifications
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const catRes = await fetch(`${API_BASE_URL}/api/categories`)
      const prodRes = await fetch(`${API_BASE_URL}/api/products`)
      const dashRes = await fetch(`${API_BASE_URL}/api/analytics/dashboard`, { headers })
      
      if (!catRes.ok || !prodRes.ok) throw new Error()
      
      const catData = await catRes.json()
      const prodData = await prodRes.json()
      
      setCategories(catData)
      setProducts(prodData)

      if (dashRes.ok) {
        setDashboard(await dashRes.json())
      }
      setIsOffline(false)
    } catch (err) {
      console.warn('Backend API connection failed, loading local state.')
      setIsOffline(true)
      // Fallbacks
      setCategories([
        { id: '1', name: 'Electronics', slug: 'electronics', description: 'Tech gadgets' },
        { id: '2', name: 'Fashion & Apparel', slug: 'fashion', description: 'Clothes and shoes' }
      ])
      setProducts([
        {
          id: '1',
          category_id: '1',
          name: 'Studio-X Wireless Headphones',
          slug: 'studio-x-headphones',
          description: 'Noise cancelling',
          price: 9999.00,
          compare_at_price: 14999.00,
          image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60',
          images: [],
          stock: 45,
          is_featured: true
        }
      ])
      setDashboard({
        metrics: { total_users: 12, total_orders: 5, total_revenue: 15400, total_products: 1 },
        recent_orders: []
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Auto-generate slugs from names
  const handleNameChange = (name: string) => {
    setProdName(name)
    setProdSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  const handleCatNameChange = (name: string) => {
    setCatName(name)
    setCatSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''))
  }

  // Handle Image Upload directly to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setUploadingImage(true)
    setFormError(null)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload file to Supabase Bucket 'product-images'
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Retrieve public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

      setProdImageUrl(publicUrl)
      setFormSuccess('Image uploaded successfully!')
    } catch (err: any) {
      console.error('Image upload failed:', err)
      setFormError(err.message || 'Image upload failed. Make sure bucket "product-images" exists in Supabase Storage with public access.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Handle Product Submission (Create / Update)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const payload = {
      category_id: prodCategory || null,
      name: prodName,
      slug: prodSlug,
      description: prodDesc || null,
      price: parseFloat(prodPrice),
      compare_at_price: prodComparePrice ? parseFloat(prodComparePrice) : null,
      image_url: prodImageUrl || null,
      images: [],
      stock: parseInt(prodStock),
      is_featured: prodFeatured
    }

    if (isOffline) {
      // Mock operation
      if (editingProduct) {
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...payload } : p))
        setFormSuccess('Product updated successfully (local sandbox mode).')
      } else {
        const newProduct = { ...payload, id: Math.random().toString() }
        setProducts([newProduct, ...products])
        setFormSuccess('Product created successfully (local sandbox mode).')
      }
      resetProductForm()
      return
    }

    try {
      const headers = await getAuthHeaders()
      const url = editingProduct 
        ? `${API_BASE_URL}/api/products/${editingProduct.id}` 
        : '${API_BASE_URL}/api/products'
      
      const response = await fetch(url, {
        method: editingProduct ? 'PUT' : 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to save product.')
      }

      setFormSuccess(editingProduct ? 'Product updated successfully!' : 'Product added successfully!')
      resetProductForm()
      fetchData()
    } catch (err: any) {
      setFormError(err.message || 'Database error occurred while saving.')
    }
  }

  // Handle Category Submission
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFormSuccess(null)

    const payload = {
      name: catName,
      slug: catSlug,
      description: catDesc || null
    }

    if (isOffline) {
      const newCat = { ...payload, id: Math.random().toString() }
      setCategories([...categories, newCat])
      setFormSuccess('Category added successfully (local sandbox mode).')
      resetCategoryForm()
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('${API_BASE_URL}/api/categories', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to save category.')
      }

      setFormSuccess('Category added successfully!')
      resetCategoryForm()
      fetchData()
    } catch (err: any) {
      setFormError(err.message || 'Database error occurred while saving category.')
    }
  }

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    setFormError(null)
    setFormSuccess(null)

    if (isOffline) {
      setProducts(products.filter(p => p.id !== id))
      setFormSuccess('Product deleted successfully (local sandbox mode).')
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/products/${id}`, {
        method: 'DELETE',
        headers: headers
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || 'Failed to delete product.')
      }

      setFormSuccess('Product deleted successfully!')
      fetchData()
    } catch (err: any) {
      setFormError(err.message || 'Database error occurred.')
    }
  }

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod)
    setProdName(prod.name)
    setProdSlug(prod.slug)
    setProdDesc(prod.description || '')
    setProdPrice(prod.price.toString())
    setProdComparePrice(prod.compare_at_price?.toString() || '')
    setProdCategory(prod.category_id || '')
    setProdStock(prod.stock.toString())
    setProdImageUrl(prod.image_url || '')
    setProdFeatured(prod.is_featured)
    setShowProductForm(true)
  }

  const resetProductForm = () => {
    setShowProductForm(false)
    setEditingProduct(null)
    setProdName('')
    setProdSlug('')
    setProdDesc('')
    setProdPrice('')
    setProdComparePrice('')
    setProdCategory('')
    setProdStock('')
    setProdImageUrl('')
    setProdFeatured(false)
  }

  const resetCategoryForm = () => {
    setShowCategoryForm(false)
    setCatName('')
    setCatSlug('')
    setCatDesc('')
  }

  // ---------- Bulk Upload Handlers ----------

  const handleBulkUpload = async () => {
    if (!uploadFile) return
    setUploading(true)
    setFormError(null)
    setFormSuccess(null)
    setUploadResult(null)

    try {
      const headers = await getAuthHeaders()
      const formData = new FormData()
      formData.append('file', uploadFile)

      let url: string
      if (uploadMode === 'products') {
        url = `${API_BASE_URL}/api/admin/upload/products`
      } else {
        if (!discountStartDate || !discountEndDate) {
          setShowDateModal(true)
          setUploading(false)
          return
        }
        const startIso = new Date(discountStartDate).toISOString()
        const endIso = new Date(discountEndDate).toISOString()
        url = `${API_BASE_URL}/api/admin/upload/discounts?starts_at=${encodeURIComponent(startIso)}&ends_at=${encodeURIComponent(endIso)}`
      }

      // Don't send Content-Type for multipart — let browser set boundary
      const authToken = headers.Authorization
      const response = await fetch(url, {
        method: 'POST',
        headers: authToken ? { Authorization: authToken } : {},
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `Upload failed (${response.status})`)
      }

      const result: UploadSummary = await response.json()
      setUploadResult(result)
      setFormSuccess(
        uploadMode === 'products'
          ? `Product upload complete: ${result.inserted} inserted, ${result.updated} updated.`
          : `Discount upload complete: ${result.inserted} discounts applied.`
      )

      // Refresh product data if we uploaded products
      if (uploadMode === 'products') {
        fetchData()
      }
    } catch (err: any) {
      setFormError(err.message || 'Bulk upload failed')
    } finally {
      setUploading(false)
    }
  }

  const loadDiscounts = useCallback(async () => {
    setLoadingDiscounts(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/discounts`, { headers })
      if (!response.ok) {
        throw new Error('Failed to fetch discounts')
      }
      const data: DiscountRecord[] = await response.json()
      setDiscountRecords(data)
    } catch (err: any) {
      console.error('Failed to load discounts:', err)
      setDiscountRecords([])
    } finally {
      setLoadingDiscounts(false)
    }
  }, [getAuthHeaders])

  const handleDeleteDiscount = async (discountId: string) => {
    if (!window.confirm('Are you sure? This will deactivate the discount and revert the product price.')) return
    setDeletingDiscountId(discountId)
    setFormError(null)

    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`${API_BASE_URL}/api/admin/discounts/${discountId}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || 'Failed to delete discount')
      }

      setFormSuccess('Discount deactivated and product price reverted.')
      loadDiscounts()
    } catch (err: any) {
      setFormError(err.message || 'Failed to delete discount')
    } finally {
      setDeletingDiscountId(null)
    }
  }

  return (
    <div className="min-h-screen bg-rose-50 text-stone-900 font-sans p-6">
      
      {/* Glow backgrounds */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-pink-400/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-rose-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto py-10 relative z-10">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-rose-100 pb-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-pink-400 to-rose-500 p-2.5 rounded-xl text-stone-900 shadow-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-xl block">NovaCart Admin Panel</span>
              <span className="text-[10px] text-pink-300 font-bold uppercase tracking-wider">Catalog & Inventory Systems</span>
            </div>
          </div>
          
          <div className="flex space-x-3 text-sm overflow-x-auto">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-white border border-rose-200 text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'products' ? 'bg-white border border-rose-200 text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Products List
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'categories' ? 'bg-white border border-rose-200 text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Categories List
            </button>
            <button 
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'upload' ? 'bg-white border border-rose-200 text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Bulk Upload
            </button>
            <button 
              onClick={() => { setActiveTab('discounts'); loadDiscounts(); }}
              className={`px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === 'discounts' ? 'bg-white border border-rose-200 text-stone-900' : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              Discounts
            </button>
          </div>
        </div>

        {/* Global Notices */}
        {isOffline && (
          <div className="mb-6 p-4 border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs rounded-xl flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>Notice: API server is offline. Running operations in a sandbox local memory. Changes will reset on page reload.</span>
          </div>
        )}

        {formError && (
          <div className="mb-6 p-4 border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              <span>{formError}</span>
            </div>
            <button onClick={() => setFormError(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {formSuccess && (
          <div className="mb-6 p-4 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs rounded-xl flex items-center justify-between">
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-2" />
              <span>{formSuccess}</span>
            </div>
            <button onClick={() => setFormSuccess(null)}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Tab 0: Dashboard */}
        {activeTab === 'dashboard' && dashboard && (
          <div className="space-y-6">
            <h3 className="font-semibold text-lg text-stone-900">Store Analytics Overview</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-6 bg-white/70 border border-rose-200/80 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Revenue</p>
                <p className="text-3xl font-display font-bold text-emerald-400">
                  ₹{dashboard.metrics.total_revenue.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-white/70 border border-rose-200/80 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Orders</p>
                <p className="text-3xl font-display font-bold text-stone-900">
                  {dashboard.metrics.total_orders.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-white/70 border border-rose-200/80 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Users</p>
                <p className="text-3xl font-display font-bold text-stone-900">
                  {dashboard.metrics.total_users.toLocaleString()}
                </p>
              </div>
              <div className="p-6 bg-white/70 border border-rose-200/80 rounded-2xl backdrop-blur-sm">
                <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Total Products</p>
                <p className="text-3xl font-display font-bold text-rose-300">
                  {dashboard.metrics.total_products.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="font-semibold text-lg text-stone-900 mb-4">Recent Sales</h3>
              {dashboard.recent_orders && dashboard.recent_orders.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recent_orders.map((o: any) => (
                    <div key={o.id} className="p-4 bg-white/60 border border-rose-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-mono text-xs text-stone-500 mb-1">#{o.id.slice(0,8).toUpperCase()}</p>
                        <p className="font-semibold text-sm text-stone-900">₹{o.total_amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${o.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-100 border-rose-300 text-stone-700'}`}>
                          {o.status}
                        </span>
                        <p className="text-[10px] text-stone-400 mt-1">
                          {new Date(o.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center bg-white/50 border border-rose-200/50 rounded-2xl text-stone-400 text-sm">
                  No recent sales data.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Products */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            
            {/* Header controls */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-stone-900">Product Inventory</h3>
              <button
                onClick={() => setShowProductForm(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg shadow-rose-400/20 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>

            {/* Product form Drawer overlay */}
            {showProductForm && (
              <div className="fixed inset-0 bg-rose-50/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative shadow-2xl space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-rose-100">
                    <h3 className="font-display font-bold text-xl text-stone-900">
                      {editingProduct ? 'Edit E-Commerce Product' : 'Add New E-Commerce Product'}
                    </h3>
                    <button onClick={resetProductForm} className="text-stone-400 hover:text-stone-900">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Name */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Product Name</label>
                      <input
                        type="text"
                        required
                        value={prodName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="e.g. Mechanical Keyboard"
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    {/* Slug */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Slug URL</label>
                      <input
                        type="text"
                        required
                        value={prodSlug}
                        onChange={(e) => setProdSlug(e.target.value)}
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-500 focus:outline-none"
                      />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Category</label>
                      <select
                        value={prodCategory}
                        onChange={(e) => setProdCategory(e.target.value)}
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-700 focus:outline-none"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Stock */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Stock Count</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={prodStock}
                        onChange={(e) => setProdStock(e.target.value)}
                        placeholder="0"
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    {/* Price */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Price (INR)</label>
                      <input
                        type="number"
                        required
                        min={0}
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        placeholder="0.00"
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    {/* Compare price */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Compare-at Price (INR)</label>
                      <input
                        type="number"
                        min={0}
                        value={prodComparePrice}
                        onChange={(e) => setProdComparePrice(e.target.value)}
                        placeholder="e.g. Original MSRP price"
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    {/* Image URL / Upload */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-stone-500 block">Product Image</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={prodImageUrl}
                            onChange={(e) => setProdImageUrl(e.target.value)}
                            placeholder="Direct URL Link"
                            className="block w-full px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-stone-900 focus:outline-none"
                          />
                        </div>
                        <div className="relative">
                          <input
                            type="file"
                            id="image-file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="image-file"
                            className="w-full flex items-center justify-center px-4 py-2 bg-rose-50 border border-dashed border-rose-200 hover:border-rose-400 rounded-xl text-xs text-stone-500 hover:text-stone-900 cursor-pointer transition-all h-[42px]"
                          >
                            {uploadingImage ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Description</label>
                      <textarea
                        rows={3}
                        value={prodDesc}
                        onChange={(e) => setProdDesc(e.target.value)}
                        placeholder="Detailed information..."
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    {/* Featured */}
                    <div className="md:col-span-2 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="featured"
                        checked={prodFeatured}
                        onChange={(e) => setProdFeatured(e.target.checked)}
                        className="h-4 w-4 rounded bg-rose-50 border-rose-200 text-rose-500 focus:ring-rose-400"
                      />
                      <label htmlFor="featured" className="text-xs font-semibold text-stone-700">
                        Feature this product on homepage hero collection.
                      </label>
                    </div>

                    {/* Submit buttons */}
                    <div className="md:col-span-2 pt-4 border-t border-rose-100 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetProductForm}
                        className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-50 text-stone-700 rounded-xl text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingImage}
                        className="px-4 py-2 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg disabled:opacity-50"
                      >
                        {editingProduct ? 'Save Changes' : 'Create Product'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

            {/* Inventory table */}
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
                <span>Loading inventory...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="border border-dashed border-rose-200 rounded-2xl p-12 text-center text-stone-400">
                <ShoppingBag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p>No products in stock. Click Add Product to seed inventory.</p>
              </div>
            ) : (
              <div className="bg-white/50 border border-rose-100 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-rose-100 text-xs font-bold uppercase tracking-wider text-stone-500 bg-white/20">
                        <th className="p-4">Product Info</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Featured</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {products.map((prod) => {
                        const matchedCat = categories.find(c => c.id === prod.category_id)
                        return (
                          <tr key={prod.id} className="hover:bg-white/25 transition-colors">
                            {/* Title & Slug */}
                            <td className="p-4 flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-rose-50 flex-shrink-0">
                                {prod.image_url ? (
                                  <img src={prod.image_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-700"><ShoppingBag className="w-5 h-5" /></div>
                                )}
                              </div>
                              <div>
                                <span className="font-semibold text-stone-900 block">{prod.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono">{prod.slug}</span>
                              </div>
                            </td>
                            {/* Category */}
                            <td className="p-4 text-stone-500">
                              {matchedCat?.name || 'Unassigned'}
                            </td>
                            {/* Price */}
                            <td className="p-4 font-mono font-bold text-stone-900">
                              ₹{prod.price.toLocaleString()}
                            </td>
                            {/* Stock */}
                            <td className="p-4">
                              <span className={`font-semibold ${prod.stock <= 5 ? 'text-amber-400 font-bold' : 'text-stone-700'}`}>
                                {prod.stock}
                              </span>
                            </td>
                            {/* Featured status */}
                            <td className="p-4">
                              {prod.is_featured ? (
                                <span className="text-emerald-400 flex items-center"><Check className="w-4 h-4 mr-1" /> Yes</span>
                              ) : (
                                <span className="text-stone-500">No</span>
                              )}
                            </td>
                            {/* Actions */}
                            <td className="p-4 text-right">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => startEditProduct(prod)}
                                  className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-stone-700 hover:text-stone-900 rounded-lg transition-all"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod.id)}
                                  className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-500/10 text-stone-700 hover:text-rose-400 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Tab 2: Categories */}
        {activeTab === 'categories' && (
          <div className="space-y-6">
            
            {/* Header controls */}
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg text-stone-900">Product Categories</h3>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Category</span>
              </button>
            </div>

            {/* Category addition Form modal */}
            {showCategoryForm && (
              <div className="fixed inset-0 bg-rose-50/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full relative shadow-2xl space-y-6">
                  
                  <div className="flex justify-between items-center pb-4 border-b border-rose-100">
                    <h3 className="font-display font-bold text-xl text-stone-900">Add New Category</h3>
                    <button onClick={resetCategoryForm} className="text-stone-400 hover:text-stone-900">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Category Name</label>
                      <input
                        type="text"
                        required
                        value={catName}
                        onChange={(e) => handleCatNameChange(e.target.value)}
                        placeholder="e.g. Audio Gadgets"
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Slug</label>
                      <input
                        type="text"
                        required
                        value={catSlug}
                        onChange={(e) => setCatSlug(e.target.value)}
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-stone-500">Description</label>
                      <textarea
                        rows={3}
                        value={catDesc}
                        onChange={(e) => setCatDesc(e.target.value)}
                        placeholder="Brief summary..."
                        className="block w-full px-3 py-2 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none"
                      />
                    </div>

                    <div className="pt-4 border-t border-rose-100 flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetCategoryForm}
                        className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-50 text-stone-700 rounded-xl text-xs font-semibold transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg"
                      >
                        Create Category
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Categories Table list */}
            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
                <span>Loading categories...</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="border border-dashed border-rose-200 rounded-2xl p-12 text-center text-stone-400">
                <Tag className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p>No categories found. Add a category to classify products.</p>
              </div>
            ) : (
              <div className="bg-white/50 border border-rose-100 rounded-2xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-rose-100 text-xs font-bold uppercase tracking-wider text-stone-500 bg-white/20">
                      <th className="p-4">Category Name</th>
                      <th className="p-4">Slug</th>
                      <th className="p-4">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-sm">
                    {categories.map((cat) => (
                      <tr key={cat.id} className="hover:bg-white/25 transition-colors">
                        <td className="p-4 font-semibold text-stone-900">
                          {cat.name}
                        </td>
                        <td className="p-4 font-mono text-stone-400 text-xs">
                          {cat.slug}
                        </td>
                        <td className="p-4 text-stone-500">
                          {cat.description || 'No description provided.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* Tab 3: Bulk Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-stone-900">Bulk CSV / Excel Upload</h3>
                <p className="text-xs text-stone-500 mt-1">Upload a product listing or discount sheet to bulk-import data into your store.</p>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setUploadMode('products'); setUploadResult(null); setUploadFile(null); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  uploadMode === 'products'
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-400/20'
                    : 'bg-white border border-rose-200 text-stone-500 hover:text-stone-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" /> Product Listing
              </button>
              <button
                onClick={() => { setUploadMode('discounts'); setUploadResult(null); setUploadFile(null); }}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                  uploadMode === 'discounts'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white border border-rose-200 text-stone-500 hover:text-stone-900'
                }`}
              >
                <Percent className="w-4 h-4" /> Discount Sheet
              </button>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) {
                  setUploadFile(file);
                  setUploadResult(null);
                  if (uploadMode === 'discounts') setShowDateModal(true);
                }
              }}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragOver
                  ? 'border-rose-400 bg-rose-400/5'
                  : uploadFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-rose-200 hover:border-rose-300'
              }`}
            >
              <input
                type="file"
                id="bulk-upload-file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadFile(file);
                    setUploadResult(null);
                    if (uploadMode === 'discounts') setShowDateModal(true);
                  }
                }}
                className="hidden"
              />
              {uploadFile ? (
                <div className="space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{uploadFile.name}</p>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {(uploadFile.size / 1024).toFixed(1)} KB • Ready to upload as <span className="text-rose-300 font-bold uppercase">{uploadMode}</span>
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => { setUploadFile(null); setUploadResult(null); }}
                      className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-white text-stone-700 rounded-xl text-xs font-semibold transition-all"
                    >
                      Change File
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={uploading}
                      className="px-5 py-2 bg-gradient-to-r from-rose-400 to-purple-600 hover:from-rose-500 hover:to-purple-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg shadow-rose-400/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Upload Now'}
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="bulk-upload-file" className="cursor-pointer space-y-3 block">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-white border border-rose-200 flex items-center justify-center">
                    <Upload className="w-7 h-7 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-700">Drop your {uploadMode === 'products' ? 'Product Listing' : 'Discount'} file here</p>
                    <p className="text-[10px] text-stone-400 mt-1">Supported: .csv, .xlsx, .xls</p>
                  </div>
                </label>
              )}
            </div>

            {/* Upload Results */}
            {uploadResult && (
              <div className="p-6 bg-white/70 border border-rose-200/80 rounded-2xl space-y-4">
                <h4 className="font-semibold text-sm text-stone-900 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" /> Upload Complete
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-emerald-400">{uploadResult.inserted}</p>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-400/70 font-semibold">Inserted</p>
                  </div>
                  <div className="p-4 bg-rose-400/10 border border-rose-400/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-rose-300">{uploadResult.updated}</p>
                    <p className="text-[10px] uppercase tracking-wider text-rose-300/70 font-semibold">Updated</p>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-400">{uploadResult.skipped}</p>
                    <p className="text-[10px] uppercase tracking-wider text-amber-400/70 font-semibold">Skipped</p>
                  </div>
                </div>
                {uploadResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-rose-400">Errors ({uploadResult.errors.length}):</p>
                    <div className="max-h-40 overflow-y-auto space-y-1 p-3 bg-rose-50 rounded-xl">
                      {uploadResult.errors.map((err, i) => (
                        <p key={i} className="text-[11px] text-rose-300/80 font-mono">{err}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Discounts Management */}
        {activeTab === 'discounts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-stone-900">Discount Campaigns</h3>
                <p className="text-xs text-stone-500 mt-1">View and manage all scheduled, active, and expired discount campaigns.</p>
              </div>
              <button
                onClick={() => { setActiveTab('upload'); setUploadMode('discounts'); }}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Discounts</span>
              </button>
            </div>

            {loadingDiscounts ? (
              <div className="h-64 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="w-8 h-8 text-rose-400 animate-spin mb-4" />
                <span>Loading discount campaigns...</span>
              </div>
            ) : discountRecords.length === 0 ? (
              <div className="border border-dashed border-rose-200 rounded-2xl p-12 text-center text-stone-400">
                <Percent className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                <p>No discount campaigns found.</p>
                <p className="text-xs text-stone-500 mt-1">Upload a discount sheet from the Bulk Upload tab to get started.</p>
              </div>
            ) : (
              <div className="bg-white/50 border border-rose-100 rounded-2xl overflow-hidden backdrop-blur-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-rose-100 text-xs font-bold uppercase tracking-wider text-stone-500 bg-white/20">
                        <th className="p-4">Product</th>
                        <th className="p-4">SKU</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Period</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900 text-sm">
                      {discountRecords.map((disc) => {
                        const statusColors: Record<string, string> = {
                          active: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                          upcoming: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
                          expired: 'bg-rose-100 border-rose-300 text-stone-500',
                          deactivated: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
                        }
                        const statusIcons: Record<string, React.ReactNode> = {
                          active: <CheckCircle2 className="w-3 h-3" />,
                          upcoming: <Clock className="w-3 h-3" />,
                          expired: <XCircle className="w-3 h-3" />,
                          deactivated: <XCircle className="w-3 h-3" />,
                        }
                        return (
                          <tr key={disc.id} className="hover:bg-white/25 transition-colors">
                            <td className="p-4">
                              <span className="font-semibold text-stone-900">{disc.product_name || 'Unknown Product'}</span>
                              {disc.original_price && (
                                <p className="text-[10px] text-stone-400 mt-0.5">Original: ₹{disc.original_price.toLocaleString()}</p>
                              )}
                            </td>
                            <td className="p-4 font-mono text-xs text-stone-500">{disc.sku || '—'}</td>
                            <td className="p-4">
                              <span className="text-lg font-bold text-rose-300">{disc.discount_rate}%</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                {new Date(disc.starts_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                                <Calendar className="w-3 h-3 text-stone-500" />
                                {new Date(disc.ends_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${statusColors[disc.status || 'expired']}`}>
                                {statusIcons[disc.status || 'expired']}
                                {disc.status || 'expired'}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleDeleteDiscount(disc.id)}
                                disabled={deletingDiscountId === disc.id}
                                className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-500/10 text-stone-700 hover:text-rose-400 rounded-lg transition-all disabled:opacity-50"
                              >
                                {deletingDiscountId === disc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Range Modal for Discount Upload */}
        {showDateModal && (
          <div className="fixed inset-0 bg-rose-50/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full relative shadow-2xl space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-rose-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-stone-900">Schedule Discount Period</h3>
                    <p className="text-[10px] text-stone-500">Set when this discount should be active</p>
                  </div>
                </div>
                <button onClick={() => setShowDateModal(false)} className="text-stone-400 hover:text-stone-900">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={discountStartDate}
                    onChange={(e) => setDiscountStartDate(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-500 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={discountEndDate}
                    onChange={(e) => setDiscountEndDate(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-rose-50 border border-rose-100 rounded-xl text-sm text-stone-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-rose-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 bg-rose-50 border border-rose-100 hover:bg-rose-50 text-stone-700 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!discountStartDate || !discountEndDate) {
                      setFormError('Please select both start and end dates')
                      return
                    }
                    if (new Date(discountEndDate) <= new Date(discountStartDate)) {
                      setFormError('End date must be after start date')
                      return
                    }
                    setShowDateModal(false)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-stone-900 rounded-xl text-xs font-semibold shadow-lg"
                >
                  Confirm Schedule
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
