import React from 'react'
import { Link } from 'wouter'
import { X, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { Product } from '@shared/schema'

// Helper function to get the correct price based on selected weight
function getPriceByWeight(product: Product, selectedWeight: string | null): number {
  if (!selectedWeight) {
    return parseFloat(product.price);
  }
  
  // Use switch statement for better readability
  switch(selectedWeight) {
    case "1mg":
      return product.price1mg ? parseFloat(product.price1mg) : parseFloat(product.price);
    case "2mg":
      return product.price2mg ? parseFloat(product.price2mg) : parseFloat(product.price);
    case "5mg":
      return product.price5mg ? parseFloat(product.price5mg) : parseFloat(product.price);
    case "10mg":
      return product.price10mg ? parseFloat(product.price10mg) : parseFloat(product.price);
    case "15mg":
      return product.price15mg ? parseFloat(product.price15mg) : parseFloat(product.price);
    case "20mg":
      return product.price20mg ? parseFloat(product.price20mg) : parseFloat(product.price);
    case "30mg":
      return product.price30mg ? parseFloat(product.price30mg) : parseFloat(product.price);
    case "100mg":
      return product.price100mg ? parseFloat(product.price100mg) : parseFloat(product.price);
    case "300mg":
      return product.price300mg ? parseFloat(product.price300mg) : parseFloat(product.price);
    case "500mg":
      return product.price500mg ? parseFloat(product.price500mg) : parseFloat(product.price);
    case "600mg":
      return product.price600mg ? parseFloat(product.price600mg) : parseFloat(product.price);
    case "750mg":
      return product.price750mg ? parseFloat(product.price750mg) : parseFloat(product.price);
    case "1500mg":
      return product.price1500mg ? parseFloat(product.price1500mg) : parseFloat(product.price);
    case "5000mg":
      return product.price5000mg ? parseFloat(product.price5000mg) : parseFloat(product.price);
    default:
      return parseFloat(product.price);
  }
}

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items, itemCount, subtotal, removeItem, updateItemQuantity } = useCart()
  
  return (
    <div className={`cart-overlay fixed top-0 right-0 w-full md:w-96 h-full bg-white shadow-xl z-50 ${isOpen ? 'open' : ''}`}>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="font-heading font-semibold text-lg">Your Cart</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {/* Empty Cart State */}
          {itemCount === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <Button onClick={onClose}>
                Start Shopping
              </Button>
            </div>
          ) : (
            /* Cart Items */
            <div>
              {items.map((item) => (
                <div key={item.id} className="flex py-4 border-b border-gray-100">
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center">
                    {item.product.imageUrl ? (
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium">{item.product.name}</h4>
                    {item.selectedWeight && (
                      <p className="text-sm font-medium text-blue-600 mt-1">
                        Vial Size: <span className="font-bold">{item.selectedWeight}</span>
                      </p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500 mr-2">Qty:</span>
                      <select 
                        value={item.quantity}
                        onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                        className="text-sm border-gray-200 rounded"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                          <option key={num} value={num}>{num}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="font-semibold">{formatPrice(getPriceByWeight(item.product, item.selectedWeight) * item.quantity)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between mb-4">
            <span className="font-medium">Subtotal</span>
            <span className="font-semibold">{formatPrice(subtotal)}</span>
          </div>
          <Link href="/checkout">
            <Button
              className="w-full py-3"
              disabled={itemCount === 0}
            >
              Proceed to Checkout
            </Button>
          </Link>
          {subtotal >= 175 ? (
            <div className="mt-3 p-2 bg-blue-50 text-blue-800 rounded text-xs font-medium text-center">
              ✓ Free shipping eligible
            </div>
          ) : (
            <div className="mt-3 p-2 bg-gray-50 text-gray-600 rounded text-xs text-center">
              Add ${(175 - subtotal).toFixed(2)} more for FREE shipping
            </div>
          )}
          <p className="text-xs text-gray-500 mt-4 text-center">Shipping calculated at checkout</p>
        </div>
      </div>
    </div>
  )
}

export default CartSidebar
