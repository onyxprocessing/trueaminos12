import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';
import { useCart } from '../../hooks/useCart';

/**
 * Order success page for multi-step checkout
 * No longer uses Stripe, gets order info from session
 */
const SuccessPage = () => {
  // wouter's useLocation returns [location, navigate]
  const [, navigate] = useLocation();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'processing' | 'error'>('success');
  
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

  useEffect(() => {
    // Attempt to clear the cart 
    setTimeout(() => {
      try {
        clearCart();
      } catch (error) {
        console.error("Failed to clear cart:", error);
      }
    }, 500); // Small delay to let the page load first

    // Generate a formatted "TA-" order ID that matches the format used in airtable-orders.ts
    const timestamp = Math.floor(Date.now() / 1000);
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const formattedOrderId = `TA-${timestamp}-${randomChars}`;
    
    const orderId = new URLSearchParams(window.location.search).get('order_id') || formattedOrderId;
    const totalAmount = parseFloat(new URLSearchParams(window.location.search).get('amount') || '0');
    const shippingMethod = new URLSearchParams(window.location.search).get('shipping_method') || 'Standard';
    const email = sessionStorage.getItem('checkout_email') || new URLSearchParams(window.location.search).get('email') || '';
    const phone = sessionStorage.getItem('checkout_phone') || new URLSearchParams(window.location.search).get('phone') || '';
    
    // Retrieve session storage values for shipping info
    const firstName = sessionStorage.getItem('checkout_first_name') || '';
    const lastName = sessionStorage.getItem('checkout_last_name') || '';
    const address = sessionStorage.getItem('checkout_address') || '';
    const city = sessionStorage.getItem('checkout_city') || '';
    const state = sessionStorage.getItem('checkout_state') || '';
    const zip = sessionStorage.getItem('checkout_zip') || '';
    
    // Build the full name and address
    const fullName = `${firstName} ${lastName}`.trim();
    const fullAddress = address && city ? `${address}, ${city}, ${state} ${zip}` : '';
    
    // Create payment details object
    const paymentDetailsObj = {
      id: orderId,
      paymentId: `DIRECT-${timestamp}`,
      amount: totalAmount,
      date: new Date().toLocaleDateString(),
      shipping: {
        method: shippingMethod,
        name: fullName,
        address: fullAddress,
      }
    };
    
    setPaymentDetails(paymentDetailsObj);
    
    // Send all checkout data to Airtable via our new API endpoint
    const checkoutSuccessData = {
      orderId,
      timestamp,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      state,
      zip,
      shippingMethod,
      amount: totalAmount,
      status: 'success',
      paymentDetails: JSON.stringify(paymentDetailsObj),
      pageUrl: window.location.href,
      queryParams: window.location.search,
      userAgent: navigator.userAgent,
      sessionStorageData: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zip
      }
    };
    
    console.log('Sending checkout success data to Airtable:', checkoutSuccessData);
    
    // Use three different methods to ensure the data is sent to Airtable
    // Method 1: Standard Fetch API to our custom endpoint
    const sendData = async () => {
      try {
        console.log('🚀 Attempting to send checkout data to Airtable via custom endpoint...');
        
        const response = await fetch('/api/checkout/success-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(checkoutSuccessData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error sending data: ${response.status} ${response.statusText}`, errorText);
          // Try alternative method on failure
          sendWithDirectEndpoint();
          return;
        }
        
        const data = await response.json();
        console.log('✅ Success data sent to Airtable:', data);
      } catch (error) {
        console.error('❌ Exception while sending success data to Airtable:', error);
        // Try alternative method on failure
        sendWithDirectEndpoint();
      }
    };

    // Method 2: Direct to our direct Airtable endpoint
    const sendWithDirectEndpoint = async () => {
      try {
        console.log('📡 Attempting to send checkout data directly to Airtable...');
        
        const response = await fetch('/api/airtable/direct-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(checkoutSuccessData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error sending direct data: ${response.status} ${response.statusText}`, errorText);
          // Try final alternative method on failure
          sendWithBeacon();
          return;
        }
        
        const data = await response.json();
        console.log('✅ Success data sent directly to Airtable:', data);
      } catch (error) {
        console.error('❌ Exception while sending direct success data to Airtable:', error);
        // Try final alternative method on failure
        sendWithBeacon();
      }
    };
    
    // Method 3: Use navigator.sendBeacon as a final fallback
    // This is more reliable during page unload events
    const sendWithBeacon = () => {
      try {
        console.log('🏁 Attempting to send data with beacon API...');
        const blob = new Blob([JSON.stringify(checkoutSuccessData)], { type: 'application/json' });
        const success = navigator.sendBeacon('/api/airtable/direct-order', blob);
        console.log('Beacon send result:', success ? '✅ Success' : '❌ Failed');
      } catch (beaconError) {
        console.error('❌ Beacon API failed:', beaconError);
      }
    };
    
    // Execute the primary method
    sendData();
    
    // Also try the direct method immediately as a backup
    sendWithDirectEndpoint();
    
    // Clear checkout session storage after retrieving
    sessionStorage.removeItem('checkout_first_name');
    sessionStorage.removeItem('checkout_last_name');
    sessionStorage.removeItem('checkout_email');
    sessionStorage.removeItem('checkout_phone');
    sessionStorage.removeItem('checkout_address');
    sessionStorage.removeItem('checkout_city');
    sessionStorage.removeItem('checkout_state');
    sessionStorage.removeItem('checkout_zip');
    
  }, [clearCart]);

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

export default SuccessPage;