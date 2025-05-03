/**
 * Shipping rates API client
 * This module provides functions for getting shipping rates from the FedEx API
 */

import { apiRequest } from './queryClient';

/**
 * Interface for a shipping rate option
 */
export interface ShippingRateOption {
  serviceType: string;
  serviceName: string;
  transitTime: string;
  price: number;
  currency: string;
  deliveryDate?: string;
  isMockData?: boolean;
}

/**
 * Get shipping rates from FedEx API
 * @param address Street address
 * @param city City
 * @param state State/province
 * @param zipCode ZIP/postal code
 * @param country Country code (default: US)
 * @returns Array of shipping rate options or null if request fails
 */
export async function getShippingRates(
  address: string,
  city: string, 
  state: string,
  zipCode: string,
  country: string = 'US'
): Promise<{ success: boolean; rates?: ShippingRateOption[]; message?: string }> {
  try {
    // Call the API
    const response = await apiRequest('POST', '/api/shipping-rates', {
      street: address,
      city,
      state,
      zipCode,
      country
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: errorData.message || 'Could not retrieve shipping rates'
      };
    }
    
    // Parse the JSON response
    const data = await response.json();
    return {
      success: true,
      rates: data.rates
    };
  } catch (error: any) {
    console.error('Error getting shipping rates:', error);
    return {
      success: false,
      message: error.message || 'Network error while retrieving shipping rates'
    };
  }
}

/**
 * Format a shipping rate price for display
 * @param price Price value
 * @param currency Currency code
 * @returns Formatted price string
 */
export function formatShippingPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: currency 
  }).format(price);
}

/**
 * Sort shipping rates by price (lowest to highest)
 * @param rates Array of shipping rate options
 * @returns Sorted array
 */
export function sortRatesByPrice(rates: ShippingRateOption[]): ShippingRateOption[] {
  return [...rates].sort((a, b) => a.price - b.price);
}

/**
 * Sort shipping rates by delivery time (fastest to slowest)
 * @param rates Array of shipping rate options
 * @returns Sorted array
 */
export function sortRatesBySpeed(rates: ShippingRateOption[]): ShippingRateOption[] {
  // Sort by transit time, converting "Next business day" to 1, "2 business days" to 2, etc.
  return [...rates].sort((a, b) => {
    const getDays = (transit: string): number => {
      if (transit.includes('Next') || transit.includes('1 business day')) return 1;
      const match = transit.match(/(\d+)/);
      return match ? parseInt(match[1]) : 999; // Default to high number for unknown formats
    };
    
    return getDays(a.transitTime) - getDays(b.transitTime);
  });
}