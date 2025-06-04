import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import ProductCard from '@/components/ProductCard'
import FDADisclaimer from '@/components/FDADisclaimer'
import { Product, Category } from '@shared/schema'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const ProductsPage: React.FC = () => {
  const [sortOption, setSortOption] = useState<string>('name-asc')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategories, setSelectedCategories] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState<boolean>(false)
  
  // Fetch all products
  const { 
    data: products = [], 
    isLoading: loadingProducts 
  } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  })
  
  // Fetch categories
  const { 
    data: categories = [], 
    isLoading: loadingCategories 
  } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  })
  
  // Filter products based on search query and selected categories
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Filter by search query
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter by selected categories
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(product.categoryId);
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategories]);
  
  // Sort filtered products based on selected sort option
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
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
    });
  }, [filteredProducts, sortOption])
  
  // Handle category toggle
  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }
  
  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSortOption('name-asc');
  }
  
  // Get category name by ID
  const getCategoryName = (categoryId: number): string => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  }
  
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
          {/* Search Bar and Filter Toggle */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Box */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 py-2 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                  >
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              {/* Filter Toggle Button (Mobile) */}
              <div className="md:hidden">
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>
              
              {/* Sort dropdown (Only on mobile when filters are hidden) */}
              <div className={`md:hidden ${showFilters ? 'hidden' : 'block'}`}>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md py-2 px-2 w-full"
                >
                  <option value="name-asc">Sort: Name (A-Z)</option>
                  <option value="name-desc">Sort: Name (Z-A)</option>
                  <option value="price-asc">Sort: Price (Low to High)</option>
                  <option value="price-desc">Sort: Price (High to Low)</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Applied Filters */}
          {(selectedCategories.length > 0 || searchQuery) && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Active Filters:</span>
                
                {searchQuery && (
                  <Badge variant="outline" className="flex items-center gap-1 py-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                
                {selectedCategories.map(catId => (
                  <Badge key={catId} variant="outline" className="flex items-center gap-1 py-1">
                    {getCategoryName(catId)}
                    <button onClick={() => toggleCategory(catId)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-auto text-xs"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Filters (Desktop) */}
            <div className={`md:block ${showFilters ? 'block' : 'hidden'} md:w-64 bg-white rounded-lg shadow-sm p-4 h-fit`}>
              <h2 className="font-heading font-semibold text-lg mb-4">Filters</h2>
              
              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-gray-700">Categories</h3>
                <div className="space-y-2">
                  {loadingCategories ? (
                    // Loading state for categories
                    Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      </div>
                    ))
                  ) : (
                    categories.map(category => (
                      <div key={category.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleCategory(category.id)}
                        />
                        <Label
                          htmlFor={`category-${category.id}`}
                          className="cursor-pointer text-sm font-medium"
                        >
                          {category.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              {/* Sort options in sidebar on mobile */}
              <div className="mb-6 md:hidden">
                <h3 className="font-semibold mb-3 text-gray-700">Sort By</h3>
                <select 
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="border border-gray-300 rounded-md py-2 px-2 w-full"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="price-asc">Price (Low to High)</option>
                  <option value="price-desc">Price (High to Low)</option>
                </select>
              </div>
              
              {/* Reset all filters button (mobile only) */}
              <div className="md:hidden">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={clearFilters}
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
            
            {/* Products Section */}
            <div className="flex-1">
              {/* Sort Bar (Desktop only) */}
              <div className="hidden md:flex bg-white rounded-lg shadow-sm p-4 mb-4 justify-between items-center">
                <h2 className="font-heading font-semibold text-lg">
                  {searchQuery || selectedCategories.length > 0 
                    ? 'Filtered Results' 
                    : 'All Products'}
                </h2>
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
                      Showing {sortedProducts.length} of {products.length} {products.length === 1 ? 'product' : 'products'}
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
                    <p className="text-gray-500 mb-4">
                      {searchQuery || selectedCategories.length > 0 
                        ? 'Try adjusting your filters or search terms.' 
                        : 'No products are currently available. Please check back later.'}
                    </p>
                    {(searchQuery || selectedCategories.length > 0) && (
                      <Button variant="outline" onClick={clearFilters}>
                        Clear All Filters
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <FDADisclaimer variant="box" />
    </Layout>
  )
}

export default ProductsPage
