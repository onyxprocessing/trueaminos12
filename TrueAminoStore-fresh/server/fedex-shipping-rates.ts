/**
 * FedEx Shipping Rates API
 * Uses the FedEx Comprehensive Rate and Transit Times API to get shipping rates
 * for packages with dimensions and weight
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Constants for package dimensions - small vial boxes
// These dimensions are based on typical small boxes used for shipping vials
// Length, width, height in inches
const PACKAGE_DIMENSIONS = {
  SMALL_VIAL: {
    length: 4,
    width: 4,
    height: 2,
    weightInLbs: 0.5,  // Half a pound for a small package with vial
  },
  MEDIUM_VIAL: {
    length: 6,
    width: 6, 
    height: 4,
    weightInLbs: 1.0,  // One pound for a medium package
  },
  LARGE_ORDER: {
    length: 8,
    width: 8,
    height: 6,
    weightInLbs: 2.0,  // Two pounds for larger orders
  }
};

// Default dimensions if not specified
const DEFAULT_PACKAGE = PACKAGE_DIMENSIONS.SMALL_VIAL;

// API constants
const FEDEX_API_URL = 'https://apis.fedex.com';
const OAUTH_ENDPOINT = '/oauth/token';
const RATE_ENDPOINT = '/rate/v1/rates/quotes';

// Interface for package dimensions
export interface PackageDimensions {
  length: number;
  width: number;
  height: number;
  weightInLbs: number;
}

// Interface for address
export interface ShippingAddress {
  streetLines: string[];
  city: string;
  stateOrProvinceCode: string;
  postalCode: string;
  countryCode: string;
}

// Interface for shipping rates request
export interface ShippingRateRequest {
  recipientAddress: ShippingAddress;
  packageDimensions?: PackageDimensions;
  packageSize?: 'SMALL_VIAL' | 'MEDIUM_VIAL' | 'LARGE_ORDER';
}

// Interface for a shipping rate option
export interface ShippingRateOption {
  serviceType: string;
  serviceName: string;
  transitTime: string;
  price: number;
  currency: string;
  deliveryDate?: string;
  isMockData?: boolean;
}

// Get FedEx OAuth token
async function getFedExToken(): Promise<string> {
  try {
    // Check if we have API credentials
    if (!process.env.FEDEX_API_KEY || !process.env.FEDEX_API_SECRET) {
      console.warn('FedEx API credentials not found');
      return '';
    }

    const response = await axios.post(
      `${FEDEX_API_URL}${OAUTH_ENDPOINT}`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.FEDEX_API_KEY,
        client_secret: process.env.FEDEX_API_SECRET
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data.access_token;
  } catch (error: any) {
    console.error('Error getting FedEx token:', error.message);
    return '';
  }
}

/**
 * Get shipping rates from FedEx API
 * @param request Shipping rate request with recipient address and package details
 * @returns Array of shipping rate options
 */
