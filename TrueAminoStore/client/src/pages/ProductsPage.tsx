import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import ProductCard from '@/components/ProductCard'
import FDADisclaimer from '@/components/FDADisclaimer'
import { Product } from '@shared/schema'

const ProductsPage: React.FC = () => {
  const [sortOption, setSortOption] = useState<string>('name-asc')
  
  // Fetch all products
  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  })
  
  // Sort products based on selected sort option
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortOption) {
      case 'name-asc':
        return a.name.localeCompare(b.name)
      case 'name-desc':
        return b.name.localeCompare(a.name)
      case 'price-asc':
        return (a.price as unknown as number) - (b.price as unknown as number)
      case 'price-desc':
        return (b.price as unknown as number) - (a.price as unknown as number)
      default:
        return 0
    }
  })
  
  return (
    <Layout
      title="All Products | TrueAminos Research Peptides & SARMs"
      description="Browse our complete collection of research peptides, SARMs, supplements, and accessories. Premium quality compounds for research purposes."
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-heading text-3xl font-bold mb-4">All Products</h1>
        <p className="text-gray-600 mb-8 max-w-3xl">
          Browse our complete collection of premium research peptides, SARMs, supplements, and accessories. 
          All products are for research purposes only.
        </p>
        
        <div className="flex flex-col gap-4">
          {/* Sort Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center">
            <h2 className="font-heading font-semibold text-lg mb-2 sm:mb-0">All Products</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Sort By:</span>
              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="border border-gray-300 rounded-md py-1 px-2 text-sm"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="price-asc">Price (Low to High)</option>
                <option value="price-desc">Price (High to Low)</option>
              </select>
            </div>
          </div>
          
          {/* Products Grid */}
          <div>
            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Loading state */}
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="h-48 bg-gray-200 animate-pulse" />
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/4" />
                      <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse mb-4" />
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
                        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedProducts.length > 0 ? (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  Showing {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500">
                  No products are currently available. Please check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <FDADisclaimer variant="box" />
    </Layout>
  )
}

export default ProductsPage
