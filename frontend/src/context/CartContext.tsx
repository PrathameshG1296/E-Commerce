import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import {
  addToCartApi,
  clearCartApi,
  fetchCart,
  removeCartItemApi,
  updateCartItemApi,
} from '../lib/cartApi'
import type { CartItem } from '../types/cart'

interface CartContextType {
  items: CartItem[]
  loading: boolean
  itemCount: number
  subtotal: number
  refreshCart: () => Promise<void>
  addToCart: (productId: string, quantity?: number) => Promise<{ error: string | null }>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<{ error: string | null }>
  removeItem: (cartItemId: string) => Promise<{ error: string | null }>
  clearCart: () => Promise<{ error: string | null }>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, getAuthHeaders } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const headers = await getAuthHeaders()
      const data = await fetchCart(headers)
      setItems(data)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [user, getAuthHeaders])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      try {
        const headers = await getAuthHeaders()
        if (!headers.Authorization) {
          return { error: 'Please log in to add items to your cart' }
        }
        await addToCartApi(productId, quantity, headers)
        await refreshCart()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to add to cart' }
      }
    },
    [getAuthHeaders, refreshCart],
  )

  const updateQuantity = useCallback(
    async (cartItemId: string, quantity: number) => {
      try {
        const headers = await getAuthHeaders()
        await updateCartItemApi(cartItemId, quantity, headers)
        await refreshCart()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to update cart' }
      }
    },
    [getAuthHeaders, refreshCart],
  )

  const removeItem = useCallback(
    async (cartItemId: string) => {
      try {
        const headers = await getAuthHeaders()
        await removeCartItemApi(cartItemId, headers)
        await refreshCart()
        return { error: null }
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Failed to remove item' }
      }
    },
    [getAuthHeaders, refreshCart],
  )

  const clearCart = useCallback(async () => {
    try {
      const headers = await getAuthHeaders()
      await clearCartApi(headers)
      await refreshCart()
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to clear cart' }
    }
  }, [getAuthHeaders, refreshCart])

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        const price = item.products?.price ?? 0
        return sum + price * item.quantity
      }, 0),
    [items],
  )

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        itemCount,
        subtotal,
        refreshCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
