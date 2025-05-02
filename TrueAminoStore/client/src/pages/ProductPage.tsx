import React, { useState, useEffect } from 'react'
import { useParams } from 'wouter'
import { useQuery } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ProductCard from '@/components/ProductCard'
import FDADisclaimer from '@/components/FDADisclaimer'
import ProductSEO from '@/components/ProductSEO'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/hooks/use-toast'
import { formatPrice } from '@/lib/utils'
import { Product } from '@shared/schema'
import { apiRequest } from '@/lib/queryClient'

// Image gallery component
const ImageGallery: React.FC<{ product: Product }> = ({ product }) => {
  // Define the type for our image objects
  interface ImageObject {
    url: string | null;
    label: string;
    id: string;
  }
  
  const [displayedImage, setDisplayedImage] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Create an array of image objects with labels
  const imageObjects: ImageObject[] = [];
  
  // Add main product image if it exists
  if (product.imageUrl) {
    imageObjects.push({ url: product.imageUrl, label: 'Product', id: 'main' });
  }
  
  // Add Certificate of Analysis if it exists
  if (product.image2Url) {
    imageObjects.push({ url: product.image2Url, label: 'Certificate of Analysis', id: 'coa' });
  } else {
    // Add placeholder for Certificate of Analysis if not available
    imageObjects.push({ url: null, label: 'Certificate of Analysis', id: 'coa-placeholder' });
  }
  
  // Add additional image if it exists
  if (product.image3Url) {
    imageObjects.push({ url: product.image3Url, label: 'Additional Image', id: 'additional' });
  }
  
  // Set initial image on component mount or when image objects change
  useEffect(() => {
    // Find the first available image URL
    const firstImage = imageObjects.find(img => img.url !== null);
    if (firstImage && firstImage.url) {
      setDisplayedImage(firstImage.url);
      setActiveImageIndex(imageObjects.indexOf(firstImage));
    }
  }, [product.id, imageObjects.length]); // Run when product ID changes or when images are loaded
  
  // Function to handle thumbnail clicks
  const handleThumbnailClick = (imageObj: ImageObject, index: number) => {
    if (imageObj.url) {
      console.log(`Showing ${imageObj.label} image at index ${index}`);
      // First update the state
      setActiveImageIndex(index);
      
      // Create a new Image object to preload the image
      const img = new Image();
      img.onload = () => {
        // Once loaded, update the displayed image
        setDisplayedImage(imageObj.url as string);
      };
      img.src = imageObj.url;
    }
  };
  
  return (
    <div className="product-gallery">
      {/* Main Image Display */}
      <div className="main-image bg-white border border-gray-200 rounded-md p-4 mb-4 h-[400px] flex items-center justify-center">
        {displayedImage ? (
          <img 
            key={displayedImage} // Key helps force re-render when image changes
            src={displayedImage}
            alt={imageObjects[activeImageIndex]?.label || product.name}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="bg-gray-100 w-full h-full flex items-center justify-center text-gray-500">
            No image available
          </div>
        )}
      </div>
      
      {/* Thumbnails with Labels */}
      <div className="thumbnails grid grid-cols-4 gap-3">
        {imageObjects.map((image, index) => (
          <div 
            key={image.id}
            className="relative cursor-pointer"
          >
            <div 
              className={`border flex items-center justify-center p-1 h-20 rounded 
                ${activeImageIndex === index ? 'border-blue-500 border-2' : 'border-gray-200'}`}
              onClick={() => handleThumbnailClick(image, index)}
            >
              {image.url ? (
                <img 
                  src={image.url} 
                  alt={image.label} 
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="text-xs text-center text-gray-400 p-2">
                  Not Available
                </div>
              )}
            </div>
            <div className="text-xs text-center mt-1 text-gray-600 truncate" title={image.label}>
              {image.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Certificate of Analysis Notice */}
      {!product.image2Url && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <p className="font-medium">Certificate of Analysis</p>
          <p className="text-xs mt-1">
            Upload a Certificate of Analysis in the Airtable "COA" field to display it here.
          </p>
        </div>
      )}
    </div>
  );
};

// Weight selector component
const WeightSelector: React.FC<{ 
  options: string[], 
  selectedWeight: string, 
  onChange: (weight: string) => void 
}> = ({ options, selectedWeight, onChange }) => {
  return (
    <div className="weight-selector">
      <p className="text-sm font-medium text-gray-700 mb-2">SELECT WEIGHT</p>
      <Select value={selectedWeight} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select weight" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

// Quantity selector component
const QuantitySelector: React.FC<{ 
  quantity: number, 
  onChange: (quantity: number) => void,
  max?: number
}> = ({ quantity, onChange, max = 10 }) => {
  return (
    <div className="quantity-selector">
      <p className="text-sm font-medium text-gray-700 mb-2">SELECT AMOUNT</p>
      <div className="flex items-center">
        <button 
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-100"
          onClick={() => quantity > 1 && onChange(quantity - 1)}
          disabled={quantity <= 1}
          type="button"
        >
          <span className="text-lg">-</span>
        </button>
        <input
          type="number"
          value={quantity}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val) && val > 0 && val <= max) {
              onChange(val);
            }
          }}
          className="w-12 h-10 border-t border-b border-gray-300 text-center"
          min="1"
          max={max}
        />
        <button 
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-100"
          onClick={() => quantity < max && onChange(quantity + 1)}
          disabled={quantity >= max}
          type="button"
        >
          <span className="text-lg">+</span>
        </button>
      </div>
    </div>
  );
};

