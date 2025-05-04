import React, { useEffect, useMemo, Suspense, lazy } from 'react'
import { Link } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
// Lazily load non-critical components
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
// Import necessary icons directly to avoid lazy loading issues
import { Shield, CheckCircle, Beaker, Truck, Clock, Phone, Search } from 'lucide-react'
import { Product, Category } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

// Components that can be lazy-loaded
const ProductCard = lazy(() => import('@/components/ProductCard'))
const CategoryCard = lazy(() => import('@/components/CategoryCard'))
const FDADisclaimer = lazy(() => import('@/components/FDADisclaimer'))
const Newsletter = lazy(() => import('@/components/Newsletter'))

// Preload critical assets
const preloadHeroAssets = () => {
  if (typeof window !== 'undefined') {
    // Add font preloading
    const fontLink = document.createElement('link');
    fontLink.rel = 'preload';
    fontLink.as = 'font';
    fontLink.type = 'font/woff2';
    fontLink.href = '/fonts/inter-var.woff2';
    fontLink.crossOrigin = 'anonymous';
    document.head.appendChild(fontLink);
  }
}

const Home: React.FC = () => {
  // Preload critical assets on component mount
  useEffect(() => {
    preloadHeroAssets();
  }, []);
  
  // Fetch featured products with deferred loading
  const { data: rawFeaturedProducts, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['/api/products/featured'],
    queryFn: () => apiRequest<Product[]>('/api/products/featured'),
    staleTime: 60 * 1000, // Cache results for 1 minute
    refetchOnWindowFocus: false, // Don't refetch when window gets focus
    retry: 1, // Lower retry count to avoid multiple attempts
  })
  
  // Process featured products to handle NAD+ special case
  const featuredProducts = useMemo(() => {
    if (!rawFeaturedProducts) return null;
    
    return rawFeaturedProducts.map(product => {
      // Special handling for NAD+ product
      if (product.name === "NAD+" || product.slug === "nad") {
        console.log("Processing NAD+ product for featured display");
        
        // Make sure it has both 100mg and 500mg weight options
        let weightOptions = [...(product.weightOptions || ["5mg", "10mg"])];
        if (!weightOptions.includes("100mg")) {
          weightOptions.push("100mg");
        }
        if (!weightOptions.includes("500mg")) {
          weightOptions.push("500mg");
        }
        
        // Set fixed prices for NAD+ weight options to ensure they're always available
        return {
          ...product,
          price100mg: product.price100mg || "190",
          price500mg: product.price500mg || "750",
          weightOptions
        };
      }
      
      return product;
    });
  }, [rawFeaturedProducts])
  
  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  })
  
  return (
    <Layout>
      {/* Hero Banner */}
      {/* FDA Disclaimer (fixed at top) */}
      <FDADisclaimer 
        variant="banner" 
        className="sticky top-0 left-0 right-0 w-full"
      />
      
      {/* Static Hero Banner Content - Optimized for Fast LCP - No JS Required */}
      <section 
        className="bg-gradient-to-r from-primary to-accent py-16 md:py-24"
      >
        {/* Using dangerouslySetInnerHTML for critical-path HTML */}
        <div 
          className="container px-6 md:px-8 mx-auto max-w-7xl"
          dangerouslySetInnerHTML={{
            __html: `
              <div class="max-w-2xl text-white">
                <h1 
                  class="font-heading font-bold text-4xl md:text-5xl mb-4"
                  style="font-size:clamp(2rem, 5vw, 3rem); font-family:-apple-system, BlinkMacSystemFont, 'Inter', Segoe UI, Arial, sans-serif"
                >
                  Advanced Research Peptides &amp; SARMs
                </h1>
                <p 
                  class="text-lg mb-8"
                >
                  Premium quality compounds for research purposes. Trusted by scientists and researchers nationwide.
                </p>
                <div class="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <a href="/products" class="inline-block">
                    <button 
                      class="bg-secondary text-white hover:bg-secondary/90 px-6 py-3 rounded-md font-medium"
                    >
                      Shop Products
                    </button>
                  </a>
                  <a href="/about" class="inline-block">
                    <button 
                      class="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-md border border-gray-200 font-medium"
                    >
                      About TrueAmino Research
                    </button>
                  </a>
                </div>
              </div>
            `
          }}
        />
      </section>
      
      {/* Trust Banners */}
      <section className="py-3 bg-gray-50 border-y border-gray-200">
        <div className="container px-6 md:px-8 mx-auto max-w-7xl">
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0096c7]">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Made in USA</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffc107]">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Secure Checkout</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0096c7]">
                <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14" />
                <path d="M16.5 9.4 7.55 4.24" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" x2="12" y1="22" y2="12" />
                <circle cx="18.5" cy="15.5" r="2.5" />
                <path d="M20.27 17.27 22 19" />
              </svg>
              <span className="text-xs md:text-sm font-medium">99% Purity Verified</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffc107]">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="M20 8H4" />
                <path d="M8 16h.01" />
                <path d="M12 16h.01" />
                <path d="M16 16h.01" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Free Shipping Over $100</span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0096c7]">
                <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                <path d="M12 8v4l1.5 1.5" />
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
              </svg>
              <span className="text-xs md:text-sm font-medium">Fast 24hr Dispatch</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Featured Products */}
      <section id="featured-products" className="py-12 md:py-20 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container px-6 md:px-8 mx-auto max-w-7xl">
          <h2 className="font-heading font-bold text-3xl mb-4 text-center">Featured Products</h2>
          <p className="text-gray-700 max-w-2xl mx-auto mb-8 text-center">
            Discover our premium selection of research compounds with verified purity
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingProducts ? (
              // Loading state
              Array.from({ length: 4 }).map((_, index) => (
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
            ) : featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No featured products available.</p>
              </div>
            )}
          </div>
          
          <div className="mt-10 text-center">
            <Link href="/products">
              <Button variant="secondary" size="lg" className="px-6 py-3 text-center">
                View All Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* TrueAminos Intro */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-blue-50 to-cyan-100">
        <div className="container px-6 md:px-8 mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            <div className="lg:w-1/2">
              <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-2">WELCOME TO</h2>
              <h3 className="text-3xl md:text-4xl font-heading mb-6">
                <span className="text-[#0096c7]">True</span><span className="text-[#ffc107]">Aminos</span>
              </h3>
              
              <h4 className="text-xl md:text-2xl font-heading font-semibold mb-4">Where Science Meets Excellence—and Research Has No Limits.</h4>
              
              <p className="text-gray-700 mb-6">
                Your research deserves more than the ordinary. It deserves the best. At TrueAminos, 
                we don't just supply peptides—we deliver game-changing quality, unbeatable pricing, 
                and world-class service to fuel the breakthroughs of tomorrow.
              </p>
              
              <p className="text-gray-700 mb-6">
                Tired of me-too suppliers? We're not like them. With 99%+ purity guaranteed, 
                industry-leading compliance, and a customer-first approach, we're setting a 
                new benchmark for peptide excellence. Every peptide, every vial, every time—
                precision you can trust, prices you can count on, and service that stands out.
              </p>
              
              <p className="text-gray-700">
                This is where serious researchers come to win. Step into the future of science 
                with TrueAminos—the partner you've been waiting for.
              </p>
            </div>
            
            <div className="lg:w-1/2 grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md flex items-start border-l-4 border-[#0096c7]">
                <div className="mr-5 bg-[#0096c7] rounded-full p-3 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M12.5 3a7.5 7.5 0 0 0 0 15H16"></path><path d="M11 8h5"></path><path d="M9 12h8"></path><path d="M13 16h2"></path><path d="m22 22-5-5"></path><path d="M17 22v-5h-5"></path></svg>
                </div>
                <div>
                  <h5 className="font-heading font-semibold text-lg mb-2">Purity Tested in the USA</h5>
                  <p className="text-gray-600">HPLC-tested for 99% purity and backed by a detailed COA (Certificate of Analysis)</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md flex items-start border-l-4 border-[#ffc107]">
                <div className="mr-5 bg-[#ffc107] rounded-full p-3 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><circle cx="12" cy="12" r="8"></circle><path d="M3 3 6 6"></path><path d="M21 3 18 6"></path><path d="M3 21 6 18"></path><path d="M21 21 18 18"></path></svg>
                </div>
                <div>
                  <h5 className="font-heading font-semibold text-lg mb-2">Affordable Excellence!</h5>
                  <p className="text-gray-600">Industry-leading pricing and discounts without compromising quality</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md flex items-start border-l-4 border-[#0096c7]">
                <div className="mr-5 bg-[#0096c7] rounded-full p-3 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg>
                </div>
                <div>
                  <h5 className="font-heading font-semibold text-lg mb-2">Fast Shipping, Hassle-Free Returns</h5>
                  <p className="text-gray-600">Free shipping over $100 and full refunds on unopened and opened vials within 30 days*</p>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md flex items-start border-l-4 border-[#ffc107]">
                <div className="mr-5 bg-[#ffc107] rounded-full p-3 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><path d="M18 3a3 3 0 0 0-2.1 5.1L8 16V8l5.9-5.9A3 3 0 0 1 18 3Z"></path><path d="M6 16a2 2 0 1 0 4 0v-4l-4 4Z"></path><path d="M12.1 18.1 16 16l-3.9 3.9A3 3 0 1 1 8 16v-1l2-2 4 4 3-3 .9.9"></path></svg>
                </div>
                <div>
                  <h5 className="font-heading font-semibold text-lg mb-2">Exceptional Support</h5>
                  <p className="text-gray-600">Talk to real experts, get help when needed as you need personalized attention</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Why Choose Us */}
      <section className="py-14 md:py-20 relative overflow-hidden">
        {/* Background graphics */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-300 opacity-20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-500 opacity-10 rounded-full translate-x-1/3 translate-y-1/3"></div>
        <div className="absolute top-1/2 left-3/4 w-40 h-40 bg-blue-300 opacity-15 rounded-full"></div>
        
        <div className="container px-6 md:px-8 mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-14">
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-4 py-1.5 rounded-full inline-block mb-3">Why Researchers Trust Us</span>
            <h2 className="font-heading font-bold text-4xl md:text-5xl mb-4">
              <span className="text-blue-600">True</span><span className="text-yellow-500">Aminos</span> Advantage
            </h2>
            <p className="text-gray-700 text-lg max-w-3xl mx-auto">
              Delivering premium research compounds with unmatched purity, comprehensive documentation, and expert-backed resources for advanced scientific exploration.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-lg border border-blue-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3 text-blue-900">99.9% Purity Guaranteed</h3>
              <p className="text-gray-700">
                Every batch undergoes rigorous HPLC testing and comes with Certificates of Analysis to verify compound identity and purity. Our quality control process ensures reliable research results.
              </p>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <span className="text-blue-600 font-semibold">ISO 9001 Certified Processes</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-yellow-50 p-8 rounded-xl shadow-lg border border-yellow-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Beaker className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3 text-blue-900">Advanced Research Support</h3>
              <p className="text-gray-700">
                Access to comprehensive technical documentation, molecular specifications, and expert consultation from our team of PhD scientists to support your research protocols and methodologies.
              </p>
              <div className="mt-4 pt-4 border-t border-yellow-100">
                <span className="text-yellow-600 font-semibold">Full Molecular Characterization</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl shadow-lg border border-blue-100 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Truck className="h-10 w-10 text-white" />
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3 text-blue-900">Research-Grade Logistics</h3>
              <p className="text-gray-700">
                Temperature-controlled shipping, specialized packaging, and fast delivery ensure compound stability. Free express shipping on all orders over $175 with real-time tracking information.
              </p>
              <div className="mt-4 pt-4 border-t border-blue-100">
                <span className="text-blue-600 font-semibold">Cold-Chain Shipping Available</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center">
            <div className="inline-flex flex-wrap justify-center gap-3 items-center bg-blue-50 py-4 px-6 rounded-xl border border-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">Made in USA</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">Third-Party Tested</span>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium">Research Use Only</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Certificate of Analysis Section */}
      <section className="py-16 md:py-20 bg-white border-t border-b border-gray-100">
        <div className="container px-6 md:px-8 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Left side - COA images */}
            <div className="md:w-5/12 relative">
              <div className="relative w-full max-w-md mx-auto">
                <div className="absolute top-4 left-4 -rotate-6 z-10 w-full border border-gray-200 rounded-md bg-white shadow-sm overflow-hidden">
                  <div className="bg-primary text-white text-center py-2 font-semibold">
                    NAD+ CERTIFICATE OF ANALYSIS
                  </div>
                  <div className="p-4 bg-white">
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">Product Information</div>
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      <div className="text-sm font-medium">Product:</div>
                      <div className="text-sm">NAD+ 10mg</div>
                      <div className="text-sm font-medium">Batch:</div>
                      <div className="text-sm">NAD-20250430-B3</div>
                      <div className="text-sm font-medium">Purity:</div>
                      <div className="text-sm text-green-600 font-semibold">99.8%</div>
                    </div>
                    <div className="w-full h-2 bg-green-100 rounded-full mb-2">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '99.8%' }}></div>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-500">Date: 05/02/2025</div>
                      <div className="text-sm font-bold text-green-600">PASS ✓</div>
                    </div>
                  </div>
                </div>
                <div className="absolute top-6 left-8 rotate-3 z-20 w-full border border-gray-200 rounded-md bg-white shadow-sm overflow-hidden">
                  <div className="bg-amber-400 text-gray-800 text-center py-2 font-semibold">
                    SERMORELIN CERTIFICATE OF ANALYSIS
                  </div>
                  <div className="p-4 bg-white">
                    <div className="text-xs uppercase font-semibold text-gray-500 mb-1">Product Information</div>
                    <div className="grid grid-cols-2 gap-1 mb-3">
                      <div className="text-sm font-medium">Product:</div>
                      <div className="text-sm">Sermorelin 5mg</div>
                      <div className="text-sm font-medium">Batch:</div>
                      <div className="text-sm">SER-20250502-A1</div>
                      <div className="text-sm font-medium">Purity:</div>
                      <div className="text-sm text-green-600 font-semibold">99.2%</div>
                    </div>
                    <div className="w-full h-2 bg-green-100 rounded-full mb-2">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: '99.2%' }}></div>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                      <div className="text-xs text-gray-500">Date: 05/01/2025</div>
                      <div className="text-sm font-bold text-green-600">PASS ✓</div>
                    </div>
                  </div>
                </div>
                <div className="relative z-30 w-full border border-gray-200 rounded-md bg-white shadow-md overflow-hidden">
                  <div className="bg-gradient-to-r from-primary to-primary/80 text-white text-center py-2 font-semibold">
                    CERTIFICATE OF ANALYSIS
                  </div>
                  <div className="p-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-xl font-bold text-gray-800">TrueAminos</div>
                        <div className="text-sm text-gray-500">342 Cool Springs Blvd, Franklin, TN</div>
                      </div>
                      <div className="text-sm font-semibold text-primary border border-primary rounded-full px-3 py-1">
                        Verified
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
                      <div className="text-sm font-medium">Product:</div>
                      <div className="text-sm">BPC-157 2mg</div>
                      <div className="text-sm font-medium">Batch:</div>
                      <div className="text-sm">BPC-20250418-C7</div>
                      <div className="text-sm font-medium">Manufacture Date:</div>
                      <div className="text-sm">April 18, 2025</div>
                      <div className="text-sm font-medium">Expiration:</div>
                      <div className="text-sm">April 18, 2027</div>
                      <div className="text-sm font-medium">Purity (HPLC):</div>
                      <div className="text-sm text-green-600 font-semibold">99.7%</div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-md mb-3">
                      <div className="text-sm font-medium mb-1">Test Results Summary</div>
                      <div className="grid grid-cols-3 text-xs gap-1">
                        <div className="font-semibold">Heavy Metals:</div>
                        <div className="text-center">≤5 ppm</div>
                        <div className="text-right text-green-600">PASS</div>
                        <div className="font-semibold">Microbiological:</div>
                        <div className="text-center">Complies</div>
                        <div className="text-right text-green-600">PASS</div>
                        <div className="font-semibold">Appearance:</div>
                        <div className="text-center">White powder</div>
                        <div className="text-right text-green-600">PASS</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-gray-500">Testing Lab: Analytical Labs LLC</div>
                      <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">RESULT: PASS ✓</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Text content */}
            <div className="md:w-7/12">
              <h2 className="font-heading text-4xl font-bold text-gray-800 mb-6 tracking-tight">
                CERTIFICATE OF ANALYSIS
              </h2>
              
              <p className="text-lg text-gray-700 mb-6">
                At TrueAminos, transparency is key. Every batch is third-party tested in the USA, with Certificates of Analysis (COAs) readily available for verification, giving researchers confidence in their work.
              </p>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">Independent third-party laboratory verification</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">Detailed purity analysis for every batch</span>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="ml-3 text-gray-700">Downloadable documentation for your records</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <Link href="/certifications">
                  <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-md transition-colors">
                    VIEW CERTIFICATIONS
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FDA Disclaimer */}
      <FDADisclaimer variant="box" />
      
      {/* Newsletter */}
      <Newsletter />
    </Layout>
  )
}

export default Home
