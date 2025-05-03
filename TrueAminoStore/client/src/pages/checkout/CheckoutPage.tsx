import React, { useEffect } from 'react';
import { useLocation } from 'wouter';

/**
 * Checkout page that redirects to multi-step checkout
 * This is a replacement for the Stripe checkout page
 */
export default function CheckoutPage() {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    console.log('Redirecting to multi-step checkout...');
    navigate('/checkout/multi-step');
  }, [navigate]);
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Redirecting to checkout...</h2>
        <p>Please wait while we redirect you to our checkout page.</p>
      </div>
    </div>
  );
}