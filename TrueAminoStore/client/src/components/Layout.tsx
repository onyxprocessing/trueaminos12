import React, { useState, lazy, Suspense } from 'react'
// Core components needed for initial render
import PageMeta from './PageMeta'
import StructuredData from './StructuredData'

// Eagerly load the Header since it's visible immediately
import Header from './Header'

// Lazy load components that aren't needed for initial render
const Footer = lazy(() => import('./Footer'))
const CartSidebar = lazy(() => import('./CartSidebar'))
const SearchOverlay = lazy(() => import('./SearchOverlay'))
const MobileMenu = lazy(() => import('./MobileMenu'))

// Simple fallback loader for lazy-loaded components
const ComponentLoader = () => <div className="animate-pulse bg-gray-200 h-10"></div>

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  canonicalPath?: string
  type?: 'website' | 'article' | 'product'
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "Research Peptides & SARMs",
  description = "TrueAminos offers premium research peptides, SARMs, and supplements for scientific study. Shop BPC-157, NAD+, Sermorelin, GLP1, and more with guaranteed quality.",
  keywords = "research peptides, SARMs, BPC-157, NAD+, Sermorelin, GLP1, Semax, mk677, rad 140, peptides for sale",
  ogImage = "/social-share.svg",
  canonicalPath = "",
  type = "website"
}) => {
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleCart = () => setCartOpen(!cartOpen)
  const toggleSearch = () => setSearchOpen(!searchOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  
  return (
    <>
      {/* Enhanced SEO meta tags */}
      <PageMeta
        title={title}
        description={description}
        keywords={keywords}
        ogImage={ogImage}
        canonicalPath={canonicalPath}
        type={type}
      />
      
      {/* Structured data for search engines */}
      <StructuredData type={type === 'product' ? 'product' : 'website'} />
      
      <div className="flex flex-col min-h-screen">
        <Header 
          toggleCart={toggleCart} 
          toggleSearch={toggleSearch}
          toggleMobileMenu={toggleMobileMenu}
        />
        
        <main className="flex-grow">
          {children}
        </main>
        
        <Suspense fallback={<ComponentLoader />}>
          <Footer />
        </Suspense>
      </div>
      
      {/* Lazy-load UI components that aren't needed immediately */}
      {cartOpen && (
        <Suspense fallback={<ComponentLoader />}>
          <CartSidebar isOpen={cartOpen} onClose={toggleCart} />
        </Suspense>
      )}
      
      {searchOpen && (
        <Suspense fallback={<ComponentLoader />}>
          <SearchOverlay isOpen={searchOpen} onClose={toggleSearch} />
        </Suspense>
      )}
      
      {mobileMenuOpen && (
        <Suspense fallback={<ComponentLoader />}>
          <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} />
        </Suspense>
      )}
    </>
  )
}

export default Layout
