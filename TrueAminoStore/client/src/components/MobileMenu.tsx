import React, { useState } from 'react'
import { Link } from 'wouter'
import { X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const [productsOpen, setProductsOpen] = useState(false)
  
  const toggleProducts = () => setProductsOpen(!productsOpen)
  
  const handleLinkClick = () => {
    onClose()
  }
  
  return (
    <div className={`menu-overlay fixed inset-0 bg-white z-50 md:hidden h-full ${isOpen ? 'open' : ''}`}>
      <div className="container mx-auto px-4 py-5">
        <div className="flex justify-between items-center mb-8">
          <span className="font-heading font-bold text-2xl text-primary">
            True<span className="text-secondary">Aminos</span>
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <nav className="flex flex-col space-y-4">
          <a 
            href="/" 
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick();
              window.location.href = '/';
            }}
            className="py-2 font-medium text-lg border-b border-gray-100"
          >
            Home
          </a>
          
          <button 
            className="flex justify-between items-center py-2 font-medium text-lg border-b border-gray-100 w-full"
            onClick={toggleProducts}
          >
            Products
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${productsOpen ? 'transform rotate-180' : ''}`} />
          </button>
          
          <div className={`pl-4 space-y-2 ${productsOpen ? 'block' : 'hidden'}`}>
            <a 
              href="/category/peptides" 
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                window.location.href = '/category/peptides';
              }}
              className="block py-2"
            >
              Peptides
            </a>
            <a 
              href="/category/sarms" 
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                window.location.href = '/category/sarms';
              }}
              className="block py-2"
            >
              SARMs
            </a>
            <a 
              href="/category/supplements" 
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                window.location.href = '/category/supplements';
              }}
              className="block py-2"
            >
              Supplements
            </a>
            <a 
              href="/category/accessories" 
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick();
                window.location.href = '/category/accessories';
              }}
              className="block py-2"
            >
              Accessories
            </a>
          </div>
          
          <a 
            href="/blog" 
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick();
              window.location.href = '/blog';
            }}
            className="py-2 font-medium text-lg border-b border-gray-100"
          >
            Blog
          </a>
          
          <a 
            href="/about" 
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick();
              window.location.href = '/about';
            }}
            className="py-2 font-medium text-lg border-b border-gray-100"
          >
            About Us
          </a>
          
          <a 
            href="/contact" 
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick();
              window.location.href = '/contact';
            }}
            className="py-2 font-medium text-lg border-b border-gray-100"
          >
            Contact
          </a>
        </nav>
      </div>
    </div>
  )
}

export default MobileMenu
