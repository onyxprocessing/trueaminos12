/**
 * Debug script for affiliate code validation
 */

import { validateAffiliateCode } from './affiliate-codes';
import { debugValidateAffiliateCode } from './debug-validator';
import "dotenv/config";

// Test codes
const testCodes = [
  'TEST10',
  'TEST20',
  'DISCOUNT25',
  'TRUEFRIENDS',
  'TESTCODE'
];

// Function to test a specific code
async function testSpecificCode(code: string) {
  console.log(`🧪 Running enhanced debug for specific code: "${code}"`);
  try {
    const result = await debugValidateAffiliateCode(code);
    console.log('\n📊 Final validation result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

// Function to test all codes
async function testAllCodes() {
  console.log('🔍 Debugging affiliate code validation...');
  console.log('---------------------------------------');
  
  for (const code of testCodes) {
    console.log(`\nTesting code: "${code}"`);
    try {
      // First try with the original validator
      console.log('Testing with original validator:');
      const result = await validateAffiliateCode(code);
      console.log('Validation result:', JSON.stringify(result, null, 2));
      console.log(`Valid: ${result.valid ? '✅ YES' : '❌ NO'}`);
      if (result.valid) {
        console.log(`Discount: ${result.discount}%`);
      } else {
        console.log('Reason: Code not found or not active in Airtable');
      }
      
      // Then test with the enhanced debug validator
      console.log('\nTesting with enhanced debug validator:');
      const debugResult = await debugValidateAffiliateCode(code);
      console.log(`Enhanced validation result: ${debugResult.valid ? '✅ Valid' : '❌ Invalid'}`);
    } catch (error) {
      console.error('Error during validation:', error);
    }
    
    console.log('---------------------------------------');
  }
}

// Check if a specific code was passed via command line
if (process.argv.length > 2) {
  const specificCode = process.argv[2];
  testSpecificCode(specificCode).catch(console.error);
} else {
  // Run the standard debug function for all test codes
  testAllCodes().catch(console.error);
}