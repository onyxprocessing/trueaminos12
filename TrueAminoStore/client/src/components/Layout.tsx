import React, { useState } from 'react'
// Core components needed for initial render
import PageMeta from './PageMeta'
import StructuredData from './StructuredData'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from './CartSidebar'
import SearchOverlay from './SearchOverlay'
import MobileMenu from './MobileMenu'

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
        
        <Footer />
      </div>
      
      {/* UI components that are conditionally rendered */}
      {cartOpen && (
        <CartSidebar isOpen={cartOpen} onClose={toggleCart} />
      )}
      
      {searchOpen && (
        <SearchOverlay isOpen={searchOpen} onClose={toggleSearch} />
      )}
      
      {mobileMenuOpen && (
        <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} />
      )}
    </>
  )
}

export default Layout
