import { useEffect, useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useCart } from '../../hooks/useCart';

// Success page to display after a successful payment
export default function Success() {
  const [location, navigate] = useLocation();
  const { itemCount } = useCart();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get order details from location state or query params
    const searchParams = new URLSearchParams(location.search);
    const paymentMethod = searchParams.get('paymentMethod') || 
                          (location.state as any)?.paymentMethod || 'card';
    const orderIds = searchParams.get('orderIds') || 
                     (location.state as any)?.orderIds?.join(',') || '';
    const message = searchParams.get('message') || 
                   (location.state as any)?.message || 'Your payment was successful!';
    
    // Store order details in state
    setOrderDetails({
      paymentMethod,
      orderIds: orderIds.split(',').filter(id => id),
      message
    });
    
    setLoading(false);
    
    // Redirect to home if this page was accessed directly without order details
    if (!searchParams.get('paymentMethod') && !location.state) {
      // Only redirect if it seems like a direct access
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // If user has items in cart, they shouldn't be on success page
  useEffect(() => {
    if (itemCount > 0) {
      navigate('/cart');
    }
  }, [itemCount, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-green-100 p-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-green-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M5 13l4 4L19 7" 
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Thank You for Your Order!</h1>
        
        <p className="text-lg mb-6 text-gray-600">
          {orderDetails?.message || "Your payment has been processed successfully."}
        </p>
        
        {orderDetails?.orderIds?.length > 0 && (
          <div className="mb-6 text-left max-w-md mx-auto">
            <p className="font-medium text-gray-700 mb-2">Order Details:</p>
            <p className="text-gray-600 mb-1">
              <span className="font-medium">Payment Method:</span> {' '}
              {orderDetails.paymentMethod === 'card' 
                ? 'Credit/Debit Card' 
                : orderDetails.paymentMethod === 'bank' 
                  ? 'Bank Transfer' 
                  : 'Cryptocurrency'}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Order {orderDetails.orderIds.length > 1 ? 'IDs' : 'ID'}:</span> {' '}
              {orderDetails.orderIds.join(', ')}
            </p>
          </div>
        )}
        
        <p className="mb-8 text-gray-600">
          We've sent you a confirmation email with all the details of your purchase.
          If you have any questions, please don't hesitate to contact our customer service.
        </p>
        
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 justify-center">
          <Link 
            to="/" 
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-md transition duration-200"
          >
            Continue Shopping
          </Link>
          
          <Link 
            to="/account/orders" 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-md transition duration-200"
          >
            View Your Orders
          </Link>
        </div>
      </div>
    </div>
  );
}