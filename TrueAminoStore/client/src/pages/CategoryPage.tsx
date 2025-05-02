import React, { useEffect } from 'react'
import { useParams } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import ProductCard from '@/components/ProductCard'
import FDADisclaimer from '@/components/FDADisclaimer'
import { Badge } from '@/components/ui/badge'
import { Category, Product } from '@shared/schema'
import { unslugify } from '@/lib/utils'

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>()
  
  // Fetch category data
  const { 
    data: category, 
    isLoading: loadingCategory 
  } = useQuery<Category>({
    queryKey: [`/api/categories/${slug}`],
  })
  
  // Fetch products in this category
  const { 
    data: products, 
    isLoading: loadingProducts 
  } = useQuery<Product[]>({
    queryKey: [`/api/products/category/${category?.id}`],
    enabled: !!category?.id,
  })
  
  return (
    <Layout
      title={`${unslugify(slug)} | TrueAminos Research Peptides & SARMs`}
      description={`Shop premium quality ${unslugify(slug)} for research purposes. High purity compounds with fast shipping at TrueAminos.com.`}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Category Header */}
          <div className="mb-10 text-center">
            <h1 className="font-heading text-3xl md:text-4xl font-bold mb-4">
              {loadingCategory ? (
                <div className="h-10 bg-gray-200 animate-pulse rounded inline-block w-64 mx-auto" />
              ) : (
                category?.name || unslugify(slug)
              )}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {loadingCategory ? (
                <>
                  <div className="h-4 bg-gray-200 animate-pulse rounded mb-2 w-full max-w-2xl mx-auto" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-2/3 max-w-xl mx-auto" />
                </>
              ) : (
                getCategoryDescription(slug)
              )}
            </p>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingProducts ? (
              // Loading state
              Array.from({ length: 8 }).map((_, index) => (
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
              ))
            ) : products?.length > 0 ? (
              products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No products found in this category.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* FDA Disclaimer */}
      <FDADisclaimer variant="box" />
    </Layout>
  )
}

function getCategoryDescription(slug: string): string {
  switch (slug) {
    case 'peptides':
      return 'Our premium research peptides include BPC-157, GLP-1, Semax, and more. All products are for research purposes only, not for human consumption.'
    case 'sarms':
      return 'Explore our high-purity SARMs for research including MK-677, RAD-140, and more. Available in liquid dropper or capsule form.'
    case 'supplements':
      return 'Research-grade supplements including NAD+ products, methylene blue, and other compounds for laboratory use only.'
    case 'accessories':
      return 'Essential research accessories including bacteriostatic water, syringes, and other laboratory supplies for your research needs.'
    default:
      return 'Premium quality research compounds for laboratory use only. Not for human consumption.'
  }
}

export default CategoryPage
