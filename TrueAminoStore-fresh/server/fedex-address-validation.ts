/**
 * FedEx Address Validation API Integration
 * This service handles address validation using the FedEx Address Validation API
 */
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// FedEx API credentials should be stored in environment variables
const FEDEX_API_KEY = process.env.FEDEX_API_KEY;
const FEDEX_API_SECRET = process.env.FEDEX_API_SECRET;
const FEDEX_API_URL = 'https://apis-sandbox.fedex.com'; // Using sandbox for development

// Type definitions for the FedEx API
interface FedExAddressToValidate {
  streetLines: string[];
  city?: string;
  stateOrProvinceCode?: string;
  postalCode?: string;
  countryCode: string;
}

interface FedExAddressValidationRequest {
  addressesToValidate: {
    address: FedExAddressToValidate;
  }[];
}

interface FedExResolvedAddress {
  streetLinesToken: string[];
  cityToken: string;
  stateOrProvinceCodeToken: string;
  postalCodeToken: string;
  countryCodeToken: string;
  classification: 'BUSINESS' | 'RESIDENTIAL' | 'MIXED' | 'UNKNOWN';
  attributes: {
    name: string;
    value: string;
  }[];
}

interface FedExAddressValidationResponse {
  output: {
    resolvedAddresses: FedExResolvedAddress[];
  };
}

/**
 * Get an authentication token from FedEx API
 * @returns Authentication token or null if authentication fails
 */
async function getFedExAuthToken(): Promise<string | null> {
  try {
    if (!FEDEX_API_KEY || !FEDEX_API_SECRET) {
      console.error('FedEx API credentials not found in environment variables');
      return null;
    }

    const response = await axios.post(`${FEDEX_API_URL}/oauth/token`, {
      grant_type: 'client_credentials',
      client_id: FEDEX_API_KEY,
      client_secret: FEDEX_API_SECRET
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (response.data?.access_token) {
      return response.data.access_token;
    }
    
    console.error('FedEx authentication failed:', response.data);
    return null;
  } catch (error) {
    console.error('Error getting FedEx authentication token:', error);
    return null;
  }
}

/**
 * Validate an address using FedEx Address Validation API
 * @param address Address to validate
 * @returns Validated address or null if validation fails
 */
export async function validateAddress(address: {
  streetLine1: string;
  streetLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
}): Promise<{
  isValid: boolean;
  classification: 'business' | 'residential' | 'mixed' | 'unknown';
  suggestedAddress?: {
    streetLines: string[];
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  message?: string;
} | null> {
  try {
    // For testing purposes, return a successful response with the same address
    if (process.env.NODE_ENV !== 'production') {
      console.log('Using mock FedEx address validation in development mode');
      return {
        isValid: true,
        classification: 'residential',
        suggestedAddress: {
          streetLines: [address.streetLine1, address.streetLine2].filter(Boolean) as string[],
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          country: address.country
        }
      };
    }

    // Get auth token
    const token = await getFedExAuthToken();
    if (!token) {
      return null;
    }

    const streetLines = [address.streetLine1];
    if (address.streetLine2) {
      streetLines.push(address.streetLine2);
    }

    const requestData: FedExAddressValidationRequest = {
      addressesToValidate: [
        {
          address: {
            streetLines,
            city: address.city,
            stateOrProvinceCode: address.state,
            postalCode: address.zipCode,
            countryCode: address.country
          }
        }
      ]
    };

    const response = await axios.post(
      `${FEDEX_API_URL}/address/v1/addresses/resolve`, 
      requestData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.output?.resolvedAddresses?.[0]) {
      const resolvedAddress = response.data.output.resolvedAddresses[0];
      
      // Check if the address is valid
      const attributes = resolvedAddress.attributes || [];
      const isStandardized = attributes.some((attr: { name: string; value: string }) => 
        attr.name === 'AddressState' && attr.value === 'STANDARDIZED'
      );
      
      const dpvAttribute = attributes.find((attr: { name: string; value: string }) => attr.name === 'DPV');
      const isDeliveryPointValid = dpvAttribute?.value === 'true';
      
      const interpolatedAttribute = attributes.find((attr: { name: string; value: string }) => attr.name === 'InterpolatedAddress');
      const isInterpolated = interpolatedAttribute?.value === 'true';
      
      // Address is valid if it's standardized, has valid delivery point, and is not interpolated
      const isValid = isStandardized && isDeliveryPointValid && !isInterpolated;
      
      // Get classification
      let classification: 'business' | 'residential' | 'mixed' | 'unknown';
      switch (resolvedAddress.classification) {
        case 'BUSINESS':
          classification = 'business';
          break;
        case 'RESIDENTIAL':
          classification = 'residential';
          break;
        case 'MIXED':
          classification = 'mixed';
          break;
        default:
          classification = 'unknown';
      }
      
      return {
        isValid,
        classification,
        suggestedAddress: {
          streetLines: resolvedAddress.streetLinesToken,
          city: resolvedAddress.cityToken,
          state: resolvedAddress.stateOrProvinceCodeToken,
          zipCode: resolvedAddress.postalCodeToken,
          country: resolvedAddress.countryCodeToken
        },
        message: isValid ? 'Address is valid' : 'Address may have issues or not be deliverable'
      };
    }
    
    console.error('Invalid response from FedEx API:', response.data);
    return null;
  } catch (error) {
    console.error('Error validating address with FedEx API:', error);
    return null;
  }
}

/**
 * Simplified address validation without API for development
 * @param address Address to validate
 * @returns Validation result
 */
export function validateAddressFormat(address: {
  streetLine1: string;
  city?: string;
  state?: string;
  zipCode?: string;
}): boolean {
  // Basic validation rules
  if (!address.streetLine1 || address.streetLine1.length < 5) {
    return false;
  }
  
  if (!address.zipCode || !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
    return false;
  }
  
  if (!address.city || address.city.length < 2) {
    return false;
  }
  
  if (!address.state || address.state.length !== 2) {
    return false;
  }
  
  return true;
}