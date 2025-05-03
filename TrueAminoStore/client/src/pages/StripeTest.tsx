import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Layout from '../components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Make sure to call loadStripe outside of a component's render to avoid
// recreating the Stripe object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/stripe-test`,
      },
      redirect: 'if_required',
    });

    if (submitError) {
      console.error('Payment failed:', submitError);
      setError(submitError.message || 'Payment failed. Please try again.');
      setProcessing(false);
    } else {
      console.log('Payment succeeded!');
      setPaymentSuccess(true);
      setProcessing(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
        <h3 className="text-xl font-semibold text-green-700 mb-2">Payment Successful!</h3>
        <p className="text-green-600 mb-4">Your test payment has been processed successfully.</p>
        <Button onClick={() => window.location.reload()} className="bg-green-600 hover:bg-green-700">
          Test Another Payment
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-md text-red-700">
          {error}
        </div>
      )}
      
      <Button 
        type="submit" 
        disabled={!stripe || processing} 
        className="w-full"
      >
        {processing ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};

const StripeTest = () => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState('10.00');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestPaymentIntent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use our test endpoint instead of the regular one
      const response = await fetch('/api/test-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: parseFloat(amount) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create test payment');
      }

      const data = await response.json();
      console.log('Test payment intent created:', { success: data.success });
      setClientSecret(data.clientSecret);
    } catch (err: any) {
      console.error('Error creating test payment intent:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const testStripeConnection = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/test-stripe-connection');
      const data = await response.json();

      if (response.ok) {
        console.log('Stripe connection test result:', data);
        setError('✅ Stripe API connection is working!');
      } else {
        throw new Error(data.error || 'Connection test failed');
      }
    } catch (err: any) {
      console.error('Error testing Stripe connection:', err);
      setError('❌ ' + (err.message || 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Stripe Testing Tool">
      <div className="container max-w-4xl py-10 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold">Stripe Payment Testing Tool</CardTitle>
            <CardDescription>
              This utility helps diagnose Stripe payment processing issues
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {!clientSecret ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Test Connection</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    First, verify that your Stripe API connection is working properly:
                  </p>
                  <Button 
                    onClick={testStripeConnection} 
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? 'Testing...' : 'Test Stripe API Connection'}
                  </Button>
                </div>
                
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-medium mb-2">Create Test Payment Intent</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Specify an amount and create a test payment intent:
                  </p>
                  
                  <div className="flex space-x-2 mb-4">
                    <div className="relative w-full max-w-[120px]">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                    <Button 
                      onClick={createTestPaymentIntent} 
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? 'Creating...' : 'Create Test Payment Intent'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium mb-4">Complete Test Payment</h3>
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm />
                </Elements>
              </div>
            )}
            
            {error && (
              <div className={`p-4 rounded-md ${error.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {error}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t border-gray-100 pt-6">
            {clientSecret && (
              <Button 
                variant="outline" 
                onClick={() => setClientSecret(null)}
                className="w-full"
              >
                Back to Options
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default StripeTest;