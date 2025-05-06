import React from 'react'
import Layout from '@/components/Layout'
import PageMeta from '@/components/PageMeta'

export default function ReturnPolicyPage() {
  return (
    <>
      <PageMeta
        title="Return Policy | TrueAminos"
        description="Return and refund information for TrueAminos products. Learn about our return process, eligible items, and refund timeframes."
        keywords="return policy, TrueAminos returns, refund policy, product returns"
        canonicalPath="/return-policy"
        type="website"
      />
      
      <Layout title="Return Policy">
        <div className="container px-6 md:px-8 mx-auto max-w-3xl py-12">
          <h1 className="text-3xl font-bold mb-6">Return & Refund Policy</h1>
          
          <div className="prose prose-blue max-w-none">
            <p className="text-lg text-gray-700 mb-6">
              Last Updated: May 6, 2025
            </p>
            
            <p>
              At TrueAminos, we stand behind the quality of our products. We want you to be completely satisfied with your purchase. If for any reason you are not satisfied, we offer a straightforward return and refund policy.
            </p>

            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 my-6">
              <p className="font-semibold text-blue-900">30-Day Return Policy</p>
              <p className="text-blue-800 text-sm mt-1">Most unused and unopened products can be returned within 30 days of delivery for a full refund.</p>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Return Eligibility</h2>
            <p>
              To be eligible for a return, your item must meet the following criteria:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>The product must be unused and in the same condition that you received it</li>
              <li>The product must be in its original packaging</li>
              <li>The product must not be opened or the seal must not be broken</li>
              <li>You must have proof of purchase (order number, receipt, or order confirmation email)</li>
              <li>The return must be initiated within 30 days of receiving your order</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Non-Returnable Items</h2>
            <p>
              The following items cannot be returned:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Products that have been opened or used</li>
              <li>Products with broken seals or damaged packaging</li>
              <li>Products marked as final sale or clearance items</li>
              <li>Gift cards</li>
              <li>Temperature-sensitive products that have been exposed to extreme conditions</li>
              <li>Custom or personalized orders</li>
              <li>Digital products or downloads</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Damaged or Defective Items</h2>
            <p>
              If you receive a damaged or defective product:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Contact our customer service team within 48 hours of receiving your order</li>
              <li>Provide photos of the damaged product and packaging</li>
              <li>We will arrange for a replacement or issue a full refund</li>
              <li>You will not be responsible for return shipping costs for damaged or defective items</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Return Process</h2>
            <p>
              To start a return, please follow these steps:
            </p>
            <ol className="list-decimal pl-6 mt-4 mb-4 space-y-2">
              <li>Contact our customer service team at returns@trueaminos.com or call (800) 123-4567</li>
              <li>Provide your order number and the reason for your return</li>
              <li>Our team will review your request and if approved, will provide you with a Return Merchandise Authorization (RMA) number</li>
              <li>Package your return securely in the original packaging if possible</li>
              <li>Include the RMA number on the outside of the package</li>
              <li>Ship your return to the address provided by our customer service team</li>
            </ol>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 my-6">
              <p className="font-semibold text-yellow-900">Important Note</p>
              <p className="text-yellow-800 text-sm mt-1">We recommend using a trackable shipping service for all returns. TrueAminos is not responsible for items lost during return shipping.</p>
            </div>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Return Shipping Costs</h2>
            <p>
              Customers are responsible for return shipping costs unless the return is due to our error (you received an incorrect or defective item). In cases where the return is due to our error, we will provide a prepaid shipping label.
            </p>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Refund Process and Timeline</h2>
            <p>
              Once we receive and inspect your return, we will notify you of the status of your refund:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>If approved, your refund will be processed to the original payment method</li>
              <li>Credit card refunds typically take 5-10 business days to appear on your statement</li>
              <li>Bank transfers may take up to 14 business days</li>
              <li>Store credit is issued immediately upon approval</li>
              <li>The shipping cost of your original order is non-refundable unless the return is due to our error</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Exchanges</h2>
            <p>
              If you would like to exchange an item rather than receive a refund:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Contact our customer service team to request an exchange</li>
              <li>Return your original item following the return process above</li>
              <li>Upon receiving your return, we will ship the replacement item</li>
              <li>If the replacement item costs more than the original, you will be charged the difference</li>
              <li>If the replacement item costs less, you will be refunded the difference</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">International Returns</h2>
            <p>
              For international orders:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>The same return eligibility criteria apply</li>
              <li>Customers are responsible for all shipping costs, duties, and taxes associated with international returns</li>
              <li>Please contact our customer service team for specific instructions for your location</li>
              <li>International return processing may take up to 30 days from receipt of the returned item</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Cancellations</h2>
            <p>
              If you wish to cancel an order:
            </p>
            <ul className="list-disc pl-6 mt-4 mb-4 space-y-2">
              <li>Orders can be cancelled before they are shipped</li>
              <li>Contact our customer service team as soon as possible after placing your order</li>
              <li>If your order has already shipped, you will need to follow the standard return process</li>
            </ul>
            
            <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              If you have any questions about our return policy, please contact our customer service team:
            </p>
            <p className="mt-3">
              <strong>Email:</strong> returns@trueaminos.com
            </p>
            <p>
              <strong>Phone:</strong> (800) 123-4567
            </p>
            <p>
              <strong>Hours:</strong> Monday-Friday, 9:00 AM - 5:00 PM EST
            </p>
            
            <p className="text-sm italic mt-8">
              This Return Policy is subject to change without notice. Any changes will be posted on this page with an updated "Last Updated" date.
            </p>
          </div>
        </div>
      </Layout>
    </>
  );
}