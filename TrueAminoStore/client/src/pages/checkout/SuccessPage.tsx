import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { useStripe } from '@stripe/react-stripe-js';
import { useCart } from '../../hooks/useCart';

const SuccessPage = () => {
  const stripe = useStripe();
  // wouter's useLocation returns [location, navigate]
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = React.useState<'success' | 'processing' | 'error'>('processing');
  const [paymentDetails, setPaymentDetails] = React.useState<any>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Clear cart regardless of payment status
    clearCart();

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

        switch (paymentIntent.status) {
          case 'succeeded':
            setPaymentStatus('success');
            setPaymentDetails({
              id: paymentIntent.id,
              amount: paymentIntent.amount / 100, // Convert from cents
              date: new Date().toLocaleDateString(),
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
  }, [stripe, clearCart]);

  return (
    <Layout title="Order Confirmation - TrueAminos">
      <div className="container max-w-3xl py-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
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
                  <h2 className="font-medium mb-2">Order Details</h2>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span>{paymentDetails.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span>{paymentDetails.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span>${paymentDetails.amount.toFixed(2)}</span>
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

export default SuccessPage;