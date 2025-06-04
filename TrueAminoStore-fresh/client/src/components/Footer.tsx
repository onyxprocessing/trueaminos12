import React from 'react'
import { Link } from 'wouter'
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail, Clock } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#212529] text-white pt-12 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="font-heading font-bold text-xl mb-4">TrueAminos</h3>
            <p className="text-gray-400 mb-4">
              Providing high-quality research peptides and SARMs for scientific research purposes.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/profile.php?id=61575847836967" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Facebook className="w-6 h-6" />
              </a>
              <a href="https://www.instagram.com/trueaminosusa_/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Instagram className="w-6 h-6" />
              </a>
              <a href="https://x.com/Trueaminos" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition">
                <Twitter className="w-6 h-6" />
              </a>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/" className="text-gray-400 hover:text-white transition">Home</Link></li>
              <li><Link href="/products" className="text-gray-400 hover:text-white transition">Shop All</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition">Contact</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-white transition">FAQs</Link></li>
            </ul>
          </div>
          
          {/* Categories */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Categories</h3>
            <ul className="space-y-2">
              <li><Link href="/category/peptides" className="text-gray-400 hover:text-white transition">Peptides</Link></li>
              <li><Link href="/category/sarms" className="text-gray-400 hover:text-white transition">SARMs</Link></li>
              <li><Link href="/category/supplements" className="text-gray-400 hover:text-white transition">NAD+ Products</Link></li>
              <li><Link href="/category/accessories" className="text-gray-400 hover:text-white transition">Research Supplies</Link></li>
              <li><Link href="/bundles" className="text-gray-400 hover:text-white transition">Bundles</Link></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-heading font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">342 Cool Springs Blvd, Franklin, TN</span>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">615-812-9999</span>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">info@trueaminos.com</span>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <span className="text-gray-400">Mon-Fri: 9AM-5PM CST</span>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="border-gray-800" />
        
        <div className="flex flex-col md:flex-row justify-between items-center pt-6 mt-6">
          <p className="text-gray-400 text-sm">© {new Date().getFullYear()} TrueAminos. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <Link href="/privacy-policy" className="text-gray-400 hover:text-white text-sm transition">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-gray-400 hover:text-white text-sm transition">Terms of Service</Link>
            <Link href="/shipping-policy" className="text-gray-400 hover:text-white text-sm transition">Shipping Policy</Link>
            <Link href="/return-policy" className="text-gray-400 hover:text-white text-sm transition">Return Policy</Link>
          </div>
        </div>
        
        {/* Trustpilot Review Collector Widget */}
        <div className="mt-6 flex justify-center">
          <div className="trustpilot-widget" data-locale="en-US" data-template-id="56278e9abfbbba0bdcd568bc" data-businessunit-id="68389a012eb7cb9db7b73feb" data-style-height="52px" data-style-width="100%">
            <a href="https://www.trustpilot.com/review/trueaminos.com" target="_blank" rel="noopener">Trustpilot</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
