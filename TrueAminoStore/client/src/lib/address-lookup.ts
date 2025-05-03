/**
 * Address validation and lookup utilities
 * Includes:
 * 1. Simple US ZIP code validation and city/state lookup
 * 2. FedEx Address Validation API integration
 */

import { apiRequest } from './queryClient';

// Common ZIP code patterns
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

// Basic US ZIP code database with most common city/state combinations
// This is a small subset to demonstrate functionality without needing an API
const ZIP_DATABASE: Record<string, { city: string; state: string }> = {
  // Major cities across different states
  '10001': { city: 'New York', state: 'NY' },
  '10002': { city: 'New York', state: 'NY' },
  '10003': { city: 'New York', state: 'NY' },
  '10016': { city: 'New York', state: 'NY' },
  '10019': { city: 'New York', state: 'NY' },
  '10036': { city: 'New York', state: 'NY' },
  '02108': { city: 'Boston', state: 'MA' },
  '02110': { city: 'Boston', state: 'MA' },
  '02116': { city: 'Boston', state: 'MA' },
  '02199': { city: 'Boston', state: 'MA' },
  '06101': { city: 'Hartford', state: 'CT' },
  '06103': { city: 'Hartford', state: 'CT' },
  '19102': { city: 'Philadelphia', state: 'PA' },
  '19103': { city: 'Philadelphia', state: 'PA' },
  '19106': { city: 'Philadelphia', state: 'PA' },
  '19107': { city: 'Philadelphia', state: 'PA' },
  '30303': { city: 'Atlanta', state: 'GA' },
  '30305': { city: 'Atlanta', state: 'GA' },
  '30308': { city: 'Atlanta', state: 'GA' },
  '30309': { city: 'Atlanta', state: 'GA' },
  '32801': { city: 'Orlando', state: 'FL' },
  '32803': { city: 'Orlando', state: 'FL' },
  '32804': { city: 'Orlando', state: 'FL' },
  '33101': { city: 'Miami', state: 'FL' },
  '33127': { city: 'Miami', state: 'FL' },
  '33128': { city: 'Miami', state: 'FL' },
  '60601': { city: 'Chicago', state: 'IL' },
  '60602': { city: 'Chicago', state: 'IL' },
  '60603': { city: 'Chicago', state: 'IL' },
  '60604': { city: 'Chicago', state: 'IL' },
  '60605': { city: 'Chicago', state: 'IL' },
  '60606': { city: 'Chicago', state: 'IL' },
  '75201': { city: 'Dallas', state: 'TX' },
  '75202': { city: 'Dallas', state: 'TX' },
  '75203': { city: 'Dallas', state: 'TX' },
  '77002': { city: 'Houston', state: 'TX' },
  '77003': { city: 'Houston', state: 'TX' },
  '77004': { city: 'Houston', state: 'TX' },
  '80202': { city: 'Denver', state: 'CO' },
  '80203': { city: 'Denver', state: 'CO' },
  '80204': { city: 'Denver', state: 'CO' },
  '85004': { city: 'Phoenix', state: 'AZ' },
  '85007': { city: 'Phoenix', state: 'AZ' },
  '89101': { city: 'Las Vegas', state: 'NV' },
  '89102': { city: 'Las Vegas', state: 'NV' },
  '89109': { city: 'Las Vegas', state: 'NV' },
  '90001': { city: 'Los Angeles', state: 'CA' },
  '90005': { city: 'Los Angeles', state: 'CA' },
  '90010': { city: 'Los Angeles', state: 'CA' },
  '90015': { city: 'Los Angeles', state: 'CA' },
  '90024': { city: 'Los Angeles', state: 'CA' },
  '90025': { city: 'Los Angeles', state: 'CA' },
  '90210': { city: 'Beverly Hills', state: 'CA' },
  '94102': { city: 'San Francisco', state: 'CA' },
  '94103': { city: 'San Francisco', state: 'CA' },
  '94104': { city: 'San Francisco', state: 'CA' },
  '94105': { city: 'San Francisco', state: 'CA' },
  '94107': { city: 'San Francisco', state: 'CA' },
  '94108': { city: 'San Francisco', state: 'CA' },
  '94109': { city: 'San Francisco', state: 'CA' },
  '94110': { city: 'San Francisco', state: 'CA' },
  '94111': { city: 'San Francisco', state: 'CA' },
  '94112': { city: 'San Francisco', state: 'CA' },
  '94115': { city: 'San Francisco', state: 'CA' },
  '94117': { city: 'San Francisco', state: 'CA' },
  '94118': { city: 'San Francisco', state: 'CA' },
  '94121': { city: 'San Francisco', state: 'CA' },
  '94123': { city: 'San Francisco', state: 'CA' },
  '94133': { city: 'San Francisco', state: 'CA' },
  '98101': { city: 'Seattle', state: 'WA' },
  '98104': { city: 'Seattle', state: 'WA' },
  '98109': { city: 'Seattle', state: 'WA' },
};

/**
 * Validates a US ZIP code format
 * @param zipCode The ZIP code to validate
 * @returns True if the ZIP code format is valid
 */
export function validateZipCode(zipCode: string): boolean {
  return ZIP_REGEX.test(zipCode);
}

/**
 * Looks up city and state from a ZIP code
 * @param zipCode The ZIP code to look up
 * @returns City and state object or null if not found
 */
export function lookupZipCode(zipCode: string): { city: string; state: string } | null {
  // Remove any dash and extra space
  const cleanZip = zipCode.replace(/[\s-]/g, '').substring(0, 5);
  
  // Check if ZIP code exists in our database
  if (cleanZip in ZIP_DATABASE) {
    return ZIP_DATABASE[cleanZip];
  }
  
  return null;
}

/**
 * Validates a street address for basic format
 * @param address The street address to validate
 * @returns True if the address appears to be in a valid format
 */
export function validateAddress(address: string): boolean {
  // Basic validation: at least 5 characters with a digit
  return address.length >= 5 && /\d/.test(address);
}

/**
 * Validates a city name (basic validation)
 * @param city The city name to validate
 * @returns True if the city appears to be valid
 */
export function validateCity(city: string): boolean {
  // Basic validation: at least 2 characters, only letters and spaces
  return city.length >= 2 && /^[A-Za-z\s\-'\.]+$/.test(city);
}

export function formatAddress(address: string, city: string, state: string, zipCode: string): string {
  return `${address}, ${city}, ${state} ${zipCode}`;
}

/**
 * FedEx Address Validation API Types
 */
export interface FedExAddressValidationResponse {
  success: boolean;
  validation?: {
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
  };
  message?: string;
}

/**
 * Validates an address using the FedEx Address Validation API
 * @param address The street address to validate
 * @param city The city
 * @param state The state code
 * @param zipCode The ZIP code
 * @param country The country code (defaults to US)
 * @returns Promise with validation results or null if validation fails
 */
export async function validateAddressWithFedEx(
  address: string,
  city: string,
  state: string,
  zipCode: string,
  country: string = 'US'
): Promise<FedExAddressValidationResponse | null> {
  try {
    // Split address into lines (basic implementation)
    const addressLines = address.split(',').map(line => line.trim());
    const streetLine1 = addressLines[0] || address;
    const streetLine2 = addressLines.length > 1 ? addressLines[1] : undefined;

    // Call the API
    const response = await apiRequest('POST', '/api/validate-address', {
      streetLine1,
      streetLine2,
      city,
      state,
      zipCode,
      country
    });

    return response as FedExAddressValidationResponse;
  } catch (error) {
    console.error('Error validating address with FedEx API:', error);
    return null;
  }
}