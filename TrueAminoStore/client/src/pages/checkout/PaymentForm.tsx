import React, { FormEvent, useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js has not yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Confirm payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/checkout/confirmation',
      },
      redirect: 'if_required',
    });

    // Handle errors
    if (error) {
      if (error.type === 'card_error' || error.type === 'validation_error') {
        setErrorMessage(error.message || 'An error occurred with your payment. Please try again.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
      
      toast({
        title: 'Payment Failed',
        description: error.message || 'An error occurred with your payment. Please try again.',
        variant: 'destructive',
      });
    } else {
      // Payment succeeded
      toast({
        title: 'Payment Successful',
        description: 'Your payment has been processed successfully!',
      });
      
      // Call the onSuccess callback 
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold mb-2">Payment Details</h3>
        <p className="text-gray-600">Total amount: ${amount.toFixed(2)}</p>
      </div>
      
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <PaymentElement />
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </Button>
          
          <Button 
            type="submit" 
            disabled={!stripe || isLoading}
            className="ml-2"
          >
            {isLoading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;