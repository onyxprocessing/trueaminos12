import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import { Request, Response } from 'express';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID || '',
      'PLAID-SECRET': process.env.PLAID_SECRET || '',
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Create a link token for Plaid to initialize the Link process
export async function createLinkToken(req: Request, res: Response) {
  try {
    // Create a link token for a user
    const { sessionId } = req.body;
    
    // Generating a unique client user id for this session
    const clientUserId = sessionId || `user-${Math.floor(Math.random() * 1000000)}`;
    
    const linkTokenConfig = {
      user: {
        client_user_id: clientUserId,
      },
      client_name: 'TrueAminos Store',
      products: ['payment_initiation' as Products],
      country_codes: ['US' as CountryCode],
      language: 'en',
    };

    const createTokenResponse = await plaidClient.linkTokenCreate(linkTokenConfig);
    
    return res.json({
      success: true,
      link_token: createTokenResponse.data.link_token,
    });
  } catch (error: any) {
    console.error('Error creating link token:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create link token',
    });
  }
}

// Exchange public token for access token after successful Plaid Link flow
export async function exchangePublicToken(req: Request, res: Response) {
  try {
    const { public_token } = req.body;
    
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    
    // Store this access token with the user for future use
    // This could be saved to a database or session
    return res.json({
      success: true,
      access_token: accessToken,
    });
  } catch (error: any) {
    console.error('Error exchanging public token:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to exchange token',
    });
  }
}

// Create a payment intent with Stripe
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required',
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method_types: ['card'],
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment intent',
    });
  }
}

// After successful Plaid Link flow, create a Stripe payment method
export async function createStripePaymentMethodFromPlaid(req: Request, res: Response) {
  try {
    const { access_token, account_id } = req.body;
    
    if (!access_token || !account_id) {
      return res.status(400).json({
        success: false,
        message: 'Access token and account ID are required',
      });
    }

    // Create a Stripe payment method using the Plaid processor token
    const createProcessorResponse = await plaidClient.processorStripeBankAccountTokenCreate({
      access_token,
      account_id,
    });

    const stripeToken = createProcessorResponse.data.stripe_bank_account_token;

    return res.json({
      success: true,
      stripe_bank_account_token: stripeToken,
    });
  } catch (error: any) {
    console.error('Error creating Stripe bank account token:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create Stripe bank account token',
    });
  }
}