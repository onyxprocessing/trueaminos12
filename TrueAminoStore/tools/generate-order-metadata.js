/**
 * This tool creates example Stripe metadata in different formats to test webhook processing
 */
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Sample customer info
const customer = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  phone: '555-987-6543',
  address: '456 Sample Ave',
  city: 'Test City',
  state: 'TX',
  zipCode: '54321'
};

// Sample products
const products = [
  { id: 2, name: 'NAD+', price: 23, weight: '100mg', quantity: 1 },
  { id: 3, name: 'MK-677', price: 55, weight: '750mg', quantity: 2 }
];

// Generate test metadata in different formats

// 1. Original products format
const productsMetadata = {
  products: JSON.stringify(products.map(product => ({
    id: product.id,
    name: product.name,
    weight: product.weight,
    quantity: product.quantity,
    price: product.price
  }))),
  session_id: 'test_session_' + Date.now(),
  shipping_method: 'express',
  customer_name: `${customer.firstName} ${customer.lastName}`,
  customer_email: customer.email,
  customer_phone: customer.phone
};

// 2. New compact orderSummary format
const orderSummaryMetadata = {
  orderSummary: JSON.stringify({
    customer: `${customer.firstName} ${customer.lastName}`,
    email: customer.email,
    items: products.map(product => ({
      id: product.id,
      name: product.name.substring(0, 20),
      qty: product.quantity,
      weight: product.weight
    })),
    shipping: 'express'
  }),
  session_id: 'test_session_' + Date.now(),
  shipping_method: 'express',
  customer_name: `${customer.firstName} ${customer.lastName}`,
  customer_email: customer.email,
  customer_phone: customer.phone
};

// 3. Legacy orderDetails format
const orderDetailsMetadata = {
  orderDetails: JSON.stringify({
    customerInfo: customer,
    cartItems: JSON.stringify(products.map(product => ({
      product: {
        id: product.id,
        name: product.name
      },
      productId: product.id,
      quantity: product.quantity,
      selectedWeight: product.weight
    }))),
    shipping: 'express'
  }),
  session_id: 'test_session_' + Date.now()
};

// Output all formats
console.log('===== Products Format =====');
console.log(JSON.stringify(productsMetadata, null, 2));
console.log('\n');

console.log('===== OrderSummary Format =====');
console.log(JSON.stringify(orderSummaryMetadata, null, 2));
console.log('\n');

console.log('===== OrderDetails Format =====');
console.log(JSON.stringify(orderDetailsMetadata, null, 2));
console.log('\n');

// Generate a full payment intent object with the orderSummary format
const paymentIntent = {
  id: 'pi_test_' + Date.now(),
  object: 'payment_intent',
  amount: 13300, // $133.00 (23 + 55*2)
  currency: 'usd',
  status: 'succeeded',
  created: Math.floor(Date.now() / 1000),
  payment_method_types: ['card'],
  receipt_email: customer.email,
  metadata: orderSummaryMetadata,
  shipping: {
    name: `${customer.firstName} ${customer.lastName}`,
    phone: customer.phone,
    address: {
      line1: customer.address,
      city: customer.city,
      state: customer.state,
      postal_code: customer.zipCode,
      country: 'US'
    }
  }
};

console.log('===== Full Payment Intent Object =====');
console.log(JSON.stringify(paymentIntent, null, 2));