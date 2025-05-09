import React, { useState, useEffect } from 'react'
import { Link } from 'wouter'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Product } from '@shared/schema'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import { formatPrice, truncateText } from '@/lib/utils'
import { ChevronDown, Minus, Plus } from 'lucide-react'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem } = useCart()
  const { toast } = useToast()
  const [selectedWeight, setSelectedWeight] = useState('')
  const [quantity, setQuantity] = useState(1)
  
  // Helper function to sort weight options with numeric extraction
  const sortWeights = (weights: string[]) => {
    return [...weights].sort((a, b) => {
      // Extract numeric value from weight (e.g., "5mg" -> 5)
      const getNumericValue = (weight: string) => {
        const match = weight.match(/(\d+)/)
        return match ? parseInt(match[0], 10) : 999 // Default high value if no number found
      }
      return getNumericValue(a) - getNumericValue(b)
    })
  }
  
  // Find the lowest weight option or specific defaults by product on component mount
  useEffect(() => {
    // Special handling for NAD+ product (id: 2)
    if (product.id === 2 && product.name === "NAD+") {
      // For NAD+, we want to default to 100mg if it's available
      if (product.weightOptions?.includes("100mg")) {
        console.log("Setting NAD+ default weight to 100mg");
        setSelectedWeight("100mg");
        return;
      }
    }
    
    if (product.weightOptions?.length) {
      const sortedWeights = sortWeights(product.weightOptions)
      setSelectedWeight(sortedWeights[0]) // Set to the smallest weight option
    } else {
      setSelectedWeight('5mg') // Default fallback
    }
  }, [product.id, product.name, product.weightOptions])
  
  const getBadgeVariant = (categoryId: number): "peptides" | "sarms" | "supplements" | "accessories" => {
    // This mapping should match your actual category IDs
    switch (categoryId) {
      case 1: return "peptides"
      case 2: return "sarms"
      case 3: return "supplements"
      case 4: return "accessories"
      default: return "peptides"
    }
  }
  
  const getCategoryName = (categoryId: number): string => {
    // This mapping should match your actual category IDs and names
    switch (categoryId) {
      case 1: return "Peptides"
      case 2: return "SARMs"
      case 3: return "Supplements"
      case 4: return "Accessories"
      default: return "Other"
    }
  }
  
  const handleAddToCart = () => {
    const price = getCurrentPrice();
    console.log(`Adding to cart with price: ${price} for weight: ${selectedWeight}`);
    
    addItem({
      productId: product.id,
      quantity: quantity,
      selectedWeight: selectedWeight
    })
    
    // Toast notification removed as requested
  }

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1)
  }

  const decreaseQuantity = () => {
    setQuantity(prev => prev > 1 ? prev - 1 : 1)
  }
  
  // Get current price based on selected weight
  const getCurrentPrice = () => {
    // If no weight is selected yet, return default price
    if (!selectedWeight) {
      return parseFloat(product.price || "0");
    }
    
    // Special handling for NAD+ product to ensure it has correct prices for all weight options
    if (product.id === 2 && product.name === "NAD+") {
      if (selectedWeight === "100mg") {
        // Explicitly handle 100mg price for NAD+
        // Either use the stored price100mg value or fallback to 190
        const price = product.price100mg ? parseFloat(product.price100mg) : 190;
        console.log(`NAD+ 100mg price: ${price} (from ${product.price100mg || 'fallback 190'})`);
        return price;
      } 
      else if (selectedWeight === "500mg") {
        // Explicitly handle 500mg price for NAD+
        // Either use the stored price500mg value or fallback to 750
        const price = product.price500mg ? parseFloat(product.price500mg) : 750;
        console.log(`NAD+ 500mg price: ${price} (from ${product.price500mg || 'fallback 750'})`);
        return price;
      }
    }
    
    // Try to use the dynamic property access first
    const priceKey = `price${selectedWeight}` as keyof typeof product;
    if (product[priceKey]) {
      // If we found a matching price field, use it
      return parseFloat(product[priceKey] as string);
    }
    
    // For other products or other NAD+ weight options, use regular weight-price mapping as fallback
    switch(selectedWeight) {
      case "1mg":
        return product.price1mg ? parseFloat(product.price1mg) : parseFloat(product.price || "0");
      case "2mg":
        return product.price2mg ? parseFloat(product.price2mg) : parseFloat(product.price || "0");
      case "5mg":
        return product.price5mg ? parseFloat(product.price5mg) : parseFloat(product.price || "0");
      case "10mg":
        return product.price10mg ? parseFloat(product.price10mg) : parseFloat(product.price || "0");
      case "15mg":
        return product.price15mg ? parseFloat(product.price15mg) : parseFloat(product.price || "0");
      case "20mg":
        return product.price20mg ? parseFloat(product.price20mg) : parseFloat(product.price || "0");
      case "30mg":
        return product.price30mg ? parseFloat(product.price30mg) : parseFloat(product.price || "0");
      case "100mg":
        return product.price100mg ? parseFloat(product.price100mg) : parseFloat(product.price || "0");
      case "300mg":
        return product.price300mg ? parseFloat(product.price300mg) : parseFloat(product.price || "0");
      case "500mg":
        return product.price500mg ? parseFloat(product.price500mg) : parseFloat(product.price || "0");
      case "600mg":
        return product.price600mg ? parseFloat(product.price600mg) : parseFloat(product.price || "0");
      case "750mg":
        return product.price750mg ? parseFloat(product.price750mg) : parseFloat(product.price || "0");
      case "1500mg":
        return product.price1500mg ? parseFloat(product.price1500mg) : parseFloat(product.price || "0");
      case "5000mg":
        return product.price5000mg ? parseFloat(product.price5000mg) : parseFloat(product.price || "0");
      default:
        // Fallback to generic price if no specific price for the weight
        return parseFloat(product.price || "0");
    }
  }
  
  return (
    <Card className="product-card overflow-hidden h-full transition-all duration-300 hover:shadow-lg flex flex-col">
      {/* Product Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="h-48 sm:h-56 relative overflow-hidden rounded-lg m-3" style={{ backgroundColor: '#FDDB5B', borderRadius: '12px' }}>
          {product.imageUrl ? (
            <div className="w-full h-full" style={{ backgroundColor: '#FDDB5B', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img 
                src={product.imageUrl 
                  ? (product.imageUrl.includes('/api/image-proxy') 
                      ? product.imageUrl + '&usage=thumbnail&width=400' 
                      : `/api/image-proxy?url=${encodeURIComponent(product.imageUrl)}&usage=thumbnail&width=400`)
                  : ''
                } 
                alt={product.name}
                className="w-full h-full object-contain object-center"
                loading="lazy"
                decoding="async"
                width="400"
                height="400"
                style={{
                  aspectRatio: "1/1",
                  maxWidth: "85%", 
                  height: "auto",
                  transform: "scale(0.8)", /* Zoom out the image to 80% of its original size */
                  objectFit: "contain"
                }}
                onError={(e) => {
                  console.error("Product image failed to load:", product.imageUrl);
                  const imgElement = e.target as HTMLImageElement;
                  
                  // Hide the failed image
                  imgElement.style.display = 'none';
                  
                  // Create a more visible placeholder
                  const placeholderDiv = document.createElement('div');
                  placeholderDiv.className = 'w-full h-full flex items-center justify-center bg-gray-100';
                  placeholderDiv.innerHTML = `
                    <div class="text-center p-4">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span class="text-gray-500 text-xs font-medium">${product.name}</span>
                    </div>
                  `;
                  
                  // Insert the placeholder
                  imgElement.parentNode?.appendChild(placeholderDiv);
                }}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-gray-500 text-sm">No image</span>
            </div>
          )}
          
          {/* Category badge overlay */}
          <div className="absolute top-2 left-2">
            <Badge variant={getBadgeVariant(product.categoryId)} className="text-xs font-medium uppercase tracking-wider px-2 py-1">
              {getCategoryName(product.categoryId)}
            </Badge>
          </div>
          
          {/* Out of stock overlay */}
          {!product.inStock && !product.outofstock && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Out of Stock
              </span>
            </div>
          )}
          
          {/* Temporarily out of stock but can still order */}
          {product.outofstock && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
              <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                Temporarily Out of Stock
              </span>
            </div>
          )}
        </div>
      </Link>
      
      {/* Card Content */}
      <div className="p-4 flex flex-col flex-grow bg-white">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-base md:text-lg line-clamp-2 hover:text-primary transition-colors mb-4 text-center">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex flex-col space-y-3">
          {/* Weight & Quantity Controls */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">SELECT WEIGHT</h4>
              <Select
                value={selectedWeight}
                onValueChange={setSelectedWeight}
                disabled={!product.inStock && !product.outofstock}
              >
                <SelectTrigger 
                  className="w-full h-10 border border-gray-200 bg-gray-50 focus:ring-0 focus:ring-offset-0"
                  aria-label={`Select weight for ${product.name}`}
                >
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {product.weightOptions ? 
                      sortWeights(product.weightOptions).map((weight) => (
                        <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                      ))
                      : null
                    }
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">SELECT AMOUNT</h4>
              <div className="flex items-center h-10">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-gray-400 hover:bg-gray-500 text-white rounded-r-none rounded-l-md border-0"
                  onClick={decreaseQuantity}
                  disabled={(!product.inStock && !product.outofstock) || quantity <= 1}
                  aria-label={`Decrease quantity for ${product.name}`}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div 
                  className="h-10 w-full flex items-center justify-center border-t border-b border-gray-300 text-center"
                  aria-live="polite"
                  aria-label={`Current quantity: ${quantity}`}
                  role="status"
                >
                  {quantity}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 bg-blue-900 hover:bg-blue-950 text-white rounded-l-none rounded-r-md border-0"
                  onClick={increaseQuantity}
                  disabled={!product.inStock && !product.outofstock}
                  aria-label={`Increase quantity for ${product.name}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Price & Order More Text */}
          <div className="flex flex-col space-y-0">
            <span className="font-heading font-bold text-xl text-center">
              {formatPrice(getCurrentPrice())}
            </span>
            <span className="text-xs text-center text-gray-600 font-medium">
              ORDER MORE, SAVE MORE
            </span>
          </div>

          {/* Button */}
          <div className="pt-2">
            <Button 
              variant="default"
              className="w-full bg-blue-500 hover:bg-blue-600 text-base font-semibold text-white py-5"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              aria-label={`Add ${product.name} to cart, ${selectedWeight}, quantity ${quantity}`}
            >
              ADD TO CART
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ProductCard
