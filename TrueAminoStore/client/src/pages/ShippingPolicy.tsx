import React from 'react'
import Layout from '@/components/Layout'
import PageMeta from '@/components/PageMeta'

export default function ShippingPolicyPage() {
  return (
    <>
      <PageMeta
        title="Shipping Policy | TrueAminos"
        description="Shipping information for TrueAminos orders. Learn about our shipping methods, delivery times, costs, and international shipping policies."
        keywords="shipping policy, TrueAminos shipping, delivery information, order shipping"
        canonicalPath="/shipping-policy"
        type="website"
      />
      
      <Layout title="Shipping Policy">
        <div className="container px-6 md:px-8 mx-auto max-w-3xl py-12">
          <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Last Updated: May 2, 2025
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Processing Time</h2>
            <p>
              All orders are processed within 1-2 business days after receiving your order confirmation email. Orders placed on weekends or holidays will be processed on the next business day. We strive to ship all orders as quickly as possible, but during peak seasons or promotional periods, processing may take up to 3 business days.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 my-6">
              <p className="font-semibold text-blue-900">Free Shipping on Orders $175+</p>
              <p className="text-blue-800 text-sm mt-1">Enjoy complimentary standard shipping on all domestic orders over $175.</p>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Shipping Methods and Delivery Time</h2>
            <p>
              TrueAminos offers several shipping options to ensure your order arrives when you need it:
            </p>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Domestic Shipping (United States)</h3>
            <table className="min-w-full border border-gray-300 mt-4 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b text-left">Shipping Method</th>
                  <th className="p-3 border-b text-left">Estimated Delivery Time</th>
                  <th className="p-3 border-b text-left">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-b">Standard Shipping</td>
                  <td className="p-3 border-b">3-5 business days</td>
                  <td className="p-3 border-b">$7.95 (Free on orders over $175)</td>
                </tr>
                <tr>
                  <td className="p-3 border-b">Expedited Shipping</td>
                  <td className="p-3 border-b">2-3 business days</td>
                  <td className="p-3 border-b">$12.95</td>
                </tr>
                <tr>
                  <td className="p-3 border-b">Priority Shipping</td>
                  <td className="p-3 border-b">1-2 business days</td>
                  <td className="p-3 border-b">$24.95</td>
                </tr>
              </tbody>
            </table>
            
            <h3 className="text-lg font-medium mt-6 mb-3">International Shipping</h3>
            <table className="min-w-full border border-gray-300 mt-4 mb-6">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-3 border-b text-left">Region</th>
                  <th className="p-3 border-b text-left">Estimated Delivery Time</th>
                  <th className="p-3 border-b text-left">Cost</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-3 border-b">Canada</td>
                  <td className="p-3 border-b">5-10 business days</td>
                  <td className="p-3 border-b">Starting at $19.95</td>
                </tr>
                <tr>
                  <td className="p-3 border-b">Europe</td>
                  <td className="p-3 border-b">7-14 business days</td>
                  <td className="p-3 border-b">Starting at $29.95</td>
                </tr>
                <tr>
                  <td className="p-3 border-b">Other International Destinations</td>
                  <td className="p-3 border-b">10-20 business days</td>
                  <td className="p-3 border-b">Starting at $39.95</td>
                </tr>
              </tbody>
            </table>
            
            <p className="text-sm italic mt-2">
              Note: International delivery times are estimates and may vary depending on customs processing in the destination country.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Shipping Restrictions</h2>
            <p>
              Due to the nature of our products, there may be shipping restrictions to certain countries or regions. We reserve the right to cancel orders to areas where our products cannot be legally shipped. Please contact customer service before placing an order if you are uncertain about shipping restrictions to your location.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Temperature-Controlled Shipping</h2>
            <p>
              Certain products require temperature-controlled shipping to maintain their integrity and efficacy. These products are shipped with appropriate packaging to maintain optimal temperature during transit. During extreme weather conditions, we may hold or delay shipments to ensure product quality.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Order Tracking</h2>
            <p>
              Once your order has been shipped, you will receive a confirmation email with a tracking number. You can track your order by:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Clicking the tracking link in your shipping confirmation email</li>
              <li>Logging into your TrueAminos account and viewing your order history</li>
              <li>Contacting our customer service team with your order number</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Shipping Address</h2>
            <p>
              It is the customer's responsibility to provide accurate shipping information. TrueAminos is not responsible for orders shipped to incorrect addresses provided by the customer. If an order is returned to us due to an incorrect address, the customer will be responsible for any reshipping costs.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Lost or Damaged Packages</h2>
            <p>
              If your package appears to be lost or damaged during transit:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>First, check the tracking information to confirm the status of your delivery.</li>
              <li>For packages marked as delivered but not received, please check with neighbors, building management, or other household members.</li>
              <li>If your package is damaged upon arrival, please take photos of the damaged package and products before opening completely.</li>
              <li>Contact our customer service within 48 hours of the delivery date to report any issues.</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Customs, Duties, and Taxes</h2>
            <p>
              For international orders, customers are responsible for all customs fees, duties, and taxes imposed by the destination country. These charges are not included in our shipping costs and will be collected upon delivery. TrueAminos has no control over these charges and cannot predict their amount.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about our shipping policy, please contact our customer service team:
            </p>
            <p className="mt-3">
              <strong>Email:</strong> support@trueaminos.com
            </p>
            <p>
              <strong>Phone:</strong> (800) 123-4567
            </p>
            <p>
              <strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}