import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/lib/api-client';
import { Separator } from '@/components/ui/separator';
import { US_STATES } from '@/lib/constants';
import { useToast } from '@/hooks/empty-toast'; // Using silent toast implementation
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ShippingRateOption, getShippingRates, formatShippingPrice } from '@/lib/shipping-rates';
import { 
  VisaIcon, 
  MastercardIcon, 
  AmexIcon, 
  DiscoverIcon
} from '@/components/payment-icons';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

// Define shipping options
const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Shipping', price: 15.00, days: '1-2 business days' },
];

// Steps in the checkout process
const CHECKOUT_STEPS = [
  { id: 'personal_info', label: 'Personal Info' },
  { id: 'shipping_info', label: 'Shipping Info' },
  { id: 'payment_method', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
];

const MultiStepCheckout: React.FC = () => {
  const [, navigate] = useLocation();
  const cart = useCart();
  const { toast } = useToast(); // Using silent toast implementation
  
  // State for checkout steps
  const [currentStep, setCurrentStep] = useState('personal_info');
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for personal info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // State for shipping info
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState(SHIPPING_OPTIONS[0].id);
  
  // State for address validation
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValidation, setAddressValidation] = useState<any>(null);
  const [useValidatedAddress, setUseValidatedAddress] = useState(false);
  
  // State for shipping rates
  const [shippingRates, setShippingRates] = useState<ShippingRateOption[]>([]);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [dynamicShippingOptions, setDynamicShippingOptions] = useState(SHIPPING_OPTIONS);
  
  // State for payment
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // Initialize checkout process
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    
    initializeCheckout();
  }, [cart.items.length]);
  
  // Initialize the checkout and get a checkout ID
  const initializeCheckout = async () => {
    try {
      setIsLoading(true);
      
      console.log('Initializing checkout and creating Airtable entry...');
      const response = await apiRequest('POST', '/api/checkout/initialize', {});
      if (response.ok) {
        const data = await response.json();
        console.log('Checkout initialized with ID:', data.checkoutId);
        setCheckoutId(data.checkoutId);
        setCurrentStep('personal_info');
        toast({
          title: 'Checkout Started',
          description: 'Please fill in your personal information to continue.',
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Could not initialize checkout');
        toast({
          title: 'Checkout Error',
          description: errorData.message || 'Could not initialize checkout',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
      toast({
        title: 'Network Error',
        description: err.message || 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 1: Handle personal info submission
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName || !lastName) {
      toast({
        title: 'Missing Information',
        description: 'First name and last name are required',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/checkout/personal-info', {
        firstName,
        lastName,
        email,
        phone,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Save to sessionStorage for later use on the success page
        sessionStorage.setItem('checkout_first_name', firstName);
        sessionStorage.setItem('checkout_last_name', lastName);
        sessionStorage.setItem('checkout_email', email || '');
        sessionStorage.setItem('checkout_phone', phone || '');
        
        setCurrentStep(data.nextStep);
        toast({
          title: 'Personal Information Saved',
          description: 'Please enter your shipping information',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Could not save personal information',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message || 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 2: Handle shipping info submission
  const handleShippingInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!address || !city || !state || !zipCode || !shippingMethod) {
      toast({
        title: 'Missing Information',
        description: 'All shipping fields are required',
        variant: 'destructive',
      });
      return;
    }
    
    // Auto-validate address without displaying any validation UI
    setUseValidatedAddress(true);
    
    try {
      setIsLoading(true);
      
      // Find the selected shipping option
      const selectedShippingOption = dynamicShippingOptions.find(opt => opt.id === shippingMethod);
      
      // Include validation status and shipping rate information in the request
      const response = await apiRequest('POST', '/api/checkout/shipping-info', {
        address,
        city,
        state,
        zipCode,
        shippingMethod,
        shippingDetails: {
          method: selectedShippingOption?.name || 'Standard Shipping',
          price: selectedShippingOption?.price || 0,
          estimatedDelivery: selectedShippingOption?.days || '5-7 business days',
          addressValidated: useValidatedAddress,
          addressClassification: addressValidation?.validation?.classification || 'unknown'
        },
        isAddressValidated: useValidatedAddress,
        addressValidationDetails: addressValidation ? {
          classification: addressValidation.validation?.classification || 'unknown',
          suggestedAddress: addressValidation.validation?.suggestedAddress || null
        } : null
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentStep(data.nextStep);
        setPaymentAmount(data.cartTotal);
        toast({
          title: 'Shipping Information Saved',
          description: 'Please select your payment method',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Could not save shipping information',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message || 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step 3: Handle payment method selection
  const handlePaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      console.log(`Selected payment method: ${paymentMethod}`);
      
      const response = await apiRequest('POST', '/api/checkout/payment-method', {
        paymentMethod,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // For card payments, get client secret for Stripe
        console.log('Card payment selected, preparing Stripe elements');
        setClientSecret(data.clientSecret);
        setCurrentStep('card_payment');
        setPaymentAmount(data.amount);
        
        toast({
          title: 'Credit Card Payment',
          description: 'Please enter your card details to complete your payment',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Could not process payment method',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message || 'Could not connect to server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Validate address with FedEx
  const validateAddressWithFedEx = async () => {
    if (!address || !city || !state || !zipCode) {
      toast({
        title: 'Missing Information',
        description: 'All address fields are required for validation',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsValidatingAddress(true);
      
      const response = await apiRequest('POST', '/api/validate-address', {
        address,
        city,
        state,
        zipCode,
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddressValidation(data);
        
        // Automatically use suggested address if valid
        if (data.valid) {
          setUseValidatedAddress(true);
          
          if (data.validation && data.validation.suggestedAddress) {
            // Use suggested address components if available
            const suggested = data.validation.suggestedAddress;
            
            if (suggested.street && suggested.street !== address) {
              setAddress(suggested.street);
            }
            
            if (suggested.city && suggested.city !== city) {
              setCity(suggested.city);
            }
            
            if (suggested.state && suggested.state !== state) {
              setState(suggested.state);
            }
            
            if (suggested.zipCode && suggested.zipCode !== zipCode) {
              setZipCode(suggested.zipCode);
            }
            
            toast({
              title: 'Address Validated',
              description: 'We\'ve updated your address with the standardized format',
            });
          } else {
            toast({
              title: 'Address Validated',
              description: 'Your address has been validated successfully',
            });
          }
        } else {
          setUseValidatedAddress(false);
          toast({
            title: 'Address Validation Issue',
            description: data.message || 'There may be an issue with your address',
            variant: 'destructive',
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: 'Validation Error',
          description: errorData.message || 'Could not validate address',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Network Error',
        description: err.message || 'Could not connect to validation service',
        variant: 'destructive',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };
  
  // Load shipping rates based on entered address
  const loadShippingRates = async () => {
    if (!address || !city || !state || !zipCode) {
      return;
    }
    
    try {
      setIsLoadingRates(true);
      
      const rates = await getShippingRates({
        address,
        city,
        state,
        zipCode,
        items: cart.items.map(item => ({
          weight: 0.5, // Assume 0.5 lbs per item for simplicity
          dimensions: { length: 8, width: 6, height: 2 }, // Inches
          quantity: item.quantity
        }))
      });
      
      setShippingRates(rates);
      
      // Update shipping options with real rates if available
      if (rates.length > 0) {
        const updatedOptions = rates.map(rate => ({
          id: rate.service_code,
          name: rate.service_name,
          price: rate.rate,
          days: rate.delivery_days ? `${rate.delivery_days} days` : 'Unknown delivery time'
        }));
        
        setDynamicShippingOptions(updatedOptions);
        setShippingMethod(updatedOptions[0].id);
      }
      
      console.log(`Loaded ${rates.length} shipping rates`);
    } catch (err: any) {
      console.error('Failed to load shipping rates:', err);
      // Fall back to default rates, don't show error
    } finally {
      setIsLoadingRates(false);
    }
  };
  
  // Load shipping rates when address is complete
  useEffect(() => {
    if (address && city && state && zipCode) {
      loadShippingRates();
    }
  }, [address, city, state, zipCode]);
  
  // Initialize Stripe
  const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  
  // Stripe Card Element component
  const CheckoutForm = ({ clientSecret, amount }: { clientSecret: string, amount: number }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);
    const [cardholderName, setCardholderName] = useState('');
    const { toast } = useToast();

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();

      if (!stripe || !elements) {
        // Stripe.js has not loaded yet
        return;
      }

      if (!cardholderName) {
        setError('Please enter the cardholder name');
        return;
      }

      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        setError('Card element not found');
        return;
      }

      setProcessing(true);
      
      try {
        const { error: submitError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: cardholderName,
            },
          }
        });

        if (submitError) {
          setError(submitError.message || 'An error occurred with your payment');
          toast({
            title: 'Payment Failed',
            description: submitError.message || 'An error occurred with your payment',
            variant: 'destructive',
          });
        } else if (paymentIntent.status === 'succeeded') {
          // Clear the cart
          cart.clearCart();
          
          // Store checkout information in sessionStorage for the success page
          sessionStorage.setItem('checkout_first_name', firstName);
          sessionStorage.setItem('checkout_last_name', lastName);
          sessionStorage.setItem('checkout_email', email || '');
          sessionStorage.setItem('checkout_phone', phone || '');
          sessionStorage.setItem('checkout_address', address);
          sessionStorage.setItem('checkout_city', city);
          sessionStorage.setItem('checkout_state', state);
          sessionStorage.setItem('checkout_zip', zipCode);
          
          toast({
            title: 'Payment Successful',
            description: 'Your order has been placed',
          });
          
          // Redirect to confirmation page
          const orderParams = new URLSearchParams({
            amount: amount.toString(),
            payment_method: 'card',
            order_id: paymentIntent.id || '',
          });
          
          window.location.href = `/checkout/confirmation?${orderParams.toString()}`;
        }
      } catch (error: any) {
        setError(error.message || 'An unexpected error occurred');
        toast({
          title: 'Payment Error',
          description: error.message || 'An unexpected error occurred',
          variant: 'destructive',
        });
      } finally {
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold">Card Payment</h2>
        
        <div className="flex items-center space-x-2 border p-3 rounded mb-4">
          <div className="flex-grow">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">Credit/Debit Card</span>
                <p className="text-sm text-gray-500">Pay securely with your card</p>
              </div>
              <div className="flex space-x-2 ml-2">
                <VisaIcon />
                <MastercardIcon />
                <AmexIcon />
                <DiscoverIcon />
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardholderName">Cardholder Name</Label>
            <Input
              id="cardholderName"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Name as it appears on the card"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="card">Card Details</Label>
            <div className="border p-3 rounded focus-within:ring-2 focus-within:ring-blue-500">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
                onChange={(e) => {
                  setCardComplete(e.complete);
                  setError(e.error ? e.error.message : null);
                }}
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
          
          <div className="pt-4">
            <p className="text-base font-medium">Total Amount: ${amount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => setCurrentStep('payment_method')}
          >
            Back
          </Button>
          <Button 
            type="submit" 
            disabled={processing || !cardComplete || !stripe || !elements}
          >
            {processing ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </form>
    );
  };
  
  // Card payment form with Stripe Elements wrapper
  const CardPaymentForm = () => {
    const [paymentIntentLoading, setPaymentIntentLoading] = useState(true);
    
    if (!clientSecret) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full inline-block"></div>
          <p className="mt-4 text-gray-600">Preparing payment form...</p>
        </div>
      );
    }
    
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm clientSecret={clientSecret} amount={paymentAmount} />
      </Elements>
    );
  };
  
  // Wrapper function to render card payment
  const renderCardPaymentForm = () => <CardPaymentForm />;
  
  // Bank transfer option - disabled (we only support card payments now)
  const renderBankTransferForm = () => (
    <div className="p-6 bg-yellow-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-yellow-800">Bank Transfer Not Available</h2>
      <p className="text-yellow-700 mb-4">
        We currently only support credit and debit card payments.
      </p>
      <Button 
        type="button" 
        variant="outline"
        onClick={() => setCurrentStep('payment_method')}
        className="mt-2"
      >
        Return to Payment Options
      </Button>
    </div>
  );
  
  // Cryptocurrency option - disabled (we only support card payments now)
  const renderCryptoPaymentForm = () => (
    <div className="p-6 bg-yellow-50 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-yellow-800">Cryptocurrency Not Available</h2>
      <p className="text-yellow-700 mb-4">
        We currently only support credit and debit card payments.
      </p>
      <Button 
        type="button" 
        variant="outline"
        onClick={() => setCurrentStep('payment_method')}
        className="mt-2"
      >
        Return to Payment Options
      </Button>
    </div>
  );
  
  // Render payment method selection (Step 3)
  const renderPaymentMethodSelection = () => (
    <form onSubmit={handlePaymentMethodSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Payment Method</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2 border p-3 rounded">
          <div className="flex-grow">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">Credit/Debit Card</span>
                <p className="text-sm text-gray-500">Pay securely with your card</p>
              </div>
              <div className="flex space-x-2 ml-2">
                <VisaIcon />
                <MastercardIcon />
                <AmexIcon />
                <DiscoverIcon />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-sm text-gray-500">
          <p>We accept Visa, Mastercard, American Express, and Discover cards. Your payment information is encrypted and secure.</p>
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setCurrentStep('shipping_info')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </div>
    </form>
  );
  
  // Form to collect personal details (Step 1)
  const renderPersonalInfoForm = () => (
    <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input 
            id="firstName" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Your first name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input 
            id="lastName" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Your last name"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input 
            id="email" 
            type="email"
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
          />
          <p className="text-xs text-gray-500">For order confirmations and tracking updates</p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            type="tel"
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Your phone number"
          />
          <p className="text-xs text-gray-500">For shipping notifications</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Continue to Shipping'}
        </Button>
      </div>
    </form>
  );
  
  // Form to collect shipping details (Step 2)
  const renderShippingInfoForm = () => (
    <form onSubmit={handleShippingInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Shipping Information</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address</Label>
          <Input 
            id="address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)}
            placeholder="123 Main St"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city" 
              value={city} 
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Select 
              value={state} 
              onValueChange={setState}
            >
              <SelectTrigger id="state">
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((stateOption) => (
                  <SelectItem key={stateOption.value} value={stateOption.value}>
                    {stateOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input 
              id="zipCode" 
              value={zipCode} 
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              placeholder="12345"
              required
              maxLength={5}
              pattern="[0-9]{5}"
              inputMode="numeric"
            />
          </div>
        </div>
        
        {/* Address validation is now automatic and silent */}
        
        <div className="space-y-2 mt-6">
          <Label htmlFor="shippingMethod">Shipping Method</Label>
          
          {isLoadingRates ? (
            <div className="p-4 text-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
              <p className="mt-2 text-sm">Loading shipping options...</p>
            </div>
          ) : (
            <RadioGroup 
              id="shippingMethod" 
              value={shippingMethod} 
              onValueChange={setShippingMethod}
              className="space-y-3"
            >
              {dynamicShippingOptions.map((option) => (
                <div key={option.id} className="flex items-center space-x-3 border p-3 rounded-md">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-grow cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-medium block">{option.name}</span>
                        <span className="text-sm text-gray-500 block">{option.days}</span>
                      </div>
                      <div className="font-medium">{formatShippingPrice(option.price)}</div>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </div>
      </div>
      
      <div className="flex justify-between mt-6">
        <Button 
          type="button" 
          variant="outline"
          onClick={() => setCurrentStep('personal_info')}
        >
          Back
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Continue to Payment'}
        </Button>
      </div>
    </form>
  );
  
  // Render step indicator at the top of checkout
  const renderStepIndicator = () => {
    const currentStepIndex = CHECKOUT_STEPS.findIndex(step => step.id === currentStep);
    const isCurrentOrCompleted = (index: number) => index <= currentStepIndex;
    
    return (
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {CHECKOUT_STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div 
                  className={`w-8 h-8 flex items-center justify-center rounded-full ${
                    isCurrentOrCompleted(index) 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCurrentOrCompleted(index) && index < currentStepIndex ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={`text-xs mt-1 ${
                  isCurrentOrCompleted(index) ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
              </div>
              
              {index < CHECKOUT_STEPS.length - 1 && (
                <div 
                  className={`h-1 flex-grow mx-1 ${
                    isCurrentOrCompleted(index + 1) ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };
  
  // Render cart summary sidebar
  const renderCartSummary = () => (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>
      
      <div className="mb-4 divide-y">
        {cart.items.length === 0 ? (
          <p className="text-gray-500">Your cart is empty</p>
        ) : (
          cart.items.map((item) => (
            <div key={`${item.id}-${item.selectedWeight}`} className="py-2 flex justify-between">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">
                  {item.selectedWeight ? `${item.selectedWeight}mg` : ''} 
                  {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                </p>
              </div>
              <div className="font-medium">
                ${(parseFloat(typeof item.price === 'string' ? item.price : '0') * item.quantity).toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>
      
      <Separator className="my-4" />
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${cart.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Shipping</span>
          <span>
            {currentStep === 'shipping_info' || currentStep === 'payment_method' || currentStep === 'card_payment' || currentStep === 'confirm_payment' ? (
              `$${(dynamicShippingOptions.find(opt => opt.id === shippingMethod)?.price || 0).toFixed(2)}`
            ) : (
              'Calculated at next step'
            )}
          </span>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>
            {currentStep === 'shipping_info' || currentStep === 'payment_method' || currentStep === 'card_payment' || currentStep === 'confirm_payment' ? (
              `$${(cart.subtotal + (dynamicShippingOptions.find(opt => opt.id === shippingMethod)?.price || 0)).toFixed(2)}`
            ) : (
              `$${cart.subtotal.toFixed(2)}`
            )}
          </span>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-500">
        <p>All orders are processed and shipped within 1-2 business days.</p>
      </div>
    </div>
  );
  
  // Render order confirmation (final step)
  const renderConfirmation = () => (
    <div className="space-y-6 text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h2 className="text-2xl font-bold">Order Confirmed!</h2>
      <p className="text-gray-600">
        Thank you for your order. We've received your payment and will process your order shortly.
      </p>
      
      {orderIds.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg inline-block">
          <p className="font-medium">Order ID{orderIds.length > 1 ? 's' : ''}:</p>
          <ul className="mt-2">
            {orderIds.map((id) => (
              <li key={id} className="font-mono">{id}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="pt-6">
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    </div>
  );
  
  // Main render
  if (isLoading && !checkoutId) {
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
    <Layout
      title="Checkout | TrueAminos Research Peptides & SARMs"
      description="Complete your purchase of research peptides and compounds at TrueAminos. Secure checkout process."
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Checkout</h1>
        
        {renderStepIndicator()}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {currentStep === 'personal_info' && renderPersonalInfoForm()}
            {currentStep === 'shipping_info' && renderShippingInfoForm()}
            {currentStep === 'payment_method' && renderPaymentMethodSelection()}
            {currentStep === 'card_payment' && renderCardPaymentForm()}
            {currentStep === 'confirm_payment' && paymentMethod === 'bank' && renderBankTransferForm()}
            {currentStep === 'confirm_payment' && paymentMethod === 'crypto' && renderCryptoPaymentForm()}
            {currentStep === 'confirmation' && renderConfirmation()}
          </div>
          
          <div className="order-first lg:order-last">
            {renderCartSummary()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MultiStepCheckout;