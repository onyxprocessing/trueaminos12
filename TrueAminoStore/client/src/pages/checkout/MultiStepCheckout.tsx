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
  DiscoverIcon, 
  BankIcon, 
  BitcoinIcon, 
  EthereumIcon 
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
  { id: 'standard', name: 'Standard Shipping via USPS', price: 15.00, days: '1-2 business days' },
  { id: 'express', name: 'Express Shipping', price: 25.00, days: '1-2 business days' },
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
  const [transactionId, setTransactionId] = useState('');
  const [orderIds, setOrderIds] = useState<number[]>([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  
  // State for bank/crypto info
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [cryptoInfo, setCryptoInfo] = useState<any>(null);
  
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
    
    // Import validation functions
    const { validateAddress, validateZipCode, validateCity } = await import('../../lib/address-lookup');
    
    // Enhanced address validation
    if (!validateAddress(address)) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid street address including a street number',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateZipCode(zipCode)) {
      toast({
        title: 'Invalid ZIP Code',
        description: 'Please enter a valid 5-digit ZIP code',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateCity(city)) {
      toast({
        title: 'Invalid City',
        description: 'Please enter a valid city name',
        variant: 'destructive',
      });
      return;
    }
    
    // Attempt to validate the address one more time if it hasn't been validated yet
    if (!useValidatedAddress && !isValidatingAddress && address && city && state && zipCode) {
      // Automatically try to validate before proceeding
      validateAddressWithFedEx();
      // But still continue with submission - don't block the user
    }
    
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
        
        if (paymentMethod === 'card') {
          // For card payments, get client secret for Stripe
          console.log('Card payment selected, preparing Stripe elements');
          setClientSecret(data.clientSecret);
          setCurrentStep('card_payment');
          toast({
            title: 'Credit Card Payment',
            description: 'Please enter your card details to complete your payment',
          });
        } else if (paymentMethod === 'bank') {
          // For bank payments, show instructions
          console.log('Bank transfer selected, showing bank details');
          setBankInfo(data.bankInfo);
          setCurrentStep('confirm_payment');
          toast({
            title: 'Bank Transfer Selected',
            description: 'Please complete the bank transfer and confirm your payment',
          });
        } else if (paymentMethod === 'crypto') {
          // For crypto payments, show wallet addresses
          console.log('Crypto payment selected, showing wallet addresses');
          setCryptoInfo(data.cryptoInfo);
          setCurrentStep('confirm_payment');
          toast({
            title: 'Cryptocurrency Payment',
            description: 'Please send cryptocurrency to the provided wallet address',
          });
        }
        
        setPaymentAmount(data.amount);
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
  
  // Step 4a: Handle non-card payment confirmation (bank/crypto)
  const handlePaymentConfirmation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      console.log('Submitting payment confirmation...');
      
      const response = await apiRequest('POST', '/api/checkout/confirm-payment', {
        paymentMethod,
        transactionId,
      });
      
      console.log('Payment confirmation response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Payment confirmation successful, data:', data);
        
        // Clear the cart
        cart.clearCart();
        
        // Get the selected shipping option for detailed information
        const selectedShippingOption = dynamicShippingOptions.find(opt => opt.id === shippingMethod);
        
        // Store order data for success page with enhanced shipping details
        const orderParams = new URLSearchParams({
          amount: paymentAmount.toString(),
          payment_method: paymentMethod,
          order_ids: (data.orderIds || []).join(','),
          shipping_method: selectedShippingOption?.name || shippingMethod,
          shipping_price: selectedShippingOption?.price?.toString() || '0',
          estimated_delivery: selectedShippingOption?.days || ''
        });
        
        console.log('Order params for success page:', orderParams.toString());
        
        // Store checkout information in sessionStorage for the success page
        sessionStorage.setItem('checkout_first_name', firstName);
        sessionStorage.setItem('checkout_last_name', lastName);
        sessionStorage.setItem('checkout_email', email || '');
        sessionStorage.setItem('checkout_phone', phone || '');
        sessionStorage.setItem('checkout_address', address);
        sessionStorage.setItem('checkout_city', city);
        sessionStorage.setItem('checkout_state', state);
        sessionStorage.setItem('checkout_zip', zipCode);
        
        // Navigate to the success page with the order data
        console.log('Redirecting to:', `/checkout/confirmation?${orderParams.toString()}`);
        
        // Add a small delay to ensure the redirect happens correctly
        setTimeout(() => {
          console.log('Performing redirect now');
          window.location.href = `/checkout/confirmation?${orderParams.toString()}`;
        }, 100);
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.message || 'Could not confirm payment',
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
  
  // Helper function to get product price based on weight selection
  const getProductPrice = (product: any, selectedWeight: string | null): number => {
    if (!selectedWeight) {
      return parseFloat(product.price || '0');
    }
    
    // Create a dynamic key for the price field based on weight
    const priceKey = `price${selectedWeight.toLowerCase()}`;
    const price = product[priceKey] || product.price || '0';
    return typeof price === 'string' ? parseFloat(price) : price;
  };

  // Helper function to get shipping cost
  const getShippingCost = () => {
    if (cart.subtotal >= 175) return 0; // Free shipping for orders over $175
    
    // Check if we have dynamic shipping rates first
    const option = dynamicShippingOptions.find(opt => opt.id === shippingMethod);
    return option ? option.price : SHIPPING_OPTIONS[0].price;
  };
  
  // Helper function to calculate total
  const calculateTotal = () => {
    return cart.subtotal + getShippingCost();
  };
  
  // Render cart summary
  const renderCartSummary = () => (
    <div className="bg-slate-50 rounded-lg p-6">
      <h2 className="text-lg font-bold mb-4">Order Summary</h2>
      
      {cart.items.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <ul className="divide-y divide-gray-200">
            {cart.items.map((item) => (
              <li key={`${item.id}-${item.selectedWeight || 'default'}`} className="py-3">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.selectedWeight && `${item.selectedWeight} | `}
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    ${(getProductPrice(item.product, item.selectedWeight) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between mb-2">
              <p>Subtotal</p>
              <p>${cart.subtotal.toFixed(2)}</p>
            </div>
            
            <div className="flex justify-between mb-2">
              <p>Shipping</p>
              <p>${getShippingCost().toFixed(2)}</p>
            </div>
            
            <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-gray-200">
              <p>Total</p>
              <p>${calculateTotal().toFixed(2)}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
  
  // Render step indicator
  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {CHECKOUT_STEPS.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center">
            <div className={`w-8 h-8 flex items-center justify-center rounded-full border-2 
                  ${currentStep === step.id || 
                   (step.id === 'shipping_info' && currentStep === 'payment_method') ||
                   (step.id === 'payment_method' && (currentStep === 'card_payment' || currentStep === 'confirm_payment')) ||
                   (step.id === 'confirmation' && currentStep === 'confirmation')
                    ? 'border-blue-600 bg-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'}`}>
              {index + 1}
            </div>
            <span className="text-xs mt-1">{step.label}</span>
          </div>
        ))}
      </div>
      <div className="relative w-full mt-3">
        <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full"></div>
        <div 
          className="absolute top-0 left-0 h-1 bg-blue-600 transition-all duration-300"
          style={{ 
            width: 
              currentStep === 'personal_info' ? '25%' : 
              (currentStep === 'shipping_info' ? '50%' : 
              (currentStep === 'payment_method' || currentStep === 'card_payment' || currentStep === 'confirm_payment') ? '75%' : 
              '100%') 
          }}
        ></div>
      </div>
    </div>
  );
  
  // Render personal info form (Step 1)
  const renderPersonalInfoForm = () => (
    <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name *</Label>
          <Input 
            id="firstName" 
            value={firstName} 
            onChange={(e) => setFirstName(e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name *</Label>
          <Input 
            id="lastName" 
            value={lastName} 
            onChange={(e) => setLastName(e.target.value)} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input 
            id="phone" 
            type="tel" 
            value={phone} 
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 10);
              if (value.length <= 3) {
                setPhone(value);
              } else if (value.length <= 6) {
                setPhone(`(${value.slice(0, 3)}) ${value.slice(3)}`);
              } else {
                setPhone(`(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`);
              }
            }}
            placeholder="(555) 555-5555"
          />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Continue to Shipping'}
        </Button>
      </div>
    </form>
  );
  
  // Helpers for address validation and ZIP lookup
  const handleZipCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newZip = e.target.value;
    setZipCode(newZip);
    
    // Reset validation states when ZIP changes
    setAddressValidation(null);
    setUseValidatedAddress(false);
    
    // Import is inside the function to avoid issues with server-side rendering
    import('../../lib/address-lookup').then(({ lookupZipCode, validateZipCode }) => {
      // Only lookup if the ZIP is valid
      if (validateZipCode(newZip)) {
        const zipResult = lookupZipCode(newZip);
        if (zipResult) {
          // Auto-fill city and state
          setCity(zipResult.city);
          setState(zipResult.state);
        }
      }
    });
  };
  
  // Function to validate address with FedEx API
  const validateAddressWithFedEx = async () => {
    if (!address || !city || !state || !zipCode) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out all address fields before validating',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsValidatingAddress(true);
      setAddressValidation(null);
      setUseValidatedAddress(false); // Reset validation state before checking
      
      // Import address validation function
      const { validateAddressWithFedEx } = await import('../../lib/address-lookup');
      
      // Call the validation function
      const validationResult = await validateAddressWithFedEx(address, city, state, zipCode);
      
      console.log('Address validation result:', JSON.stringify(validationResult, null, 2));
      
      if (validationResult && validationResult.success) {
        setAddressValidation(validationResult);
        
        // If there's a suggested address different from current address, we'll show it to the user
        if (validationResult.validation?.suggestedAddress &&
            (validationResult.validation.suggestedAddress.streetLines.join(', ').toLowerCase() !== address.toLowerCase() ||
             validationResult.validation.suggestedAddress.city.toLowerCase() !== city.toLowerCase() ||
             validationResult.validation.suggestedAddress.state.toLowerCase() !== state.toLowerCase() ||
             validationResult.validation.suggestedAddress.zipCode !== zipCode)) {
          
          // Address is different, prompt user to use the suggested one
          setUseValidatedAddress(false);
          
          toast({
            title: 'Address Suggestions Available',
            description: 'We found a suggested address format. Please review it below.',
          });
        } else if (validationResult.validation?.isValid) {
          // Current address is valid, mark it as validated
          setUseValidatedAddress(true);
          
          toast({
            title: 'Address Validated',
            description: 'Your address has been validated successfully.',
          });
          
          // After successfully validating an address, fetch shipping rates
          fetchShippingRates();
        }
      } else {
        toast({
          title: 'Address Validation Failed',
          description: validationResult?.message || 'Could not validate address. Please check your information.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      console.error('Address validation error:', err);
      toast({
        title: 'Validation Error',
        description: err.message || 'Could not validate address',
        variant: 'destructive',
      });
    } finally {
      setIsValidatingAddress(false);
    }
  };
  
  // Function to apply the validated/suggested address
  const applyValidatedAddress = () => {
    if (addressValidation?.validation?.suggestedAddress) {
      const suggested = addressValidation.validation.suggestedAddress;
      setAddress(suggested.streetLines.join(', '));
      setCity(suggested.city);
      setState(suggested.state);
      setZipCode(suggested.zipCode);
      setUseValidatedAddress(true);
      
      toast({
        title: 'Address Updated',
        description: 'The suggested address has been applied.',
      });
      
      // After applying the validated address, fetch shipping rates
      fetchShippingRates();
    }
  };
  
  // Function to fetch flat rate shipping based on cart quantity
  const fetchShippingRates = async () => {
    if (!address || !city || !state || !zipCode) {
      return;
    }
    
    try {
      setIsLoadingRates(true);
      
      // Import the getShippingRates function (which now returns flat rates)
      const { getShippingRates } = await import('../../lib/shipping-rates');
      
      // Log the request
      console.log(`Calculating flat rate shipping based on cart for: ${address}, ${city}, ${state} ${zipCode}`);
      
      // Get flat rate shipping based on cart items
      const ratesResult = await getShippingRates(address, city, state, zipCode);
      
      // Log the result
      console.log('Flat rate shipping response:', ratesResult);
      
      if (ratesResult.success && ratesResult.rates && ratesResult.rates.length > 0) {
        const flatRateOption = ratesResult.rates[0];
        
        // Create simplified shipping option with flat rate
        const newShippingOptions = [{
          id: flatRateOption.serviceType.toLowerCase().replace(/_/g, '-'),
          name: flatRateOption.serviceName,
          price: flatRateOption.price,
          days: flatRateOption.transitTime,
          isFlatRate: flatRateOption.isFlatRate || true
        }];
        
        // Update shipping options with flat rate
        setDynamicShippingOptions(newShippingOptions);
        
        // Automatically set the shipping method (no selection needed)
        const shippingMethodId = flatRateOption.serviceType.toLowerCase().replace(/_/g, '-');
        console.log(`Setting flat rate shipping ($${flatRateOption.price.toFixed(2)}) to method: ${shippingMethodId}`);
        setShippingMethod(shippingMethodId);
        
        console.log('Flat rate shipping applied:', JSON.stringify(newShippingOptions, null, 2));
        
        toast({
          title: 'Shipping Calculated',
          description: `${flatRateOption.serviceName} - $${flatRateOption.price.toFixed(2)}`,
          variant: 'default' 
        });
      } else {
        console.log('❌ Failed to get flat rate shipping, using default');
        // Fall back to default flat rate
        const defaultFlatRate = {
          id: 'usps-flat-rate',
          name: 'Standard Shipping via USPS',
          price: 15.00,
          days: '1-2 business days',
          isFlatRate: true
        };
        
        setDynamicShippingOptions([defaultFlatRate]);
        setShippingMethod('usps-flat-rate');
        
        toast({
          title: 'Standard Shipping Applied',
          description: 'Standard shipping rate of $15.00 applied',
          variant: 'default'
        });
      }
    } catch (err: any) {
      console.error('Error calculating shipping:', err);
      // Fall back to default flat rate
      const defaultFlatRate = {
        id: 'usps-flat-rate',
        name: 'Standard Shipping via USPS',
        price: 15.00,
        days: '1-2 business days',
        isFlatRate: true
      };
      
      setDynamicShippingOptions([defaultFlatRate]);
      setShippingMethod('usps-flat-rate');
      
      toast({
        title: 'Standard Shipping Applied',
        description: 'Standard shipping rate of $15.00 applied',
        variant: 'default'
      });
    } finally {
      setIsLoadingRates(false);
    }
  };
  
  // Render shipping info form (Step 2)
  const renderShippingInfoForm = () => (
    <form onSubmit={handleShippingInfoSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Shipping Information</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="address">Street Address *</Label>
            {useValidatedAddress && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                <Check className="h-3 w-3" /> Validated
              </Badge>
            )}
          </div>
          <div className="relative">
            <Input 
              id="address" 
              value={address} 
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressValidation(null);
                setUseValidatedAddress(false);
              }} 
              placeholder="123 Main Street, Apt #4"
              required 
              className={`pr-8 ${useValidatedAddress ? "border-green-500 bg-green-50" : ""}`}
              onBlur={() => {
                // Auto-validate when user finishes typing and moves to next field
                if (address && city && state && zipCode && !isValidatingAddress) {
                  validateAddressWithFedEx();
                }
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidatingAddress ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                useValidatedAddress && <Check className="h-4 w-4 text-green-600" />
              )}
            </div>
          </div>
        </div>
        
        {addressValidation && addressValidation.validation?.suggestedAddress && !useValidatedAddress && (
          <Alert className="bg-blue-50 border-blue-200">
            <AlertCircle className="h-4 w-4 text-blue-700" />
            <AlertTitle className="text-blue-700">Suggested Address</AlertTitle>
            <AlertDescription className="text-blue-700">
              <p className="mb-2">We found a more accurate address:</p>
              <p className="font-medium">
                {addressValidation.validation.suggestedAddress.streetLines.join(', ')}, {' '}
                {addressValidation.validation.suggestedAddress.city}, {' '}
                {addressValidation.validation.suggestedAddress.state} {' '}
                {addressValidation.validation.suggestedAddress.zipCode}
              </p>
              <Button 
                type="button" 
                size="sm" 
                className="mt-2 bg-blue-700 hover:bg-blue-800"
                onClick={applyValidatedAddress}
              >
                Use This Address
              </Button>
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zipCode">ZIP Code *</Label>
            <div className="relative">
              <Input 
                id="zipCode" 
                value={zipCode} 
                onChange={handleZipCodeChange}
                onBlur={() => {
                  // Auto-validate when user finishes typing and moves to next field
                  if (address && city && state && zipCode && !isValidatingAddress) {
                    validateAddressWithFedEx();
                  }
                }}
                placeholder="Enter ZIP code first"
                className={`font-mono pr-8 ${useValidatedAddress ? "border-green-500 bg-green-50" : ""}`}
                required 
              />
              {useValidatedAddress && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              Enter your ZIP code first for faster checkout
            </span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <div className="relative">
              <Input 
                id="city" 
                value={city} 
                onChange={(e) => {
                  setCity(e.target.value);
                  setAddressValidation(null);
                  setUseValidatedAddress(false);
                }}
                onBlur={() => {
                  // Auto-validate when user finishes typing and moves to next field
                  if (address && city && state && zipCode && !isValidatingAddress) {
                    validateAddressWithFedEx();
                  }
                }}
                className={`pr-8 ${useValidatedAddress ? "border-green-500 bg-green-50" : ""}`}
                required 
              />
              {useValidatedAddress && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="state">State *</Label>
            <Select 
              value={state} 
              onValueChange={(val) => {
                setState(val);
                setAddressValidation(null);
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
          <h3 className="font-medium mb-3">Shipping</h3>
          
          {isLoadingRates && (
            <div className="flex justify-center py-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span>Calculating shipping...</span>
              </div>
            </div>
          )}
          
          {!isLoadingRates && dynamicShippingOptions.length > 0 && (
            <div className="border p-4 rounded bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">{dynamicShippingOptions[0].name}</span>
                  <p className="text-sm text-gray-500">{dynamicShippingOptions[0].days}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    You'll receive an email with tracking information once your order ships.
                  </p>
                </div>
                <span className="font-medium">${dynamicShippingOptions[0].price.toFixed(2)}</span>
              </div>
            </div>
          )}
          
          {cart.subtotal >= 175 && (
            <p className="text-green-600 mt-2 text-sm">
              Free shipping applied for orders over $175!
            </p>
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
          {isLoading ? 'Saving...' : 'Continue to Payment'}
        </Button>
      </div>
    </form>
  );
  
  // Render payment method selection (Step 3)
  const renderPaymentMethodSelection = () => (
    <form onSubmit={handlePaymentMethodSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Payment Method</h2>
      
      <div className="space-y-4">
        <RadioGroup 
          value={paymentMethod} 
          onValueChange={setPaymentMethod}
          className="space-y-3"
        >
          <div className="flex items-center space-x-2 border p-3 rounded">
            <RadioGroupItem value="card" id="payment-card" />
            <Label htmlFor="payment-card" className="flex-grow">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Credit/Debit Card</span>
                  <p className="text-sm text-gray-500">Pay securely with your card</p>
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded">
            <RadioGroupItem value="bank" id="payment-bank" />
            <Label htmlFor="payment-bank" className="flex-grow">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Bank Transfer (Plaid)</span>
                  <p className="text-sm text-gray-500">Connect your bank securely with Plaid</p>
                </div>
                <div className="ml-2">
                  <BankIcon />
                </div>
              </div>
            </Label>
          </div>
          
          <div className="flex items-center space-x-2 border p-3 rounded">
            <RadioGroupItem value="crypto" id="payment-crypto" />
            <Label htmlFor="payment-crypto" className="flex-grow">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium">Cryptocurrency</span>
                  <p className="text-sm text-gray-500">Pay with Bitcoin or Ethereum</p>
                </div>
                <div className="ml-2 flex space-x-1">
                  <BitcoinIcon />
                  <EthereumIcon />
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
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

      setProcessing(true);

      // Get a reference to the card element
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        setError('Card element not found');
        setProcessing(false);
        return;
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
          },
        },
        setup_future_usage: 'off_session',
      });

      setProcessing(false);

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        toast({
          title: 'Payment Failed',
          description: result.error.message || 'Could not process payment',
          variant: 'destructive',
        });
      } else if (result.paymentIntent?.status === 'succeeded') {
        // Payment successful, proceed with the order processing
        toast({
          title: 'Payment Successful',
          description: 'Your order has been placed',
        });

        // Clear the cart
        cart.clearCart();
        
        // Store checkout information in sessionStorage for the success page
        sessionStorage.setItem('checkout_first_name', firstName);
        sessionStorage.setItem('checkout_last_name', lastName);
        sessionStorage.setItem('checkout_address', address);
        sessionStorage.setItem('checkout_city', city);
        sessionStorage.setItem('checkout_state', state);
        sessionStorage.setItem('checkout_zip', zipCode);
        
        // Navigate to the success page with the order data
        const orderParams = new URLSearchParams({
          amount: amount.toString(),
          payment_method: 'card',
          payment_id: result.paymentIntent.id,
          shipping_method: shippingMethod
        });
        
        window.location.href = `/checkout/confirmation?${orderParams.toString()}`;
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cardholderName">Cardholder Name</Label>
          <Input 
            id="cardholderName" 
            value={cardholderName} 
            onChange={(e) => setCardholderName(e.target.value)} 
            placeholder="Name on card"
            required 
          />
        </div>

        <div className="space-y-2">
          <Label>Card Details</Label>
          <div className="p-3 border rounded-md">
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
              onChange={(e) => setCardComplete(e.complete)}
            />
          </div>
        </div>

        {error && (
          <div className="text-destructive text-sm mt-2">
            {error}
          </div>
        )}

        <div className="pt-4">
          <p className="text-base font-medium">Amount: ${amount.toFixed(2)}</p>
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
            disabled={!stripe || !elements || !cardComplete || processing}
          >
            {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
          </Button>
        </div>
      </form>
    );
  };

  // Card Payment Component (Step 4 for card payments)
  // This is a separate component to prevent React hooks error
  const CardPaymentForm = () => {
    const [paymentIntentLoading, setPaymentIntentLoading] = useState(true);
    const { toast } = useToast();
    
    // Create a payment intent when we first render this component
    useEffect(() => {
      const createPaymentIntent = async () => {
        try {
          setPaymentIntentLoading(true);
          const response = await apiRequest('POST', '/api/create-payment-intent', {
            amount: paymentAmount,
            email: email,
          });
          
          if (response.ok) {
            const data = await response.json();
            setClientSecret(data.clientSecret);
          } else {
            const errorData = await response.json();
            toast({
              title: 'Payment Setup Failed',
              description: errorData.message || 'Could not set up payment',
              variant: 'destructive',
            });
          }
        } catch (err: any) {
          toast({
            title: 'Network Error',
            description: err.message || 'Could not connect to payment server',
            variant: 'destructive',
          });
        } finally {
          setPaymentIntentLoading(false);
        }
      };
      
      if (!clientSecret) {
        createPaymentIntent();
      } else {
        setPaymentIntentLoading(false);
      }
    }, []);

    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Card Payment</h2>
        
        <div className="bg-white p-6 border rounded-lg">
          {paymentIntentLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Setting up payment...</span>
            </div>
          ) : clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm clientSecret={clientSecret} amount={paymentAmount} />
            </Elements>
          ) : (
            <div className="text-center py-8 text-destructive">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>Could not set up payment. Please try again later.</p>
              <Button 
                className="mt-4" 
                variant="outline"
                onClick={() => setCurrentStep('payment_method')}
              >
                Back to Payment Methods
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  // Wrapper function to render card payment
  const renderCardPaymentForm = () => <CardPaymentForm />;
  
  // Card payment is now handled by the Stripe checkout component
  
  // Render bank transfer form with manual account/routing number entry
  const renderBankTransferForm = () => {
    const [accountNumber, setAccountNumber] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    
    const handleBankPaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validate bank details
      if (!accountNumber || !routingNumber || !accountName || !bankName) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all bank details',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        setIsLoading(true);
        
        // Send bank details to server
        const response = await apiRequest('POST', '/api/checkout/confirm-payment', {
          paymentMethod: 'bank',
          bankDetails: {
            accountNumber,
            routingNumber,
            accountName,
            bankName
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Clear the cart
          cart.clearCart();
          
          // Store checkout information in sessionStorage for the success page
          sessionStorage.setItem('checkout_first_name', firstName);
          sessionStorage.setItem('checkout_last_name', lastName);
          sessionStorage.setItem('checkout_address', address);
          sessionStorage.setItem('checkout_city', city);
          sessionStorage.setItem('checkout_state', state);
          sessionStorage.setItem('checkout_zip', zipCode);
          
          // Navigate to the success page with the order data
          const orderParams = new URLSearchParams({
            amount: paymentAmount.toString(),
            payment_method: 'bank',
            order_ids: (data.orderIds || []).join(','),
            shipping_method: shippingMethod
          });
          
          window.location.href = `/checkout/confirmation?${orderParams.toString()}`;
        } else {
          const errorData = await response.json();
          toast({
            title: 'Payment Failed',
            description: errorData.message || 'Could not process bank payment',
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
    
    return (
      <form onSubmit={handleBankPaymentSubmit} className="space-y-6">
        <h2 className="text-xl font-bold">Bank Transfer Payment</h2>
        
        <div className="bg-white p-6 border rounded-lg">
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-blue-700 text-sm font-medium">
                <span className="mr-2">•</span>
                Your payment will be processed securely through our ACH system.
              </p>
              <p className="text-blue-700 text-sm pt-2">
                <span className="mr-2">•</span>
                Enter your bank account details below to complete your purchase of ${paymentAmount.toFixed(2)}.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input 
                id="bankName" 
                value={bankName} 
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. Chase, Bank of America"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountName">Name on Account</Label>
              <Input 
                id="accountName" 
                value={accountName} 
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Name as it appears on your account"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="routingNumber">Routing Number</Label>
              <Input 
                id="routingNumber" 
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
                placeholder="9-digit routing number"
                required
                type="text"
                pattern="[0-9]{9}"
                inputMode="numeric"
              />
              <p className="text-xs text-gray-500">9-digit number typically found at the bottom left of your check</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input 
                id="accountNumber" 
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="Your account number"
                required
                type="text"
                inputMode="numeric"
              />
            </div>
            
            <div className="pt-4">
              <p className="text-base font-medium">Amount: ${paymentAmount.toFixed(2)}</p>
            </div>
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Complete Payment'}
          </Button>
        </div>
      </form>
    );
  };
  
  // Render crypto payment instructions (Step 4 for crypto)
  const renderCryptoPaymentForm = () => (
    <form onSubmit={handlePaymentConfirmation} className="space-y-6">
      <h2 className="text-xl font-bold">Cryptocurrency Payment</h2>
      
      <div className="bg-white p-6 border rounded-lg">
        <h3 className="font-medium mb-4">Please send ${paymentAmount.toFixed(2)} worth of cryptocurrency to:</h3>
        
        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-orange-600 mb-2">Bitcoin (BTC)</h4>
            <p className="mb-2 break-all font-mono bg-gray-100 p-2 rounded text-sm">
              {cryptoInfo?.bitcoin || '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'}
            </p>
          </div>
          
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-blue-600 mb-2">Ethereum (ETH)</h4>
            <p className="mb-2 break-all font-mono bg-gray-100 p-2 rounded text-sm">
              {cryptoInfo?.ethereum || '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'}
            </p>
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mt-6">
          <p className="text-blue-700 text-sm">
            {cryptoInfo?.instructions || 'After sending payment, click "Confirm Payment" below to complete your order.'}
          </p>
        </div>
        
        <div className="mt-6">
          <Label htmlFor="transactionId">Transaction Hash (optional)</Label>
          <Input 
            id="transactionId" 
            placeholder="Enter the transaction hash"
            value={transactionId} 
            onChange={(e) => setTransactionId(e.target.value)} 
            className="mt-1"
          />
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </div>
    </form>
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