import React, { useState } from 'react'
import { useLocation } from 'wouter'
import Layout from '@/components/Layout'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import FDADisclaimer from '@/components/FDADisclaimer'
import { useToast } from '@/hooks/use-toast'
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

const Checkout: React.FC = () => {
  const { items, itemCount, subtotal, clearCart } = useCart()
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCompleted, setOrderCompleted] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    paymentMethod: 'credit-card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvc: ''
  })
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (itemCount === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Your cart is empty. Please add items before checking out.',
        variant: 'destructive'
      })
      navigate('/products')
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Simulated order processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Clear the cart after successful order
      await clearCart()
      
      // Show success state
      setOrderCompleted(true)
      
      // Reset form
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States',
        paymentMethod: 'credit-card',
        cardNumber: '',
        cardName: '',
        cardExpiry: '',
        cardCvc: ''
      })
    } catch (error) {
      console.error('Error processing order:', error)
      toast({
        title: 'Error',
        description: 'There was a problem processing your order. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  if (orderCompleted) {
    return (
      <Layout
        title="Order Confirmation | TrueAminos Research Peptides & SARMs"
        description="Your order has been successfully placed. Thank you for choosing TrueAminos for your research needs."
      >
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Order Successful!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-600 mb-6">
                Thank you for your order. A confirmation email has been sent to your email address.
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">Order Reference:</p>
                  <p className="text-gray-700">{`TRA-${Date.now().toString().substring(6)}`}</p>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Order Total:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button onClick={() => navigate('/products')} className="w-full">
                Continue Shopping
              </Button>
              <div className="bg-yellow-50 p-3 rounded-md flex items-start">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Remember: All products purchased are for research purposes only. Not for human consumption.
                </p>
              </div>
            </CardFooter>
          </Card>
        </div>

        <FDADisclaimer variant="box" />
      </Layout>
    )
  }

  return (
    <Layout
      title="Checkout | TrueAminos Research Peptides & SARMs"
      description="Complete your purchase of research peptides and compounds at TrueAminos. Secure checkout process."
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Checkout</h1>

        {itemCount === 0 ? (
          <Card className="bg-white mb-8">
            <CardContent className="pt-6 pb-8 flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 text-center max-w-md">
                You need to add items to your cart before proceeding to checkout.
              </p>
              <Button asChild>
                <a href="/products">Browse Products</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <Card className="bg-white mb-8">
                <CardHeader>
                  <CardTitle>Shipping & Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      {/* Contact Information */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 gap-4">
                          <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Shipping Address */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Shipping Address</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                              First Name
                            </label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                              Last Name
                            </label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                              Address
                            </label>
                            <input
                              type="text"
                              id="address"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              value={formData.city}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                                State
                              </label>
                              <input
                                type="text"
                                id="state"
                                name="state"
                                value={formData.state}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                                ZIP Code
                              </label>
                              <input
                                type="text"
                                id="zipCode"
                                name="zipCode"
                                value={formData.zipCode}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                              Country
                            </label>
                            <select
                              id="country"
                              name="country"
                              value={formData.country}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Australia">Australia</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Payment Information */}
                      <div>
                        <h3 className="font-semibold text-lg mb-4">Payment Information</h3>
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
                              Card Number
                            </label>
                            <input
                              type="text"
                              id="cardNumber"
                              name="cardNumber"
                              value={formData.cardNumber}
                              onChange={handleInputChange}
                              placeholder="1234 5678 9012 3456"
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                              Name on Card
                            </label>
                            <input
                              type="text"
                              id="cardName"
                              name="cardName"
                              value={formData.cardName}
                              onChange={handleInputChange}
                              required
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                                Expiration Date
                              </label>
                              <input
                                type="text"
                                id="cardExpiry"
                                name="cardExpiry"
                                value={formData.cardExpiry}
                                onChange={handleInputChange}
                                placeholder="MM/YY"
                                required
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label htmlFor="cardCvc" className="block text-sm font-medium text-gray-700 mb-1">
                                CVC
                              </label>
                              <input
                                type="text"
                                id="cardCvc"
                                name="cardCvc"
                                value={formData.cardCvc}
                                onChange={handleInputChange}
                                placeholder="123"
                                required
                                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : 'Complete Order'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-white sticky top-20">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <div className="flex items-start">
                          <span className="bg-gray-100 text-gray-800 rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2">
                            {item.quantity}
                          </span>
                          <span className="text-gray-700">
                            {item.product.name}
                            {item.selectedWeight && (
                              <span className="text-blue-600 font-medium ml-1">
                                ({item.selectedWeight})
                              </span>
                            )}
                          </span>
                        </div>
                        <span className="font-medium">
                          {formatPrice(getPriceByWeight(item.product, item.selectedWeight) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span>{subtotal >= 175 ? 'Free' : formatPrice(10)}</span>
                    </div>
                    {subtotal >= 175 ? (
                      <div className="mt-1 p-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                        ✓ Free shipping applied
                      </div>
                    ) : (
                      <div className="mt-1 p-1 bg-gray-50 text-gray-600 rounded text-xs">
                        Add ${(175 - subtotal).toFixed(2)} more for FREE shipping
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatPrice(subtotal >= 175 ? subtotal : subtotal + 10)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="bg-yellow-50 p-3 rounded-md w-full flex items-start">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800">
                      By completing this purchase, you confirm these products are for research purposes only and not for human consumption.
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

export default Checkout
