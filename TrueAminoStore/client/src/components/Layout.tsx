import React, { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import CartSidebar from './CartSidebar'
import SearchOverlay from './SearchOverlay'
import MobileMenu from './MobileMenu'
import { Helmet } from 'react-helmet-async'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "TrueAminos | Research Peptides & SARMs | Franklin, TN",
  description = "TrueAminos offers high-quality research peptides, SARMs, and supplements. Shop BPC-157, NAD+, Sermorelin, GLP1, and more. Free shipping available."
}) => {
  const [cartOpen, setCartOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleCart = () => setCartOpen(!cartOpen)
  const toggleSearch = () => setSearchOpen(!searchOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Helmet>
      
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
      
      <CartSidebar isOpen={cartOpen} onClose={toggleCart} />
      <SearchOverlay isOpen={searchOpen} onClose={toggleSearch} />
      <MobileMenu isOpen={mobileMenuOpen} onClose={toggleMobileMenu} />
    </>
  )
}

export default Layout