export async function getShippingRates(request: ShippingRateRequest): Promise<ShippingRateOption[]> {
  try {
    // For development/testing mode, return mock data if no API key
    if (process.env.NODE_ENV === 'development' && (!process.env.FEDEX_API_KEY || !process.env.FEDEX_API_SECRET)) {
      console.log('Using mock shipping rates in development mode');
      return getMockShippingRates();
    }

    const token = await getFedExToken();
    if (!token) {
      console.warn('Could not get FedEx token, using mock rates');
      return getMockShippingRates();
    }

    // Get package dimensions based on packageSize or use provided dimensions
    let dimensions: PackageDimensions;
    if (request.packageDimensions) {
      dimensions = request.packageDimensions;
    } else if (request.packageSize) {
      dimensions = PACKAGE_DIMENSIONS[request.packageSize];
    } else {
      dimensions = DEFAULT_PACKAGE;
    }

    // Build request payload
    const payload = {
      accountNumber: {
        value: process.env.FEDEX_ACCOUNT_NUMBER || ''
      },
      requestedShipment: {
        shipper: {
          address: {
            streetLines: [
              process.env.FEDEX_SHIPPER_STREET || '123 Shipper St',
              process.env.FEDEX_SHIPPER_STREET2 || ''
            ],
            city: process.env.FEDEX_SHIPPER_CITY || 'MEMPHIS',
            stateOrProvinceCode: process.env.FEDEX_SHIPPER_STATE || 'TN',
            postalCode: process.env.FEDEX_SHIPPER_ZIP || '38116',
            countryCode: process.env.FEDEX_SHIPPER_COUNTRY || 'US'
          }
        },
        recipient: {
          address: request.recipientAddress
        },
        pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
        rateRequestType: ['ACCOUNT', 'LIST'],
        requestedPackageLineItems: [
          {
            weight: {
              units: 'LB',
              value: dimensions.weightInLbs
            },
            dimensions: {
              length: dimensions.length,
              width: dimensions.width,
              height: dimensions.height,
              units: 'IN'
            },
            packageSpecialServices: {
              specialServiceTypes: ['SIGNATURE_OPTION'],
              signatureOptionType: 'ADULT'
            }
          }
        ]
      }
    };

    // Make request to FedEx API
    const response = await axios.post(
      `${FEDEX_API_URL}${RATE_ENDPOINT}`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      }
    );

    // Parse and return the shipping rates
    return parseShippingRates(response.data);
  } catch (error: any) {
    console.error('Error getting shipping rates:', error.message);
    console.error('Request details:', JSON.stringify({
      address: request.recipientAddress,
      packageSize: request.packageSize
    }, null, 2));
    
    if (error.response) {
      console.error('FedEx API response status:', error.response.status);
      console.error('FedEx API response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // In case of error, return mock data with a warning flag
    const mockRates = getMockShippingRates();
    
    // Add a flag to each rate to indicate it's mock data
    return mockRates.map(rate => ({
      ...rate,
      isMockData: true
    }));
  }
}

/**
 * Parse the FedEx API response and extract shipping rates
 */
function parseShippingRates(response: any): ShippingRateOption[] {
  try {
    const rates: ShippingRateOption[] = [];
    const rateReplyDetails = response.output.rateReplyDetails || [];

    for (const detail of rateReplyDetails) {
      const serviceType = detail.serviceType;
      let serviceName = detail.serviceName || getServiceNameByType(serviceType);
      
      // Extract delivery time if available
      let transitTime = 'Standard';
      let deliveryDate = '';
      
      if (detail.commit && detail.commit.deliveryTimestamp) {
        deliveryDate = detail.commit.deliveryTimestamp;
        const date = new Date(deliveryDate);
        const now = new Date();
        const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        transitTime = `${days} business day${days !== 1 ? 's' : ''}`;
      }
      
      // Get rate amount
      const ratedShipmentDetails = detail.ratedShipmentDetails || [];
      if (ratedShipmentDetails.length > 0) {
        const shipmentDetail = ratedShipmentDetails[0];
        const totalNetCharge = shipmentDetail.totalNetCharge;
        
        if (totalNetCharge) {
          rates.push({
            serviceType,
            serviceName,
            transitTime,
            price: parseFloat(totalNetCharge.amount),
            currency: totalNetCharge.currency,
            deliveryDate
          });
        }
      }
    }
    
    return rates;
  } catch (error) {
    console.error('Error parsing shipping rates:', error);
    // Return mock data with a flag
    const mockRates = getMockShippingRates();
    return mockRates.map(rate => ({
      ...rate,
      isMockData: true
    }));
  }
}

/**
 * Get a friendly service name based on FedEx service type code
 */
function getServiceNameByType(serviceType: string): string {
  const serviceNames: Record<string, string> = {
    'FEDEX_GROUND': 'FedEx Ground',
    'GROUND_HOME_DELIVERY': 'FedEx Home Delivery',
    'FEDEX_EXPRESS_SAVER': 'FedEx Express Saver',
    'FEDEX_2_DAY': 'FedEx 2Day',
    'FEDEX_2_DAY_AM': 'FedEx 2Day AM',
    'STANDARD_OVERNIGHT': 'FedEx Standard Overnight',
    'PRIORITY_OVERNIGHT': 'FedEx Priority Overnight',
    'FIRST_OVERNIGHT': 'FedEx First Overnight'
  };
  
  return serviceNames[serviceType] || serviceType;
}

/**
 * Get mock shipping rates for development/testing
 */
function getMockShippingRates(): ShippingRateOption[] {
  return [
    {
      serviceType: 'FEDEX_GROUND',
      serviceName: 'FedEx Ground',
      transitTime: '3-5 business days',
      price: 9.95,
      currency: 'USD'
    },
    {
      serviceType: 'FEDEX_EXPRESS_SAVER',
      serviceName: 'FedEx Express Saver',
      transitTime: '3 business days',
      price: 14.95,
      currency: 'USD'
    },
    {
      serviceType: 'FEDEX_2_DAY',
      serviceName: 'FedEx 2Day',
      transitTime: '2 business days',
      price: 19.95,
      currency: 'USD'
    },
    {
      serviceType: 'PRIORITY_OVERNIGHT',
      serviceName: 'FedEx Priority Overnight',
      transitTime: 'Next business day',
      price: 29.95,
      currency: 'USD'
    }
  ];
}

/**
 * Convert a standard shipping address to FedEx format
 */
export function formatAddressForFedEx(
  street: string,
  city: string,
  state: string,
  zipCode: string,
  country: string = 'US'
): ShippingAddress {
  // Handle multi-line addresses
  const streetLines = street.includes(',') ? 
    street.split(',').map(s => s.trim()) : 
    [street];
  
  return {
    streetLines,
    city,
    stateOrProvinceCode: state,
    postalCode: zipCode,
    countryCode: country
  };
}

/**
 * Estimate package size based on cart items
 * @param cartItems Array of cart items
 * @returns The appropriate package size
 */
export function estimatePackageSize(cartItems: any[]): 'SMALL_VIAL' | 'MEDIUM_VIAL' | 'LARGE_ORDER' {
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems <= 2) {
    return 'SMALL_VIAL';
  } else if (totalItems <= 5) {
    return 'MEDIUM_VIAL';
  } else {
    return 'LARGE_ORDER';
  }
}