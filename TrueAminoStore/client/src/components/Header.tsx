import React from 'react'
import { Link } from 'wouter'
import { ShoppingCart, Search, Menu, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCart } from '@/hooks/useCart'

interface HeaderProps {
  toggleCart: () => void
  toggleSearch: () => void
  toggleMobileMenu: () => void
}

const Header: React.FC<HeaderProps> = ({ toggleCart, toggleSearch, toggleMobileMenu }) => {
  const { itemCount } = useCart()
  
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <span className="font-heading font-bold text-2xl text-primary">
              True<span className="text-secondary">Aminos</span>
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link href="/" className="font-medium hover:text-primary transition">Home</Link>
            <div className="relative group">
              <a href="#" className="font-medium hover:text-primary transition flex items-center">
                Products
                <ChevronDown className="h-4 w-4 ml-1" />
              </a>
              <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2 px-4">
                  <Link href="/category/peptides" className="block py-2 hover:text-primary">Peptides</Link>
                  <Link href="/category/sarms" className="block py-2 hover:text-primary">SARMs</Link>
                  <Link href="/category/supplements" className="block py-2 hover:text-primary">Supplements</Link>
                  <Link href="/category/accessories" className="block py-2 hover:text-primary">Accessories</Link>
                </div>
              </div>
            </div>
            <Link href="/blog" className="font-medium hover:text-primary transition">Blog</Link>
            <Link href="/about" className="font-medium hover:text-primary transition">About Us</Link>
            <Link href="/contact" className="font-medium hover:text-primary transition">Contact</Link>
          </nav>
          
          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSearch}
              aria-label="Search"
              className="p-1 rounded-full hover:bg-gray-100 transition"
            >
              <Search className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              aria-label="Cart"
              className="p-1 rounded-full hover:bg-gray-100 transition relative"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMobileMenu}
              aria-label="Menu"
              className="md:hidden p-1 rounded-full hover:bg-gray-100 transition"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
