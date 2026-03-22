import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabaseClient'
import { calculateCartTotals, DeliverySettings } from './cart-utils'

export interface Variant {
  label: string
  price: number
}

export interface CartItem {
  id: string            // cart row id
  product_id: string
  name: string
  image: string
  category: string
  delivery_charge: number
  variant_options: Variant[]
  variant_label: string
  unit_price: number    // price of the selected variant
  quantity: number
}

interface CartStore {
  items: CartItem[]
  deliverySettings: DeliverySettings
  isLoading: boolean
  error: string | null
  isOpen: boolean

  fetchCart: () => Promise<void>
  fetchSettings: () => Promise<void>
  addItem: (product: any, variantLabel: string, qty?: number) => Promise<void>
  removeItem: (cartItemId: string) => Promise<void>
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>
  updateVariant: (cartItemId: string, variantLabel: string) => Promise<void>
  clearCart: () => void

  toggleCart: () => void
  openCart: () => void
  closeCart: () => void
  getTotalItems: () => number
  getCartSummary: () => { subtotal: number; deliveryCharge: number; total: number }
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliverySettings: { free_delivery_threshold: 499, flat_rate: 25, enabled: true, acceptingOrders: true },
      isLoading: false,
      error: null,
      isOpen: false,

      fetchSettings: async () => {
        try {
          const res = await fetch('/api/settings')
          if (res.ok) {
            const data = await res.json()
            set({ deliverySettings: data })
          }
        } catch (err) {
          console.error("Failed to fetch delivery settings:", err)
        }
      },

      fetchCart: async () => {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) { set({ items: [], isLoading: false }); return }

        await get().fetchSettings()
        set({ isLoading: true, error: null })
        try {
          const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()

          const formatted: CartItem[] = data.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            name: item.products?.name || 'Unknown',
            image: item.products?.image || '/images/placeholder.jpg',
            category: item.products?.category_id || '',
            delivery_charge: item.products?.delivery_charge ?? 0,
            variant_options: Array.isArray(item.products?.variant_options) ? item.products.variant_options : [],
            variant_label: item.variant_label || '',
            unit_price: item.unit_price ?? 0,
            quantity: item.quantity ?? 1,
          }))

          set({ items: formatted, isLoading: false })
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      addItem: async (product: any, variantLabel: string, qty = 1) => {
        set({ isLoading: true, error: null })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token

          const res = await fetch('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ product_id: product.id, variant_label: variantLabel, quantity: qty }),
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })

          if (res.status === 401) {
            const err = new Error('Please login to add items to cart')
            ;(err as any).status = 401
            throw err
          }
          if (!res.ok) {
            const d = await res.json().catch(() => ({}))
            throw new Error(d.error || 'Failed to add item')
          }
          await get().fetchCart()
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
          throw err
        }
      },

      removeItem: async (cartItemId: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          const res = await fetch(`/api/cart/${cartItemId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          })
          if (!res.ok) throw new Error('Failed to remove item')
          await get().fetchCart()
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      updateQuantity: async (cartItemId: string, quantity: number) => {
        if (quantity <= 0) { await get().removeItem(cartItemId); return }
        set({ isLoading: true, error: null })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          const res = await fetch(`/api/cart/${cartItemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity }),
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          if (!res.ok) throw new Error('Failed to update quantity')
          await get().fetchCart()
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      updateVariant: async (cartItemId: string, variantLabel: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const token = session?.access_token
          const res = await fetch(`/api/cart/${cartItemId}`, {
            method: 'PATCH',
            body: JSON.stringify({ variant_label: variantLabel }),
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          })
          if (!res.ok) throw new Error('Failed to update variant')
          await get().fetchCart()
        } catch (err: any) {
          set({ error: err.message, isLoading: false })
        }
      },

      clearCart: () => set({ items: [] }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      getTotalItems: () => get().items.reduce((n, i) => n + i.quantity, 0),
      getCartSummary: () => calculateCartTotals(get().items, get().deliverySettings),
    }),
    { name: 'minutes-delivery-cart' }
  )
)