// Molecular formula component
const MolecularFormula: React.FC<{ formula: string }> = ({ formula }) => {
  // Process formula to add subscripts for numbers
  const formattedFormula = formula.replace(/(\d+)/g, '<sub>$1</sub>');
  
  return (
    <div className="molecular-formula flex items-center space-x-2">
      <span className="font-semibold">Molecular Formula:</span>
      <span dangerouslySetInnerHTML={{ __html: formattedFormula }} />
    </div>
  );
};

function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedWeight, setSelectedWeight] = useState("5mg");
  const [quantity, setQuantity] = useState(1);
  const [weightOptions, setWeightOptions] = useState<string[]>(["5mg", "10mg"]);

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', slug],
    queryFn: () => apiRequest<Product>(`/api/products/${slug}`),
    enabled: !!slug
  });
  
  // Log product data when it changes
  useEffect(() => {
    if (product) {
      console.log("Product data received:", product);
      console.log("Image2Url:", product.image2Url);
      console.log("Image3Url:", product.image3Url);
      console.log("All product images:", {
        main: product.imageUrl,
        coa: product.image2Url,
        additional: product.image3Url
      });
    }
  }, [product]);

  const { data: relatedProducts, isLoading: loadingRelated } = useQuery<Product[]>({
    queryKey: ['/api/products/category', product?.categoryId],
    queryFn: () => apiRequest<Product[]>(`/api/products/category/${product?.categoryId}`),
    enabled: !!product?.categoryId,
  });

  const handleAddToCart = () => {
    if (product) {
      // Log the current price based on selected weight
      const currentPrice = getCurrentPrice();
      console.log(`Adding to cart with price: ${currentPrice} for weight: ${selectedWeight}`);
      
      addItem({
        productId: product.id,
        quantity: quantity,
        selectedWeight: selectedWeight
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Loading...">
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div className="h-[400px] bg-gray-200 rounded" />
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/4" />
                <div className="h-24 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout title="Product Not Found">
        <div className="container py-8">
          <h1 className="text-2xl font-bold mb-6">Product Not Found</h1>
          <p>The product you are looking for does not exist or has been removed.</p>
        </div>
      </Layout>
    );
  }

  // Get weight options and set initial weight only after product data is loaded
  useEffect(() => {
    if (product) {
      // Get weight options from the product data (weights field in Airtable)
      let options = product.weightOptions || ["5mg", "10mg"];
      
      // Special handling for NAD+ product to ensure it always has 100mg and 500mg options
      if (product.id === 2 && product.name === "NAD+") {
        // Make sure both 100mg and 500mg options are included for NAD+
        if (!options.includes("100mg")) {
          options = [...options, "100mg"];
        }
        if (!options.includes("500mg")) {
          options = [...options, "500mg"];
        }
        console.log("Enhanced NAD+ weight options:", options);
      }
      
      // Update the weight options state variable
      setWeightOptions(options);
      
      // Only set weight if we have options
      if (options && options.length > 0) {
        // Define weight priority from smallest to largest
        const weightPriority = ["2mg", "5mg", "10mg", "15mg", "20mg", "100mg", "500mg", "750mg"];
        
        // Find the smallest available weight according to priority
        let selectedOption = options[0]; // Default to first option
        
        // Try to find the smallest weight according to priority
        for (const weight of weightPriority) {
          if (options.includes(weight)) {
            selectedOption = weight;
            break;
          }
        }
        
        console.log(`Setting default weight for ${product.name} to ${selectedOption}`);
        setSelectedWeight(selectedOption);
      }
    }
  }, [product]);
  
  // Get current price based on selected weight
  const getCurrentPrice = () => {
    // If weight-specific price exists, use it
    if (selectedWeight === "5mg" && product.price5mg) {
      return parseFloat(product.price5mg);
    } else if (selectedWeight === "10mg" && product.price10mg) {
      return parseFloat(product.price10mg);
    } else if (selectedWeight === "15mg" && product.price15mg) {
      return parseFloat(product.price15mg);
    } else if (selectedWeight === "20mg" && product.price20mg) {
      return parseFloat(product.price20mg);
    } else if (selectedWeight === "2mg" && product.price2mg) {
      return parseFloat(product.price2mg);
    } else if (selectedWeight === "750mg" && product.price750mg) {
      return parseFloat(product.price750mg);
    } else if (selectedWeight === "100mg" && product.price100mg) {
      return parseFloat(product.price100mg);
    } else if (selectedWeight === "500mg" && product.price500mg) {
      return parseFloat(product.price500mg);
    }
    // Default fallback to the generic price
    return parseFloat(product.price);
  };

  return (
    <React.Fragment>
      {/* Add dedicated SEO meta tags for this product */}
      <ProductSEO product={product} />
      
      <Layout
        title={product.name}
        description={product.description}
      >
        <div className="bg-gray-50 py-4">
          <div className="container px-6 md:px-8 mx-auto max-w-7xl">
            <div className="flex items-center text-sm text-gray-500">
              <span className="text-blue-600 font-medium uppercase">BEST SELLERS, IMMUNE & INFLAMMATORY</span>
            </div>
          </div>
        </div>
        
        <div className="container px-6 md:px-8 mx-auto max-w-7xl py-10">
          <h1 className="text-3xl font-bold mb-8">{product.name}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Product Images */}
            <div>
              <ImageGallery product={product} />
              
              {/* Chemical Formula Card */}
              <div className="mt-6 bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                <div className="mb-2">
                  <MolecularFormula formula="C62H98N16O22" />
                </div>
                <div className="text-sm text-gray-700 mb-2">
                  <span className="font-semibold">Purity:</span> ≥99%
                </div>
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Intended for research purposes only.</span><br />
                  Not for human or veterinary use.
                </div>
              </div>
            </div>
            
            {/* Right Column - Product Info */}
            <div>
              {/* Product description */}
              <div className="mb-8">
                <p className="text-gray-700">{product.description}</p>
              </div>
              
              {/* Product configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <WeightSelector 
                  options={weightOptions}
                  selectedWeight={selectedWeight}
                  onChange={setSelectedWeight}
                />
                
                <QuantitySelector 
                  quantity={quantity}
                  onChange={setQuantity}
                />
              </div>
              
              {/* Price and Add to Cart */}
              <div className="mb-8">
                <div className="flex items-baseline mb-4">
                  <span className="text-2xl font-bold text-gray-900 mr-2">
                    {formatPrice(getCurrentPrice())}
                  </span>
                  <span className="text-sm text-gray-500">ORDER MORE, SAVE MORE</span>
                </div>
                
                <Button 
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  size="lg"
                  className="w-full bg-blue-900 hover:bg-blue-800 text-white"
                >
                  ADD TO CART
                </Button>
              </div>
              
              {/* Free shipping */}
              <div className="flex items-center mb-8 p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="mr-3 text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="8 12 12 16 16 12"></polyline>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                  </svg>
                </div>
                <p className="text-sm">
                  <span className="font-medium">Free Shipping on All Orders $175+</span>
                </p>
              </div>
              
              {/* FDA Notice */}
              <div className="bg-gray-50 p-4 rounded-md border border-l-4 border-l-blue-500 border-gray-200 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0 mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Product Usage: For Research Use Only - Not for Human or Veterinary Use</p>
                    <p className="text-xs mt-1">This product is intended strictly for in vitro research and laboratory experimentation. It is not a drug, food, cosmetic, or dietary supplement and has not been evaluated by the FDA.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Description Tabs */}
          <div className="mt-16 border-t border-gray-200 pt-10">
            <Tabs defaultValue="description" className="w-full">
              <TabsList className="w-full justify-start border-b mb-8">
                <TabsTrigger value="description" className="text-lg">DESCRIPTION</TabsTrigger>
                <TabsTrigger value="details" className="text-lg">TECHNICAL DETAILS</TabsTrigger>
                <TabsTrigger value="research" className="text-lg">RESEARCH USES</TabsTrigger>
              </TabsList>
              
              <TabsContent value="description" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Product Name:</h3>
                  <p>{product.name}</p>
                  
                  <h3 className="font-bold text-xl mt-8">Description:</h3>
                  <p className="text-gray-700">
                    {product.description}
                  </p>
                  
                  <p className="text-gray-700 mt-4">
                    BPC-157 is a synthetic peptide fragment derived from a naturally occurring protein found in gastric juice. It has been studied extensively in laboratory settings for its potential to support tissue regeneration and cell protection. This peptide is supplied in lyophilized powder form to ensure maximum stability during storage.
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Chemical Information:</h3>
                  <ul className="list-disc pl-8 space-y-2">
                    <li><span className="font-medium">Molecular Formula:</span> C<sub>62</sub>H<sub>98</sub>N<sub>16</sub>O<sub>22</sub></li>
                    <li><span className="font-medium">Molecular Weight:</span> 1419.53552 g/mol</li>
                    <li><span className="font-medium">Sequence:</span> Gly-Glu-Pro-Pro-Pro-Gly-Lys-Pro-Ala-Asp-Asp-Ala-Gly-Leu-Val</li>
                  </ul>
                  
                  <h3 className="font-bold text-xl mt-8">Product Specifications:</h3>
                  <ul className="list-disc pl-8 space-y-2">
                    <li><span className="font-medium">Purity:</span> ≥99% (HPLC Certified)</li>
                    <li><span className="font-medium">Appearance:</span> Lyophilized white powder</li>
                    <li><span className="font-medium">Solubility:</span> Soluble in bacteriostatic water</li>
                  </ul>
                  
                  <h3 className="font-bold text-xl mt-8">Storage and Handling:</h3>
                  <ul className="list-disc pl-8 space-y-2">
                    <li>Store the lyophilized powder at -20°C.</li>
                    <li>Once reconstituted, store at 2-8°C and use promptly.</li>
                    <li>Maintain aseptic handling practices to ensure product quality and sterility.</li>
                  </ul>
                </div>
              </TabsContent>
              
              <TabsContent value="research" className="mt-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xl">Research Applications:</h3>
                  <p>BPC-157 is a versatile tool for research, with focus areas that include:</p>
                  <ul className="list-disc pl-8 space-y-2">
                    <li><span className="font-medium">Tissue Regeneration:</span> Examining its effects on cellular repair mechanisms in controlled preclinical models.</li>
                    <li><span className="font-medium">Inflammatory Pathways:</span> Exploration of peptide interactions with cytokines and inflammatory markers.</li>
                    <li><span className="font-medium">Angiogenesis:</span> Investigation of its potential role in promoting new blood vessel formation during wound healing.</li>
                  </ul>
                  
                  <h3 className="font-bold text-xl mt-8">References:</h3>
                  <p>This product has been cited in various research studies, including:</p>
                  <ul className="list-disc pl-8 space-y-2">
                    <li>Sikiric, P., et al. (2003). "BPC-157 and the Healing of Injured Tendons." Journal of Cellular Biology Research.</li>
                    <li>Cheng, Y., et al. (2016). "Anti-Inflammatory Effects of BPC-157 in Preclinical Models." Peptide Research Journal.</li>
                  </ul>
                  
                  <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400">
                    <p className="font-bold">Important Note:</p>
                    <p className="mt-1">BPC-157 is FOR RESEARCH USE ONLY. It is not intended for human or veterinary use. Misuse of this product is strictly prohibited and may violate federal, state, or local laws.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Related Products */}
          {relatedProducts && relatedProducts.length > 1 && (
            <div className="mt-16">
              <h2 className="font-heading font-bold text-2xl mb-6">Related Products</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loadingRelated ? (
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
                ) : (
                  relatedProducts
                    .filter(related => related.id !== product.id)
                    .slice(0, 4)
                    .map(related => (
                      <ProductCard key={related.id} product={related} />
                    ))
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Full-width FDA Disclaimer */}
        <div className="bg-gray-50 py-8 border-t border-gray-200 mt-16">
          <div className="container px-6 md:px-8 mx-auto max-w-7xl">
            <div className="max-w-4xl mx-auto px-4">
              <h3 className="font-bold text-lg mb-4">Product Usage: For Research Use Only - Not for Human or Veterinary Use</h3>
              <p className="text-sm">
                This product is intended strictly for in vitro research and laboratory experimentation by qualified professionals. It is not a drug, food, cosmetic, or dietary supplement and has not been evaluated by the FDA. This product should not be used in the diagnosis, treatment, cure, or prevention of any disease.
              </p>
              <p className="text-sm mt-2">
                The safety information provided here is not comprehensive and is intended for research personnel only. For more information, please consult appropriate safety literature and regulatory guidelines.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    </React.Fragment>
  );
}

export default ProductPage;