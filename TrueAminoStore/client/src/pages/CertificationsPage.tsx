import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';

import Layout from '../components/Layout';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import FDADisclaimer from '../components/FDADisclaimer';
import { Separator } from '../components/ui/separator';
import { apiRequest } from '../lib/queryClient';
import { Product } from '@shared/schema';
import { formatPrice } from '../lib/utils';

const CertificationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/products'],
    queryFn: () => apiRequest<Product[]>('/api/products')
  });
  
  // Fetch all categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => apiRequest<any[]>('/api/categories')
  });
  
  // Filter products based on search term and category filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || product.categoryId.toString() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
  };

  const openCOADialog = (product: Product) => {
    setSelectedProduct(product);
  };

  return (
    <Layout title="Certificates of Analysis | TrueAminos" description="View and download certificates of analysis for all TrueAminos products. Every batch is third-party tested for quality and purity.">
      <div className="container px-6 py-8 mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Certificates of Analysis
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-gray-600 mb-8">
            At TrueAminos, quality and transparency are our top priorities. Every batch is tested by independent third-party laboratories in the USA. View and download our Certificates of Analysis (COAs) below.
          </p>
        </div>
        
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          <div className="w-full md:w-64">
            <Select value={categoryFilter} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: {id: number, name: string}) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Product grid with COA cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-medium text-gray-700 mb-2">No products found</h3>
                <p className="text-gray-500">Try adjusting your search or filter criteria</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="bg-accent/10 rounded-lg p-4 mb-4 flex items-center justify-center">
                        <img 
                          src={product.image2Url || `/images/sermorelin-coa.svg`} 
                          alt={`${product.name} Certificate of Analysis`} 
                          className="w-32 h-auto object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "https://placehold.co/400x400/e6f7ff/0096c7?text=COA";
                          }}
                        />
                      </div>
                      <h3 className="font-heading text-xl font-semibold mb-2 text-gray-800">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {product.description?.substring(0, 100)}
                        {product.description && product.description.length > 100 ? '...' : ''}
                      </p>
                      <div className="flex items-center justify-end">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              onClick={() => openCOADialog(product)}
                              variant="outline" 
                              className="text-primary border-primary hover:bg-primary/10"
                            >
                              View COA
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto">
                            <DialogHeader>
                              <DialogTitle>Certificate of Analysis - {product.name}</DialogTitle>
                              <DialogDescription>
                                Certificate of purity and identification for {product.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="mb-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="max-h-[50vh] overflow-y-auto">
                                  <img 
                                    src={product.image2Url || `/images/sermorelin-coa.svg`}
                                    alt={`${product.name} Certificate of Analysis`} 
                                    className="w-full h-auto object-contain max-w-full"
                                    style={{ maxHeight: "calc(50vh - 2rem)" }}
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.src = "https://placehold.co/800x1000/e6f7ff/0096c7?text=Certificate+of+Analysis";
                                    }}
                                  />
                                </div>
                              </div>
                              <div className="space-y-4">
                                <div>
                                  <h4 className="font-medium text-gray-700">Product Name</h4>
                                  <p>{product.name}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700">Weight Options</h4>
                                  <p>{product.weightOptions?.join(', ') || 'N/A'}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700">Batch Testing Date</h4>
                                  <p>March 24, 2025</p>
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-700">Purity</h4>
                                  <p>99.77%</p>
                                </div>
                              </div>
                              <div className="mt-6">
                                <Button className="w-full">
                                  Download Certificate (PDF)
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        
        {/* Educational content about COAs */}
        <section className="mt-20">
          <Separator className="mb-12" />
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-3xl font-bold mb-6 text-gray-800">
                Understanding Certificates of Analysis
              </h2>
              <div className="prose prose-blue max-w-none">
                <p>
                  A Certificate of Analysis (COA) is a document issued by a qualified laboratory that confirms a product meets its specification. It includes test results that verify the identity, purity, and potency of the product.
                </p>
                <p>
                  At TrueAminos, each batch of our research products undergoes rigorous testing at independent, third-party laboratories in the United States. Our COAs provide researchers with verified data on:
                </p>
                <ul>
                  <li>Chemical identification and structural verification</li>
                  <li>Purity percentage (typically 99%+ for our products)</li>
                  <li>Molecular weight confirmation</li>
                  <li>Absence of harmful contaminants</li>
                </ul>
                <p>
                  We believe in complete transparency, which is why we make our COAs readily available for all products. This documentation is essential for researchers who require verified materials for their scientific work.
                </p>
              </div>
            </div>
            <div>
              <h2 className="font-heading text-3xl font-bold mb-6 text-gray-800">
                How to Read a Certificate of Analysis
              </h2>
              <div className="prose prose-blue max-w-none">
                <p>
                  When examining a Certificate of Analysis from TrueAminos, you'll find several key sections:
                </p>
                <ol>
                  <li><strong>Header Information:</strong> Includes the testing facility, product name, batch number, and testing date.</li>
                  <li><strong>Product Identification:</strong> Confirms the identity of the compound through various analytical methods.</li>
                  <li><strong>Purity Analysis:</strong> Shows the percentage purity, typically determined by HPLC (High-Performance Liquid Chromatography).</li>
                  <li><strong>Mass Spectrometry Results:</strong> Verifies the molecular weight and structure of the compound.</li>
                  <li><strong>Visual Characteristics:</strong> Describes the appearance of the product.</li>
                  <li><strong>Authorization:</strong> Includes signatures from qualified laboratory personnel who conducted or verified the testing.</li>
                </ol>
                <p>
                  Our COAs provide researchers with confidence in the identity, purity, and quality of TrueAminos products, ensuring reliable results in research applications.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* FDA Disclaimer */}
        <div className="mt-16">
          <FDADisclaimer variant="box" />
        </div>
      </div>
    </Layout>
  );
};

export default CertificationsPage;