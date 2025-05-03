import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { useStripe, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentIntent as StripePaymentIntent } from '@stripe/stripe-js';
import { useCart } from '../../hooks/useCart';
import { hasCartBeenCleared, markCartCleared } from '../../utils/cartManager';

// Extended PaymentIntent type that includes metadata
interface PaymentIntent extends StripePaymentIntent {
  metadata?: {
    [key: string]: string;
  };
}

// Load Stripe outside of component to avoid re-creating Stripe object on each render
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Inner component that uses Stripe hooks
const SuccessPageContent = () => {
  const stripe = useStripe();
  // wouter's useLocation returns [location, navigate]
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'processing' | 'error'>('processing');
  type PaymentDetails = {
    id: string;
    paymentId: string;
    amount: number;
    date: string;
    shipping?: {
      method: string;
      name: string;
      address: string;
    };
  };
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [hasClearedCart, setHasClearedCart] = useState(hasCartBeenCleared());

  // One-time cart clearing effect with no dependencies to prevent re-runs
  useEffect(() => {
    // Skip clearing if already cleared
    if (!hasClearedCart) {
      console.log('Clearing cart from success page - one time only');
      markCartCleared(); // Mark as cleared before API call to prevent duplicates
      setHasClearedCart(true);
      
      // Clear the cart via API
      clearCart().catch(err => {
        console.error('Error clearing cart:', err);
      });
    }
  }, []);

  // Process the payment intent only once
  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Get the payment intent ID from the URL
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    if (clientSecret) {
      stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
        if (!paymentIntent) {
          setPaymentStatus('error');
          return;
        }
        
        // Cast the paymentIntent to our extended type that includes metadata
        const intent = paymentIntent as PaymentIntent;

        switch (intent.status) {
          case 'succeeded':
            setPaymentStatus('success');
            
            // Generate a formatted "TA-" order ID that matches the format used in airtable-orders.ts
            const timestamp = Math.floor(Date.now() / 1000);
            const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
            const formattedOrderId = `TA-${timestamp}-${randomChars}`;
            
            // Get shipping information if available
            const shippingMethod = intent.metadata?.shipping_method || 'Standard';
            
            // Call our server to record the order in Airtable as a backup to the webhook
            fetch('/api/record-payment-success', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paymentIntentId: intent.id
              }),
              credentials: 'include',
            })
            .then(response => {
              if (!response.ok) {
                console.error('Failed to record order on success page. This is okay if the webhook processes it.');
              } else {
                console.log('Order recorded successfully from success page');
              }
            })
            .catch(err => {
              console.error('Error recording order from success page:', err);
            });
            
            setPaymentDetails({
              id: formattedOrderId,
              paymentId: intent.id,
              amount: intent.amount / 100, // Convert from cents
              date: new Date().toLocaleDateString(),
              shipping: {
                method: shippingMethod,
                name: intent.shipping?.name || '',
                address: intent.shipping?.address ? `${intent.shipping.address.line1}, ${intent.shipping.address.city}, ${intent.shipping.address.state} ${intent.shipping.address.postal_code}` : '',
              }
            });
            break;
          case 'processing':
            setPaymentStatus('processing');
            break;
          default:
            setPaymentStatus('error');
            break;
        }
      });
    } else {
      // No client secret in URL, might be a direct navigation
      // Set success anyway if they came directly to this page
      setPaymentStatus('success');
    }
  }, [stripe]);

  return (
    <Layout title="Order Confirmation - TrueAminos">
      <div className="container max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
          {paymentStatus === 'success' && (
            <>
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-center">Thank You for Your Order!</h1>
                <p className="text-gray-600 text-center mt-2">
                  Your order has been confirmed and will be processed shortly.
                </p>
              </div>

              {paymentDetails && (
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-6">
                  <h2 className="font-medium text-blue-800 mb-3">Order Details</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Order ID:</span>
                      <span className="font-mono">{paymentDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Date:</span>
                      <span>{paymentDetails.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-medium">Total Amount:</span>
                      <span className="font-medium">${paymentDetails.amount.toFixed(2)}</span>
                    </div>
                    
                    {paymentDetails.shipping && (
                      <>
                        <div className="border-t border-gray-200 my-2 pt-2">
                          <h3 className="font-medium mb-2">Shipping Information</h3>
                          <div className="space-y-1">
                            {paymentDetails.shipping.method && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Method:</span>
                                <span>{paymentDetails.shipping.method}</span>
                              </div>
                            )}
                            {paymentDetails.shipping.name && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Recipient:</span>
                                <span>{paymentDetails.shipping.name}</span>
                              </div>
                            )}
                            {paymentDetails.shipping.address && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Address:</span>
                                <span className="text-right w-2/3">{paymentDetails.shipping.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-3 border-t border-gray-200 pt-2">
                      Payment ID: {paymentDetails.paymentId}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
                <h2 className="font-medium text-blue-800 mb-2">What Happens Next?</h2>
                <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                  <li>You will receive an email confirmation of your order.</li>
                  <li>Your order will be processed and shipped within 1-2 business days.</li>
                  <li>You'll receive tracking information once your order has been shipped.</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/')} 
                  className="w-full sm:w-auto bg-blue-900 hover:bg-blue-800"
                >
                  Continue Shopping
                </Button>
                <Button 
                  onClick={() => navigate('/contact')} 
                  variant="outline" 
                  className="w-full sm:w-auto"
                >
                  Contact Support
                </Button>
              </div>
            </>
          )}

          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <div className="animate-spin w-8 h-8 border-3 border-yellow-600 border-t-transparent rounded-full" />
              </div>
              <h1 className="text-2xl font-bold text-center">Processing Your Payment</h1>
              <p className="text-gray-600 text-center mt-2">
                Your payment is being processed. This may take a moment...
              </p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-center">Payment Issue Detected</h1>
              <p className="text-gray-600 text-center mt-2">
                We encountered an issue with your payment. Please contact our support team for assistance.
              </p>
              <Button 
                onClick={() => navigate('/contact')} 
                className="mt-6 bg-blue-900 hover:bg-blue-800"
              >
                Contact Support
              </Button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// Wrapper component to provide Stripe context
const SuccessPage = () => {
  return (
    <Elements stripe={stripePromise}>
      <SuccessPageContent />
    </Elements>
  );
};

export default SuccessPage;