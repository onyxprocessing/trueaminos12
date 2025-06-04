import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useCart } from '../../hooks/useCart';
import Layout from '../../components/Layout';
import { Button } from '../../components/ui/button';

// Success page to display after a successful payment
export default function SuccessOrderPage() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order details from query params
    const searchParams = new URLSearchParams(window.location.search);
    const paymentMethod = searchParams.get('payment_method') || 'card';
    const orderIds = searchParams.get('order_ids') || '';
    const amount = searchParams.get('amount') || '0';
    const shippingMethod = searchParams.get('shipping_method') || 'standard';
    const shippingPrice = searchParams.get('shipping_price') || '0';
    const estimatedDelivery = searchParams.get('estimated_delivery') || '';
    
    // Store order details in state with enhanced shipping information
    setOrderDetails({
      paymentMethod,
      orderIds: orderIds.split(',').filter((id: string) => id),
      amount: parseFloat(amount),
      shippingMethod,
      shippingPrice: parseFloat(shippingPrice),
      estimatedDelivery
    });
    
    setLoading(false);
    
    // Redirect to home if this page was accessed directly without order data
    if (!searchParams.get('payment_method')) {
      // Only redirect if it seems like a direct access
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  // If user has items in cart, they shouldn't be on success page
  useEffect(() => {
    if (itemCount > 0) {
      navigate('/cart');
    }
  }, [itemCount, navigate]);

  // Effect to clear checkout session storage
  useEffect(() => {
    // Instead of immediate clearing, we'll delay clearing session storage
    // This ensures we can use the data for display first
    const timer = setTimeout(() => {
      // Clear checkout session storage after the page is rendered
      sessionStorage.removeItem('checkout_first_name');
      sessionStorage.removeItem('checkout_last_name');
      sessionStorage.removeItem('checkout_email');
      sessionStorage.removeItem('checkout_phone');
      sessionStorage.removeItem('checkout_address');
      sessionStorage.removeItem('checkout_city');
      sessionStorage.removeItem('checkout_state');
      sessionStorage.removeItem('checkout_zip');
    }, 10000); // Clear after 10 seconds
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout title="Order Confirmation - TrueAminos">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  // Get customer info from sessionStorage
  const firstName = sessionStorage.getItem('checkout_first_name') || '';
  const lastName = sessionStorage.getItem('checkout_last_name') || '';
  const address = sessionStorage.getItem('checkout_address') || '';
  const city = sessionStorage.getItem('checkout_city') || '';
  const state = sessionStorage.getItem('checkout_state') || '';
  const zip = sessionStorage.getItem('checkout_zip') || '';
  
  // Build full name and address
  const fullName = `${firstName} ${lastName}`.trim();
  const fullAddress = address && city ? `${address}, ${city}, ${state} ${zip}` : '';

  return (
    <Layout title="Order Confirmation - TrueAminos">
      <div className="container max-w-3xl mx-auto px-4 py-16">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
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

          {orderDetails && (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 mb-6">
              <h2 className="font-medium text-blue-800 mb-3">Order Details</h2>
              <div className="space-y-3 text-sm">
                {orderDetails.orderIds.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-medium">Order ID{orderDetails.orderIds.length > 1 ? 's' : ''}:</span>
                    <span className="font-mono">{orderDetails.orderIds.join(', ')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Payment Method:</span>
                  <span>
                    {orderDetails.paymentMethod === 'card' 
                      ? 'Credit/Debit Card' 
                      : orderDetails.paymentMethod === 'bank' 
                        ? 'Bank Transfer' 
                        : 'Cryptocurrency'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Total Amount:</span>
                  <span className="font-medium">${orderDetails.amount.toFixed(2)}</span>
                </div>
                
                {fullName && fullAddress && (
                  <>
                    <div className="border-t border-gray-200 my-2 pt-2">
                      <h3 className="font-medium mb-2">Shipping Information</h3>
                      <div className="space-y-1">
                        {orderDetails.shippingMethod && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Method:</span>
                            <span>{orderDetails.shippingMethod}</span>
                          </div>
                        )}
                        {orderDetails.shippingPrice > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Shipping Cost:</span>
                            <span>${orderDetails.shippingPrice.toFixed(2)}</span>
                          </div>
                        )}
                        {orderDetails.estimatedDelivery && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Delivery:</span>
                            <span>{orderDetails.estimatedDelivery}</span>
                          </div>
                        )}
                        {fullName && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recipient:</span>
                            <span>{fullName}</span>
                          </div>
                        )}
                        {fullAddress && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Address:</span>
                            <span className="text-right w-2/3">{fullAddress}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-md p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              </div>
              <div className="ml-3">
                <h2 className="font-medium text-blue-800 mb-2">Order Confirmation Sent</h2>
                <p className="text-sm text-blue-700 mb-2">
                  A confirmation email has been sent to {sessionStorage.getItem('checkout_email') || 'your email address'} with 
                  your order details and tracking information.
                </p>
                <p className="text-sm text-blue-700 mb-1">
                  If you don't see the email in your inbox, please check your spam or junk folder.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-100 rounded-md p-4 mb-6">
            <h2 className="font-medium text-green-800 mb-2">What Happens Next?</h2>
            <ul className="list-disc list-inside space-y-1 text-sm text-green-700">
              <li>Your order will be processed and shipped within 1-2 business days via USPS.</li>
              <li>Shipping typically takes 1-2 business days from dispatch (flat rate shipping).</li>
              <li>Use the tracking number in your email to monitor your delivery status.</li>
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
        </div>
      </div>
    </Layout>
  );
}