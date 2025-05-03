import React, { createContext, useContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'
import { queryClient } from '@/lib/queryClient'
import { CartItemWithProduct, CartItem } from '@shared/schema'

interface CartApiResponse {
  addedItem?: any;
  updatedItem?: any;
  cart: {
    items: CartItemWithProduct[];
    itemCount: number;
    subtotal: number;
  };
  success?: boolean;
}

interface CartContextType {
  items: CartItemWithProduct[]
  itemCount: number
  subtotal: number
  addItem: (item: { productId: number; quantity: number; selectedWeight?: string }) => Promise<void>
  updateItemQuantity: (id: number, quantity: number) => Promise<void>
  removeItem: (id: number) => Promise<void>
  clearCart: () => Promise<void>
  isLoading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItemWithProduct[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Load cart on initial render
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/cart', {
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }
      
      const data = await response.json()
      setItems(data.items || [])
      setItemCount(data.itemCount || 0)
      setSubtotal(data.subtotal || 0)
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your cart.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = async (item: { productId: number; quantity: number; selectedWeight?: string }) => {
    try {
      setIsLoading(true)
      const data = await apiRequest<{
        addedItem: CartItem;
        cart: {
          items: CartItemWithProduct[];
          itemCount: number;
          subtotal: number;
        }
      }>('/api/cart', {
        method: 'POST',
        data: item
      })
      
      setItems(data.cart.items || [])
      setItemCount(data.cart.itemCount || 0)
      setSubtotal(data.cart.subtotal || 0)
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] })
    } catch (error) {
      console.error('Error adding item to cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to add item to cart.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateItemQuantity = async (id: number, quantity: number) => {
    try {
      setIsLoading(true)
      const data = await apiRequest<{
        updatedItem: CartItem;
        cart: {
          items: CartItemWithProduct[];
          itemCount: number;
          subtotal: number;
        }
      }>(`/api/cart/${id}`, {
        method: 'PUT',
        data: { quantity }
      })
      
      setItems(data.cart.items || [])
      setItemCount(data.cart.itemCount || 0)
      setSubtotal(data.cart.subtotal || 0)
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] })
    } catch (error) {
      console.error('Error updating cart item:', error)
      toast({
        title: 'Error',
        description: 'Failed to update cart item.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeItem = async (id: number) => {
    try {
      setIsLoading(true)
      const data = await apiRequest<{
        cart: {
          items: CartItemWithProduct[];
          itemCount: number;
          subtotal: number;
        }
      }>(`/api/cart/${id}`, {
        method: 'DELETE'
      })
      
      setItems(data.cart.items || [])
      setItemCount(data.cart.itemCount || 0)
      setSubtotal(data.cart.subtotal || 0)
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] })
    } catch (error) {
      console.error('Error removing cart item:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove cart item.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setIsLoading(true)
      
      // Optimistically update UI state first
      setItems([])
      setItemCount(0)
      setSubtotal(0)
      
      // Then try to clear the cart on the server
      try {
        await apiRequest<{
          success: boolean;
        }>('/api/cart', {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Error clearing cart on server:', error);
        // Silently continue even if the API call fails
        // The UI is already cleared, which is the most important part
      }
      
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] })
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast({
        title: 'Error',
        description: 'Failed to clear cart.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateItemQuantity,
        removeItem,
        clearCart,
        isLoading
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
