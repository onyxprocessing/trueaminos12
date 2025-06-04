import React, { useState } from 'react'
import { useLocation } from 'wouter'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [, navigate] = useLocation()
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`)
      onClose()
    }
  }
  
  return (
    <div className={`search-overlay ${isOpen ? 'open' : ''}`}>
      <div className="container mx-auto px-4 mt-20">
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg">Search Products</h3>
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close search">
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search for products..." 
                className="w-full border border-gray-300 rounded-md py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <Button 
                type="submit" 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-0"
              >
                <Search className="h-5 w-5 text-gray-400" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SearchOverlay
