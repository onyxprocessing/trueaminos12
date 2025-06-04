import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const AirtableSetupInstructions: React.FC = () => {
  return (
    <Card className="max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle className="text-2xl">Airtable Setup Instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">Base Configuration</h3>
          <p className="mb-2">
            TrueAminos.com uses Airtable to manage product data. The base should include the following tables:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Products (tbl4pJbIUvWA53Arr) - Main product table</li>
            <li>Categories - Product categories table</li>
          </ul>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Products Table Fields</h3>
          <p className="mb-2">The Products table should include the following fields:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">Field Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">id</td>
                  <td className="border border-gray-200 px-4 py-2">Number</td>
                  <td className="border border-gray-200 px-4 py-2">Unique identifier for the product</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">name</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">Product name</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">description</td>
                  <td className="border border-gray-200 px-4 py-2">Long Text</td>
                  <td className="border border-gray-200 px-4 py-2">Detailed product description</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">price</td>
                  <td className="border border-gray-200 px-4 py-2">Number</td>
                  <td className="border border-gray-200 px-4 py-2">Product price in USD</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">categoryId</td>
                  <td className="border border-gray-200 px-4 py-2">Number</td>
                  <td className="border border-gray-200 px-4 py-2">Foreign key to Categories table</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">imageUrl</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">URL to product image (optional)</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">slug</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">URL-friendly version of product name</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">inStock</td>
                  <td className="border border-gray-200 px-4 py-2">Checkbox</td>
                  <td className="border border-gray-200 px-4 py-2">Availability status</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">featured</td>
                  <td className="border border-gray-200 px-4 py-2">Checkbox</td>
                  <td className="border border-gray-200 px-4 py-2">Whether to display on homepage</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Categories Table Fields</h3>
          <p className="mb-2">The Categories table should include the following fields:</p>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-200 px-4 py-2 text-left">Field Name</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Type</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">id</td>
                  <td className="border border-gray-200 px-4 py-2">Number</td>
                  <td className="border border-gray-200 px-4 py-2">Unique identifier for the category</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">name</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">Category name</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">slug</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">URL-friendly version of category name</td>
                </tr>
                <tr>
                  <td className="border border-gray-200 px-4 py-2">imageUrl</td>
                  <td className="border border-gray-200 px-4 py-2">Text</td>
                  <td className="border border-gray-200 px-4 py-2">URL to category image (optional)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Predefined Categories</h3>
          <p className="mb-2">The following categories should be added to the Categories table:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Peptides (id: 1, slug: peptides)</li>
            <li>SARMs (id: 2, slug: sarms)</li>
            <li>Supplements (id: 3, slug: supplements)</li>
            <li>Accessories (id: 4, slug: accessories)</li>
          </ul>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Sample Product Data</h3>
          <p className="mb-2">Example products that should be added to the Products table:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>BPC-157 (5mg) - Peptides category</li>
            <li>NAD+ (500mg) - Supplements category</li>
            <li>MK-677 (30mL Dropper) - SARMs category</li>
            <li>Sermorelin (5mg) - Peptides category</li>
            <li>Bacteriostatic Water - Accessories category</li>
            <li>RAD-140 Capsules - SARMs category</li>
            <li>GLP-1 (5mg) - Peptides category</li>
            <li>Methylene Blue - Supplements category</li>
          </ul>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold mb-2">API Key Configuration</h3>
          <p>
            The application is configured to use the following Airtable credentials:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>API Key: patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d</li>
            <li>Base ID: app3XDDBbU0ZZDBiY</li>
            <li>Products Table ID: tbl4pJbIUvWA53Arr</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

export default AirtableSetupInstructions
