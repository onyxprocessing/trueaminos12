import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Layout from '@/components/Layout';
import { Check } from 'lucide-react';
import { CardPaymentForm } from '@/components/payment/CardPaymentForm';
import { VisaIcon, MastercardIcon, AmexIcon, DiscoverIcon } from '@/components/payment-icons';
import { apiRequest } from '@/lib/queryClient';

const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
];

// Component for multi-step checkout process
const MultiStepCheckout: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const cart = useCart();
  
  // State for checkout steps
  const [currentStep, setCurrentStep] = useState('personal_info');
  const [checkoutId, setCheckoutId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for payment
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [clientSecret, setClientSecret] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  
  // State for personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // State for shipping information
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [addressSuggestion, setAddressSuggestion] = useState<any>(null);
  const [useValidatedAddress, setUseValidatedAddress] = useState(false);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [shippingMethods, setShippingMethods] = useState<any[]>([
    { id: 'standard', name: 'Standard Shipping', price: 5.99, daysMin: 3, daysMax: 7 },
    { id: 'express', name: 'Express Shipping', price: 12.99, daysMin: 1, daysMax: 3 },
  ]);
  
  // Initialize checkout on component mount
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
      return;
    }
    
    const initCheckout = async () => {
      try {
        const response = await apiRequest('POST', '/api/checkout/initialize', {});
        
        if (response.ok) {
          const data = await response.json();
          setCheckoutId(data.checkoutId);
          setCurrentStep('personal_info');
          
          // Calculate order total
          const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
          setPaymentAmount(subtotal);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Could not initialize checkout');
        }
      } catch (err: any) {
        setError(err.message || 'Network error');
      } finally {
        setIsLoading(false);
      }
    };
    
    initCheckout();
  }, [cart.items, navigate]);
  
  // Address validation with FedEx/USPS API
  const validateAddressWithFedEx = async () => {
    if (!address || !city || !state || !zipCode) return;
    
    setIsValidatingAddress(true);
    
    try {
      const response = await apiRequest('POST', '/api/validate-address', {
        address,
        city,
        state,
        zipCode
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.valid) {
          setUseValidatedAddress(true);
          toast({
            title: 'Address Validated',
            description: 'Your shipping address has been validated.',
          });
          
          if (data.suggestion && data.suggestion !== address) {
            setAddressSuggestion(data.suggestion);
          }
        } else {
          setUseValidatedAddress(false);
          toast({
            title: 'Address Validation Issue',
            description: data.message || 'Please check your shipping address.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Address validation failed:', await response.text());
      }
    } catch (err) {
      console.error('Address validation error:', err);
    } finally {
      setIsValidatingAddress(false);
    }
  };
  
  // Use suggested address from validation
  const useSuggestedAddress = () => {
    if (addressSuggestion) {
      setAddress(addressSuggestion.street);
      setCity(addressSuggestion.city);
      setState(addressSuggestion.state);
      setZipCode(addressSuggestion.zipCode);
      setAddressSuggestion(null);
      setUseValidatedAddress(true);
    }
  };
  
  // Handle personal info form submission
  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!firstName || !lastName || !email) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    // Basic email validation
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailPattern.test(email)) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
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
        setCurrentStep('shipping_info');
        toast({
          title: 'Personal Information Saved',
          description: 'Please enter your shipping details',
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
  
  // Handle shipping info form submission
  const handleShippingInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!address || !city || !state || !zipCode || !shippingMethod) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required shipping fields',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      const response = await apiRequest('POST', '/api/checkout/shipping-info', {
        address,
        city,
        state,
        zipCode,
        shippingMethod,
        addressValidated: useValidatedAddress,
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Update payment amount to include shipping
        if (data.totalWithShipping) {
          setPaymentAmount(data.totalWithShipping);
        }
        
        setCurrentStep('payment_method');
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
  
  // Handle payment method selection
  const handlePaymentMethodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      console.log(`Selected payment method: ${paymentMethod}`);
      
      const response = await apiRequest('POST', '/api/checkout/payment-method', {
        paymentMethod: 'card', // Always set to card as we only support card payments
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // For card payments, get client secret for Stripe
        console.log('Card payment selected, preparing Stripe elements');
        setClientSecret(data.clientSecret);
        setCurrentStep('card_payment');
        toast({
          title: 'Credit Card Payment',
          description: 'Please enter your card details to complete your payment',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Payment Error',
          description: errorData.message || 'Could not process payment selection',
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
  
  // Handle payment confirmation for all payment methods
  const handlePaymentConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep('confirmation');
  };
  
  // Render step indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'personal_info', name: 'Personal Info' },
      { id: 'shipping_info', name: 'Shipping' },
      { id: 'payment_method', name: 'Payment Method' },
      { id: 'card_payment', name: 'Payment Details' },
      { id: 'confirmation', name: 'Confirmation' },
    ];
    
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex flex-col items-center ${index <= currentIndex ? 'text-blue-600' : 'text-gray-400'}`}
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full mb-2 ${
                index < currentIndex ? 'bg-blue-600 text-white' : 
                index === currentIndex ? 'border-2 border-blue-600 text-blue-600' : 
                'border-2 border-gray-300 text-gray-300'
              }`}>
                {index < currentIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span className="text-xs md:text-sm font-medium">
                {step.name}
              </span>
            </div>
          ))}
        </div>
        
        <div className="relative">
          <div className="absolute top-0 h-0.5 w-full bg-gray-200"></div>
          <div 
            className="absolute top-0 h-0.5 bg-blue-600"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };
  
  // Render cart summary
  const renderCartSummary = () => {
    const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const selectedShippingMethod = shippingMethods.find(method => method.id === shippingMethod);
    const shippingCost = selectedShippingMethod ? selectedShippingMethod.price : 0;
    const total = subtotal + shippingCost;
    
    return (
      <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
        
        <div className="space-y-2 mb-4">
          {cart.items.map((item) => (
            <div key={`${item.id}-${item.selectedWeight || ''}`} className="flex justify-between">
              <div>
                <span className="font-medium">{item.name}</span>
                {item.selectedWeight && (
                  <span className="text-sm text-gray-500 ml-1">({item.selectedWeight})</span>
                )}
                <span className="text-gray-500 ml-2">x{item.quantity}</span>
              </div>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between mb-2">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-4">
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render personal information form (Step 1)
  const renderPersonalInfoForm = () => (
    <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input 
              id="firstName" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input 
              id="lastName" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Your last name"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            type="tel" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Your phone number (optional)"
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Continue to Shipping'}
        </Button>
      </div>
    </form>
  );
  
  // Render shipping information form (Step 2)
  const renderShippingInfoForm = () => (
    <form onSubmit={handleShippingInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Shipping Information</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input 
            id="address" 
            value={address} 
            onChange={(e) => {
              setAddress(e.target.value);
              setUseValidatedAddress(false);
            }}
            placeholder="Your street address"
            required
            className={useValidatedAddress ? "border-green-500 bg-green-50" : ""}
          />
          {useValidatedAddress && (
            <div className="text-xs text-green-600 flex items-center mt-1">
              <Check className="h-3 w-3 mr-1" />
              Address validated
            </div>
          )}
        </div>
        
        {addressSuggestion && (
          <div className="bg-yellow-50 p-3 rounded-lg text-sm">
            <p className="font-medium text-yellow-800">Did you mean:</p>
            <p className="text-yellow-800 mb-2">{addressSuggestion.street}, {addressSuggestion.city}, {addressSuggestion.state} {addressSuggestion.zipCode}</p>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={useSuggestedAddress}
              className="bg-white hover:bg-white"
            >
              Use this address
            </Button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input 
              id="city" 
              value={city} 
              onChange={(e) => {
                setCity(e.target.value);
                setUseValidatedAddress(false);
              }}
              placeholder="Your city"
              required
              className={useValidatedAddress ? "border-green-500 bg-green-50" : ""}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select 
              value={state} 
              onValueChange={(val) => {
                setState(val);
                setUseValidatedAddress(false);
                
                // Try to validate the address after state is selected
                setTimeout(() => {
                  if (address && city && val && zipCode && !isValidatingAddress) {
                    validateAddressWithFedEx();
                  }
                }, 100);
              }}
              required
            >
              <SelectTrigger id="state" className={useValidatedAddress ? "border-green-500 bg-green-50 pr-8" : "pr-8"}>
                <SelectValue placeholder="Select state" />
                {useValidatedAddress && (
                  <Check className="h-4 w-4 text-green-600 ml-auto" />
                )}
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((stateObj) => (
                  <SelectItem key={stateObj.value} value={stateObj.value}>
                    {stateObj.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="mt-6">
          <Label htmlFor="zipCode">ZIP Code *</Label>
          <div className="relative">
            <Input 
              id="zipCode" 
              value={zipCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                setZipCode(value);
                setUseValidatedAddress(false);
                
                // Try to validate the address after ZIP is entered
                if (value.length === 5) {
                  setTimeout(() => {
                    if (address && city && state && value && !isValidatingAddress) {
                      validateAddressWithFedEx();
                    }
                  }, 100);
                }
              }}
              placeholder="5-digit ZIP code"
              required
              className={`${useValidatedAddress ? "border-green-500 bg-green-50" : ""} ${isValidatingAddress ? "pr-10" : ""}`}
              maxLength={5}
              inputMode="numeric"
            />
            {isValidatingAddress && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
          {useValidatedAddress && (
            <div className="text-xs text-green-600 flex items-center mt-1">
              <Check className="h-3 w-3 mr-1" />
              ZIP code validated
            </div>
          )}
        </div>
        
        <div className="space-y-2 mt-6">
          <Label htmlFor="shippingMethod">Shipping Method *</Label>
          <div className="space-y-2">
            {shippingMethods.map(method => (
              <div 
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer ${
                  shippingMethod === method.id 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setShippingMethod(method.id)}
              >
                <div className="flex items-center">
                  <div className={`w-4 h-4 rounded-full border ${
                    shippingMethod === method.id 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-400'
                  }`}>
                    {shippingMethod === method.id && (
                      <div className="w-2 h-2 mx-auto mt-1 rounded-full bg-white"></div>
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{method.name}</div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-x-4">
                      <span>${method.price.toFixed(2)}</span>
                      <span>Estimated delivery: {method.daysMin}-{method.daysMax} business days</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
  
  // Wrapper function to render card payment
  const renderCardPaymentForm = () => <CardPaymentForm />;
  
  // We've removed bank transfer and cryptocurrency payment forms since we only support card payments now
  
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