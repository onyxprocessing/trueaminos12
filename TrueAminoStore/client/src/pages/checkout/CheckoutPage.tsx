import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../../hooks/useCart';
import Layout from '../../components/Layout';
import { apiRequest } from '../../lib/queryClient';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { formatPrice } from '../../lib/utils';
import { Button } from '../../components/ui/button';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const [, navigate] = useLocation();
  const { clearCart } = useCart();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    // Confirm payment with Stripe
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
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

const OrderSummary = ({ subtotal, itemCount }: { subtotal: number; itemCount: number }) => {
  const shipping = subtotal >= 175 ? 0 : 5.99;
  const total = subtotal + shipping;
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
      <h3 className="text-lg font-medium mb-4">Order Summary</h3>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping & Handling</span>
          <span className="font-medium">{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
        </div>
        {shipping > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Free shipping available on orders over $175
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
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const data = await apiRequest<{clientSecret: string}>("/api/create-payment-intent", {
          method: "POST",
          data: { amount: cart.subtotal }
        });
        
        setClientSecret(data.clientSecret);
      } catch (err: any) {
        console.error('Error creating payment intent:', err);
        setError(err.message || 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [cart, navigate]);

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

  return (
    <Layout title="Checkout - TrueAminos">
      <div className="container max-w-5xl py-10">
        <h1 className="text-2xl font-bold mb-6">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {clientSecret ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm />
              </Elements>
            ) : (
              <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                Loading payment options...
              </div>
            )}
          </div>
          
          <div>
            <OrderSummary subtotal={cart?.subtotal || 0} itemCount={cart?.itemCount || 0} />
            
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