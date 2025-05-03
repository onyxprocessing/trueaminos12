import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../../hooks/useCart';
import Layout from '../../components/Layout';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { formatPrice } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import { useToast } from '../../hooks/use-toast';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Define shipping options
const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard Shipping (3-5 business days)', price: 5.99 },
  { id: 'expedited', label: 'Expedited Shipping (2-3 business days)', price: 12.99 },
  { id: 'express', label: 'Express Shipping (1-2 business days)', price: 19.99 },
  { id: 'free', label: 'Free Shipping (Orders over $175)', price: 0 }
];

interface CheckoutFormProps {
  onShippingMethodChange: (method: string) => void;
  initialShippingMethod: string;
  totalAmount: number;
}

const CheckoutForm = ({ 
  onShippingMethodChange, 
  initialShippingMethod,
  totalAmount 
}: CheckoutFormProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  
  // Customer information state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState(initialShippingMethod);
  
  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Update parent component when shipping method changes
  const handleShippingChange = (method: string) => {
    setShippingMethod(method);
    onShippingMethodChange(method);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!phone) newErrors.phone = 'Phone number is required';
    if (!address) newErrors.address = 'Address is required';
    if (!city) newErrors.city = 'City is required';
    if (!state) newErrors.state = 'State is required';
    if (!zipCode) newErrors.zipCode = 'Zip code is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    
    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // Prepare customer data
    const customerData = {
      name: `${firstName} ${lastName}`,
      email,
      phone,
      address: {
        line1: address,
        city,
        state,
        postal_code: zipCode,
        country: 'US'
      },
    };

    // Confirm payment with Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: { 
            name: `${firstName} ${lastName}`,
            email,
            phone,
            address: {
              line1: address,
              city,
              state,
              postal_code: zipCode,
              country: 'US'
            },
          }
        },
        shipping: {
          name: `${firstName} ${lastName}`,
          phone,
          address: {
            line1: address,
            city,
            state,
            postal_code: zipCode,
            country: 'US'
          }
        }
      },
      redirect: "if_required"
    });

    if (error) {
      console.error('Payment failed:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    } else {
      // Payment succeeded, no redirect was needed
      // Clear the cart and redirect to success page
      await clearCart();
      navigate('/checkout/success');
    }
  };

  const getShippingRate = () => {
    const option = SHIPPING_OPTIONS.find(option => option.id === shippingMethod);
    return option ? option.price : 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      {/* Customer Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Customer Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>
      
      {/* Shipping Address */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Shipping Address</h3>
        
        <div className="mb-4">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Street Address *
          </label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={`w-full p-2 border rounded-md ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City *
            </label>
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.city ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
          </div>
          
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              State *
            </label>
            <input
              type="text"
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.state ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
          </div>
          
          <div>
            <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code *
            </label>
            <input
              type="text"
              id="zipCode"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={`w-full p-2 border rounded-md ${errors.zipCode ? 'border-red-500' : 'border-gray-300'}`}
            />
            {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
          </div>
        </div>
        
        {/* Shipping Options */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Shipping Method *</h4>
          <div className="space-y-2">
            {SHIPPING_OPTIONS.map((option) => (
              <label 
                key={option.id} 
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${
                  shippingMethod === option.id ? 'bg-blue-50 border-blue-300' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="shippingMethod"
                  value={option.id}
                  checked={shippingMethod === option.id}
                  onChange={() => handleShippingChange(option.id)}
                  className="mr-2"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500">
                    {option.price === 0 ? 'FREE' : `$${option.price.toFixed(2)}`}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      {/* Payment Information */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-medium mb-4">Payment Information</h3>
        <PaymentElement />
        
        {paymentError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {paymentError}
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full py-3 bg-blue-900 hover:bg-blue-800"
      >
        {isProcessing ? 'Processing...' : 'Complete Order'}
      </Button>
    </form>
  );
};

const OrderSummary = ({ 
  subtotal, 
  itemCount, 
  shippingMethod = 'standard'
}: { 
  subtotal: number; 
  itemCount: number;
  shippingMethod?: string;
}) => {
  // Get the selected shipping option price
  const getShippingCost = () => {
    if (subtotal >= 175) return 0; // Free shipping for orders over $175
    
    const option = SHIPPING_OPTIONS.find(opt => opt.id === shippingMethod);
    return option ? option.price : SHIPPING_OPTIONS[0].price;
  };
  
  const shipping = getShippingCost();
  const total = subtotal + shipping;
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping & Handling</span>
          <span className="font-medium">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
        </div>
        {subtotal < 175 && (
          <div className="text-xs text-gray-500 mt-1 px-1">
            Add ${(175 - subtotal).toFixed(2)} more to qualify for FREE shipping
          </div>
        )}
        {subtotal >= 175 && (
          <div className="text-xs text-green-600 font-medium mt-1 px-1">
            ✓ You qualify for FREE shipping
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex justify-between font-semibold">
          <span>Order Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const cart = useCart();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedShippingMethod, setSelectedShippingMethod] = useState(SHIPPING_OPTIONS[0].id);
  
  // Customer information state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // Calculate shipping cost based on selected method and subtotal
  const calculateShippingCost = () => {
    if (cart.subtotal >= 175) return 0; // Free shipping for orders over $175
    
    const option = SHIPPING_OPTIONS.find(opt => opt.id === selectedShippingMethod);
    return option ? option.price : SHIPPING_OPTIONS[0].price;
  };

  // Calculate the total amount including shipping
  const calculateTotal = () => {
    return cart.subtotal + calculateShippingCost();
  };

  // Create payment intent only once when the page loads or if cart changes
  useEffect(() => {
    // Check if cart is empty
    if (!cart.items || cart.items.length === 0) {
      navigate("/cart");
      return;
    }

    // Create payment intent as soon as the page loads
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        
        // Check if cart is empty before attempting to create payment intent
        if (cart.items.length === 0) {
          toast({
            title: 'Empty Cart',
            description: "Your cart is empty. Please add items before checkout.",
            variant: 'destructive',
          });
          navigate('/cart');
          return;
        }
        
        // Get initial total with shipping
        const totalAmount = calculateTotal();
        
        console.log('Creating payment intent with cart items:', cart.items.length);
        
        // Include customer information if available in the form
        const customerInfo = {
          amount: totalAmount,
          shipping_method: selectedShippingMethod,
          // Include any customer data that might be filled in already
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode
        };
        
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(customerInfo),
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [cart, navigate]); // Remove selectedShippingMethod dependency
  
  // Use a separate effect to update payment intent amount when shipping method changes
  // This won't reset the form fields
  useEffect(() => {
    // Skip first render
    if (!clientSecret) return;
    
    const updatePaymentIntent = async () => {
      try {
        const totalAmount = calculateTotal();
        
        // Include customer information in the update as well
        const updateData = {
          amount: totalAmount,
          shipping_method: selectedShippingMethod,
          // Include customer data that might have been filled in
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phone,
          address: address,
          city: city,
          state: state,
          zipCode: zipCode
        };
        
        // Update the payment intent with new amount and customer data
        await fetch('/api/update-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
          credentials: 'include',
        });
        
        // No need to update client secret as we're just changing the amount
        console.log('Updated payment intent with new shipping: ', selectedShippingMethod);
      } catch (err: any) {
        console.error('Error updating payment intent:', err);
        // Don't show error for updates - fallback to original amount if update fails
      }
    };

    updatePaymentIntent();
  }, [selectedShippingMethod, clientSecret]);

  if (isLoading) {
    return (
      <Layout title="Checkout - Processing">
        <div className="container max-w-5xl py-10">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="ml-3 text-gray-600">Preparing your checkout...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Checkout - Error">
        <div className="container max-w-5xl py-10">
          <h1 className="text-2xl font-bold mb-6">Checkout</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
            <h2 className="text-lg font-medium mb-2">There was a problem processing your checkout</h2>
            <p>{error}</p>
            <div className="mt-4">
              <Button onClick={() => navigate('/cart')} className="bg-blue-900 hover:bg-blue-800">
                Return to Cart
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Function to handle shipping method change from the checkout form
  const handleShippingMethodChange = (method: string) => {
    setSelectedShippingMethod(method);
  };

  return (
    <Layout title="Checkout - TrueAminos">
      <div className="container max-w-6xl py-10 px-4 md:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                {/* @ts-ignore - TS has trouble with wrapped children props */}
                <CheckoutForm 
                  onShippingMethodChange={handleShippingMethodChange} 
                  initialShippingMethod={selectedShippingMethod}
                  totalAmount={calculateTotal()}
                />
              </Elements>
            ) : (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                Loading payment options...
              </div>
            )}
          </div>
          
          <div>
            <OrderSummary 
              subtotal={cart?.subtotal || 0} 
              itemCount={cart?.itemCount || 0} 
              shippingMethod={selectedShippingMethod}
            />
            
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h4 className="font-medium text-blue-800 mb-2">Secure Checkout</h4>
                <p className="text-sm text-blue-700">
                  All transactions are secure and encrypted. Your payment information is never stored on our servers.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium mb-2">Need Help?</h4>
                <p className="text-sm text-gray-600 mb-2">
                  If you have questions about your order or our products:
                </p>
                <a href="/contact" className="text-sm text-blue-600 hover:underline">
                  Contact Customer Support →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;