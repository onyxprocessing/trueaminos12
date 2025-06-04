import React, { useEffect, useState } from 'react'
import { useLocation } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import ProductCard from '@/components/ProductCard'
import { Product } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

// Helper function to parse query params
const useQueryParams = () => {
  if (typeof window === 'undefined') return {}
  return Object.fromEntries(new URLSearchParams(window.location.search))
}

const SearchPage: React.FC = () => {
  const { q } = useQueryParams()
  const [searchTerm, setSearchTerm] = useState<string>(q || '')
  const [, setLocation] = useLocation()
  
  // Fetch all products
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: () => apiRequest('/api/products')
  })
  
  // Filter products based on search term
  const filteredProducts = products?.filter(product => {
    if (!searchTerm) return true
    
    const term = searchTerm.toLowerCase()
    return (
      product.name.toLowerCase().includes(term) ||
      product.description.toLowerCase().includes(term) ||
      (product.description2 && product.description2.toLowerCase().includes(term))
    )
  })
  
  // Update URL when search term changes
  useEffect(() => {
    if (searchTerm) {
      const url = `/search?q=${encodeURIComponent(searchTerm)}`
      window.history.replaceState({}, '', url)
    }
  }, [searchTerm])
  
  return (
    <Layout title={`Search results for "${searchTerm}" | TrueAminos`}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-4">Search Results</h1>
          <div className="mb-6">
            <input
              type="text"
              className="w-full md:w-1/2 p-3 border border-gray-300 rounded-md"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm && (
            <p className="text-gray-600">
              Showing results for "{searchTerm}"
            </p>
          )}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 h-60 rounded-t-lg mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-red-600">Error loading products. Please try again later.</p>
          </div>
        ) : filteredProducts?.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-heading font-semibold mb-2">No products found</h2>
            <p className="text-gray-600 mb-6">Try adjusting your search term or browse our categories.</p>
            <button 
              onClick={() => setLocation('/products')}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition"
            >
              Browse All Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts?.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default SearchPage