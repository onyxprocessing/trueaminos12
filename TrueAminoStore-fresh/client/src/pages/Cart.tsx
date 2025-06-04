import React from 'react'
import { Link } from 'wouter'
import Layout from '@/components/Layout'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Trash2, AlertCircle, ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAffiliateCode } from '@/hooks/useAffiliateCode'
import { formatPrice } from '@/lib/utils'
import FDADisclaimer from '@/components/FDADisclaimer'
import { Product } from '@shared/schema'

// Helper function to get the correct price based on selected weight
function getPriceByWeight(product: Product, selectedWeight: string | null): number {
  if (!selectedWeight) {
    return parseFloat(product.price || "0");
  }
  
  // Try to use the dynamic property access first
  const priceKey = `price${selectedWeight}` as keyof Product;
  if (product[priceKey]) {
    // If we found a matching price field, use it
    return parseFloat(product[priceKey] as string);
  }
  
  // Fall back to the switch case if dynamic property access doesn't work
  switch(selectedWeight) {
    case "1mg":
      return product.price1mg ? parseFloat(product.price1mg) : parseFloat(product.price || "0");
    case "2mg":
      return product.price2mg ? parseFloat(product.price2mg) : parseFloat(product.price || "0");
    case "5mg":
      return product.price5mg ? parseFloat(product.price5mg) : parseFloat(product.price || "0");
    case "10mg":
      return product.price10mg ? parseFloat(product.price10mg) : parseFloat(product.price || "0");
    case "15mg":
      return product.price15mg ? parseFloat(product.price15mg) : parseFloat(product.price || "0");
    case "20mg":
      return product.price20mg ? parseFloat(product.price20mg) : parseFloat(product.price || "0");
    case "30mg":
      return product.price30mg ? parseFloat(product.price30mg) : parseFloat(product.price || "0");
    case "100mg":
      return product.price100mg ? parseFloat(product.price100mg) : parseFloat(product.price || "0");
    case "300mg":
      return product.price300mg ? parseFloat(product.price300mg) : parseFloat(product.price || "0");
    case "500mg":
      return product.price500mg ? parseFloat(product.price500mg) : parseFloat(product.price || "0");
    case "600mg":
      return product.price600mg ? parseFloat(product.price600mg) : parseFloat(product.price || "0");
    case "750mg":
      return product.price750mg ? parseFloat(product.price750mg) : parseFloat(product.price || "0");
    case "1500mg":
      return product.price1500mg ? parseFloat(product.price1500mg) : parseFloat(product.price || "0");
    case "5000mg":
      return product.price5000mg ? parseFloat(product.price5000mg) : parseFloat(product.price || "0");
    default:
      return parseFloat(product.price || "0");
  }
}

const Cart: React.FC = () => {
  const { items, itemCount, subtotal, removeItem, updateItemQuantity, isLoading } = useCart()

  return (
    <Layout
      title="Shopping Cart | TrueAminos Research Peptides & SARMs"
      description="Review your cart items and checkout. Research peptides, SARMs, and supplies from TrueAminos.com."
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Your Cart</h1>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading your cart...</p>
          </div>
        ) : itemCount === 0 ? (
          <Card className="bg-white mb-8">
            <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center py-12">
              <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                Looks like you haven't added any research compounds to your cart yet.
              </p>
              <Button asChild>
                <Link href="/products">Browse Products</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <Card className="bg-white mb-8">
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="text-left p-4">Product</th>
                        <th className="text-center p-4 hidden sm:table-cell">Price</th>
                        <th className="text-center p-4">Quantity</th>
                        <th className="text-right p-4">Total</th>
                        <th className="p-4"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id} className="border-t border-gray-100">
                          <td className="p-4">
                            <div className="flex items-center">
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center mr-4 hidden sm:flex">
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
                              <div>
                                <h3 className="font-medium text-gray-800 mb-1">{item.product.name}</h3>
                                {item.selectedWeight && (
                                  <p className="text-sm font-medium text-blue-600 mb-1">
                                    Vial Size: <span className="font-bold">{item.selectedWeight}</span>
                                  </p>
                                )}
                                <p className="text-sm text-gray-500 sm:hidden">
                                  {formatPrice(getPriceByWeight(item.product, item.selectedWeight))}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center hidden sm:table-cell">
                            {formatPrice(getPriceByWeight(item.product, item.selectedWeight))}
                          </td>
                          <td className="p-4 text-center">
                            <select
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                              className="border border-gray-300 rounded p-1 w-16"
                            >
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                <option key={num} value={num}>
                                  {num}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4 text-right font-medium">
                            {formatPrice(getPriceByWeight(item.product, item.selectedWeight) * item.quantity)}
                          </td>
                          <td className="p-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1 h-auto"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
                <CardFooter className="flex justify-between p-4 border-t border-gray-100">
                  <Button variant="outline" asChild>
                    <Link href="/products">Continue Shopping</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-20">
                <CardContent className="pt-6">
                  <h2 className="font-heading text-xl font-bold mb-4">Order Summary</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal ({itemCount} items)</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    {subtotal >= 175 ? (
                      <div className="flex items-center p-2 bg-blue-50 text-blue-700 rounded-md mt-2">
                        <span className="text-xs font-medium">✓ FREE SHIPPING APPLIED</span>
                      </div>
                    ) : (
                      <div className="flex items-center p-2 bg-gray-50 text-gray-700 rounded-md mt-2">
                        <span className="text-xs">Add ${(175 - subtotal).toFixed(2)} more for FREE shipping</span>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 pt-0">
                  <Button className="w-full" size="lg" asChild>
                    <Link href="/checkout/multi-step">Proceed to Checkout</Link>
                  </Button>
                  <div className="bg-yellow-50 p-3 rounded-md mt-4 flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      All products are for research purposes only. Not for human consumption.
                    </p>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>

      <FDADisclaimer variant="box" />
    </Layout>
  )
}

export default Cart
