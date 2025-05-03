import React, { useState, FormEvent } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { Button } from '../../components/ui/button';
import { toast } from '../../hooks/use-toast';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ amount, onSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // Create payment method and confirm payment intent
    const { error } = await stripe.confirmPayment({
      // `Elements` instance that was used to create the Payment Element
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation`,
      },
      redirect: 'if_required',
    });

    // If error, show error message
    if (error) {
      setErrorMessage(error.message || 'An unexpected error occurred');
      toast({
        title: 'Payment Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    
    // If no error, payment is successful
    toast({
      title: 'Payment Successful',
      description: 'Your payment has been processed successfully',
    });
    
    // Notify parent component of success
    onSuccess();
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 p-4 rounded mb-4">
        <p className="font-medium text-center">Total: ${amount.toFixed(2)}</p>
      </div>
      
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">
          {errorMessage}
        </div>
      )}
      
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
          disabled={isLoading || !stripe || !elements}
        >
          {isLoading ? (
            <span className="flex items-center">
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
              Processing...
            </span>
          ) : (
            'Pay Now'
          )}
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;