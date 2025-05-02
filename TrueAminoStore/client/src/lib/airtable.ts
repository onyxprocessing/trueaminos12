import { Product, Category } from "@shared/schema"

// Airtable API key from environment variable
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "patGluqUFquVBabLM.0bfa03c32c10c95942ec14a72b95c7afa9a4910a5ca4c648b22308fa0b86217d"
const AIRTABLE_BASE_ID = "app3XDDBbU0ZZDBiY"
const PRODUCTS_TABLE_ID = "tbl4pJbIUvWA53Arr"
const CATEGORIES_TABLE_ID = "tblCategories" // Assuming we'll create this table

interface AirtableRecord<T> {
  id: string
  fields: T
  createdTime: string
}

interface AirtableResponse<T> {
  records: AirtableRecord<T>[]
  offset?: string
}

// Define the field structure from Airtable
// Define an interface for Airtable attachment thumbnails
interface AirtableThumbnails {
  small: { url: string, width: number, height: number }
  large: { url: string, width: number, height: number }
  full: { url: string, width: number, height: number }
}

// Define an interface for Airtable attachment
interface AirtableImage {
  id: string
  url: string
  filename: string
  size: number
  type: string
  width: number
  height: number
  thumbnails: AirtableThumbnails
}

interface AirtableProductFields {
  name?: string
  description?: string
  description2?: string // Additional detailed description
  price?: number // Generic price (now used as price5mg)
  price5mg?: number // Price specific to 5mg weight
  price10mg?: number // Price specific to 10mg weight
  price15mg?: number // Price specific to 15mg weight
  price20mg?: number // Price specific to 20mg weight
  price2mg?: number // Price specific to 2mg weight (if available)
  price750mg?: number // Price specific to 750mg weight (MK-677)
  price100mg?: number // Price specific to 100mg weight (NAD+)
  price500mg?: number // Price specific to 500mg weight (NAD+)
  categoryId?: number
  image?: AirtableImage[] // Image is an array of attachment objects
  image2?: AirtableImage[] // Certificate of Analysis (old field name)
  COA?: AirtableImage[] // Certificate of Analysis (new field name)
  image3?: AirtableImage[] // Additional product images
  weightOptions?: string[] // Old field - Array of weight options
  weights?: string[] // New field - Multi-select weights field from Airtable
  slug?: string
  inStock?: boolean
  featured?: boolean
  id?: number // Using the ID field from Airtable
}

interface AirtableCategoryFields {
  name?: string
  slug?: string
  image?: string // Changed from imageUrl to image
  id?: number
}

// Generic function to fetch data from Airtable
async function fetchFromAirtable<T>(tableId: string, params: Record<string, string> = {}): Promise<AirtableRecord<T>[]> {
  const queryParams = new URLSearchParams(params)
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableId}?${queryParams.toString()}`
  
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    })
    
    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json() as AirtableResponse<T>
    
    // Examine each record specifically for image fields
    data.records.forEach((record, index) => {
      const fields = record.fields as any;
      if (fields) {
        console.log(`Record ${index} id=${record.id}:`);
        console.log(`  Fields: ${Object.keys(fields).join(', ')}`);
        
        // Specifically check image fields
        if (fields.image) console.log(`  image field exists with ${fields.image.length} items`);
        if (fields.image2) console.log(`  image2 field exists with ${fields.image2.length} items`);
        if (fields.COA) console.log(`  COA field exists with ${fields.COA.length} items`);
        if (fields.image3) console.log(`  image3 field exists with ${fields.image3.length} items`);
      }
    });
    
    return data.records
  } catch (error) {
    console.error("Error fetching from Airtable:", error)
    throw error
  }
}

// Helper function to process weight-specific prices from Airtable record
function processProductPrices(record: AirtableRecord<AirtableProductFields>) {
  // Special handling for NAD+ (id: 2) to manually set 100mg and 500mg prices if needed
  let price100mg = record.fields.price100mg;
  let price500mg = record.fields.price500mg;
  
  // Manual fallback for known products if needed
  if ((record.fields.id === 2 && record.fields.name === "NAD+") || 
      (record.fields.name === "NAD+" || record.fields.slug === "nad")) {
    // If the product is NAD+ and prices aren't set, use these defaults
    if (!price100mg) price100mg = 190; // Example price for NAD+ 100mg
    if (!price500mg) price500mg = 750; // Example price for NAD+ 500mg
    console.log("Applied special pricing for NAD+:", { price100mg, price500mg });
    
    // Make sure weightOptions field includes 100mg and 500mg for NAD+ product
    if (!record.fields.weights) {
      record.fields.weights = ["5mg", "10mg", "100mg", "500mg"];
    } else if (Array.isArray(record.fields.weights)) {
      // Make sure the necessary weights are included
      if (!record.fields.weights.includes("100mg")) {
        record.fields.weights.push("100mg");
      }
      if (!record.fields.weights.includes("500mg")) {
        record.fields.weights.push("500mg");
      }
    }
    console.log("Updated weightOptions for NAD+:", record.fields.weights);
  }
  
  // Debug price fields
  console.log("Price fields for product:", {
    name: record.fields.name,
    price: record.fields.price,
    price5mg: record.fields.price5mg,
    price10mg: record.fields.price10mg,
    price15mg: record.fields.price15mg,
    price20mg: record.fields.price20mg,
    price2mg: record.fields.price2mg,
    price750mg: record.fields.price750mg,
    price100mg: price100mg,
    price500mg: price500mg
  });
  
  return {
    // Use price5mg if available, otherwise fall back to generic price
    price: record.fields.price5mg ? record.fields.price5mg.toString() : 
           record.fields.price ? record.fields.price.toString() : "0",
    // Include all weight-specific prices
    price5mg: record.fields.price5mg ? record.fields.price5mg.toString() : 
             record.fields.price ? record.fields.price.toString() : "0",
    price10mg: record.fields.price10mg ? record.fields.price10mg.toString() : "0",
    price15mg: record.fields.price15mg ? record.fields.price15mg.toString() : "0",
    price20mg: record.fields.price20mg ? record.fields.price20mg.toString() : "0",
    price2mg: record.fields.price2mg ? record.fields.price2mg.toString() : "0",
    price750mg: record.fields.price750mg ? record.fields.price750mg.toString() : "0",
    price100mg: price100mg ? price100mg.toString() : "0",
    price500mg: price500mg ? price500mg.toString() : "0",
  };
}

// Helper function to extract image URL from Airtable image array
function getImageUrlFromAirtable(imageArray?: AirtableImage[]): string | null {
  // Debugging log
  console.log("Processing image array:", imageArray?.length);
  
  if (!imageArray) {
    console.log("Image array is undefined or null");
    return null;
  }
  
  if (imageArray.length === 0) {
    console.log("Image array is empty");
    return null;
  }
  
  // Extract the first image from the array
  const firstImage = imageArray[0];
  
  // Debugging log of the entire image object
  console.log("First image data:", firstImage.id, firstImage.filename);
  
  if (!firstImage) {
    console.log("First image is undefined");
    return null;
  }
  
  let originalUrl: string | null = null;
  
  // Try to get URL from different sources in order of preference
  
  // 1. Direct URL (for Airtable attachments)
  if (typeof firstImage.url === 'string' && firstImage.url.startsWith('http')) {
    console.log("Found direct URL");
    originalUrl = firstImage.url;
  }
  // 2. Check thumbnails - try full size first
  else if (firstImage.thumbnails?.full?.url) {
    console.log("Using full thumbnail URL");
    originalUrl = firstImage.thumbnails.full.url;
  }
  // 3. Then large thumbnail
  else if (firstImage.thumbnails?.large?.url) {
    console.log("Using large thumbnail URL");
    originalUrl = firstImage.thumbnails.large.url;
  }
  // 4. Then small thumbnail as last resort
  else if (firstImage.thumbnails?.small?.url) {
    console.log("Using small thumbnail URL");
    originalUrl = firstImage.thumbnails.small.url;
  }
  // 5. If the image is a string directly
  else if (typeof firstImage === 'string' && (firstImage as string).startsWith('http')) {
    console.log("Image is a direct URL string");
    originalUrl = firstImage as string;
  }
  
  // If we found a URL, proxy it through our server to avoid CORS issues
  if (originalUrl) {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
    console.log("Using proxy URL:", proxyUrl);
    return proxyUrl;
  }
  
  console.log("Could not find a valid image URL");
  return null;
}

// Fetch all products from Airtable
export async function fetchProducts(): Promise<Product[]> {
  try {
    const records = await fetchFromAirtable<AirtableProductFields>(PRODUCTS_TABLE_ID)
    console.log("Fetched products from Airtable:", records.length)
    
    return records.map(record => {
      // Log all fields to see exactly what Airtable is returning
      console.log("RAW RECORD FIELDS:", JSON.stringify(record.fields, null, 2));
      
      console.log("Processing record:", record)
      // Log all price fields
      console.log("Price fields for product:", {
        price: record.fields.price,
        price5mg: record.fields.price5mg,
        price10mg: record.fields.price10mg,
        price15mg: record.fields.price15mg,
        price20mg: record.fields.price20mg,
        price2mg: record.fields.price2mg,
        price750mg: record.fields.price750mg,
        price100mg: record.fields.price100mg,
        price500mg: record.fields.price500mg
      });
      
      return {
        id: record.fields.id || parseInt(record.id),
        name: record.fields.name || "Unnamed Product",
        description: record.fields.description || "No description available",
        description2: record.fields.description2 || "",
        // Use price5mg if available, otherwise fall back to generic price
        price: record.fields.price5mg ? record.fields.price5mg.toString() : 
               record.fields.price ? record.fields.price.toString() : "0",
        // Include all weight-specific prices
        price5mg: record.fields.price5mg ? record.fields.price5mg.toString() : 
                 record.fields.price ? record.fields.price.toString() : "0",
        price10mg: record.fields.price10mg ? record.fields.price10mg.toString() : "0",
        price15mg: record.fields.price15mg ? record.fields.price15mg.toString() : "0",
        price20mg: record.fields.price20mg ? record.fields.price20mg.toString() : "0",
        price2mg: record.fields.price2mg ? record.fields.price2mg.toString() : "0",
        price750mg: record.fields.price750mg ? record.fields.price750mg.toString() : "0",
        price100mg: record.fields.price100mg ? record.fields.price100mg.toString() : "0",
        price500mg: record.fields.price500mg ? record.fields.price500mg.toString() : "0",
        categoryId: record.fields.categoryId || 1,
        imageUrl: getImageUrlFromAirtable(record.fields.image),
        image2Url: record.fields.COA 
          ? getImageUrlFromAirtable(record.fields.COA) 
          : getImageUrlFromAirtable(record.fields.image2),
        image3Url: getImageUrlFromAirtable(record.fields.image3),
        weightOptions: record.fields.weights || record.fields.weightOptions || ["5mg", "10mg"],
        slug: record.fields.slug || `product-${record.id}`,
        inStock: record.fields.inStock !== undefined ? record.fields.inStock : true,
        featured: record.fields.featured || false
      }
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return []
  }
}

// Fetch a single product by ID
export async function fetchProductById(id: number): Promise<Product | null> {
  try {
    const records = await fetchFromAirtable<AirtableProductFields>(
      PRODUCTS_TABLE_ID,
      { filterByFormula: `{id}=${id}` }
    )
    
    if (records.length === 0) {
      return null
    }
    
    const record = records[0]
    // Get price data from helper function
    const priceData = processProductPrices(record);
    
    // Log price fields
    console.log("Price fields for product ID:", id, priceData);
    
    return {
      id: id,
      name: record.fields.name || "Unnamed Product",
      description: record.fields.description || "No description available",
      description2: record.fields.description2 || "",
      ...priceData, // Spread the price data to include all price fields
      categoryId: record.fields.categoryId || 1,
      imageUrl: getImageUrlFromAirtable(record.fields.image),
      image2Url: record.fields.COA 
        ? getImageUrlFromAirtable(record.fields.COA) 
        : getImageUrlFromAirtable(record.fields.image2),
      image3Url: getImageUrlFromAirtable(record.fields.image3),
      weightOptions: record.fields.weights || record.fields.weightOptions || ["5mg", "10mg"],
      slug: record.fields.slug || `product-${record.id}`,
      inStock: record.fields.inStock !== undefined ? record.fields.inStock : true,
      featured: record.fields.featured || false
    }
  } catch (error) {
    console.error(`Error fetching product with ID ${id}:`, error)
    return null
  }
}

// Fetch a single product by slug
export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  try {
    const records = await fetchFromAirtable<AirtableProductFields>(
      PRODUCTS_TABLE_ID,
      { filterByFormula: `{slug}="${slug}"` }
    )
    
    if (records.length === 0) {
      return null
    }
    
    const record = records[0]
    
    // Log the entire raw record for debugging
    console.log("RAW PRODUCT FIELDS FOR SLUG:", slug, JSON.stringify(record.fields, null, 2));
    
    // Log the raw image fields from Airtable
    console.log("Raw Airtable image fields for product:", slug);
    console.log("image field:", record.fields.image);
    console.log("COA field:", record.fields.COA);
    console.log("image2 field:", record.fields.image2);
    console.log("image3 field:", record.fields.image3);
    console.log("weights field:", record.fields.weights);
    console.log("weightOptions field:", record.fields.weightOptions);
    
    // Process the image fields
    const imageUrl = getImageUrlFromAirtable(record.fields.image);
    
    // First try to get Certificate of Analysis from the COA field, if not available use image2
    const image2Url = record.fields.COA 
      ? getImageUrlFromAirtable(record.fields.COA) 
      : getImageUrlFromAirtable(record.fields.image2);
    
    const image3Url = getImageUrlFromAirtable(record.fields.image3);
    
    // Log the processed image URLs
    console.log("Processed image URLs:");
    console.log("imageUrl:", imageUrl);
    console.log("image2Url:", image2Url);
    console.log("image3Url:", image3Url);
    
    // Get price data from helper function
    const priceData = processProductPrices(record);
    
    // Log price fields
    console.log("Price fields for product:", slug, priceData);
    
    // Special handling for weight options, especially for NAD+
    let weightOptions = record.fields.weights || record.fields.weightOptions || ["5mg", "10mg"];
    
    // For NAD+ specifically, always include 100mg and 500mg options
    if (record.fields.name === "NAD+" || slug === "nad") {
      if (!weightOptions.includes("100mg")) {
        weightOptions = [...weightOptions, "100mg"];
      }
      if (!weightOptions.includes("500mg")) {
        weightOptions = [...weightOptions, "500mg"];
      }
      console.log("Enhanced NAD+ weight options:", weightOptions);
    }
    
    return {
      id: record.fields.id || parseInt(record.id),
      name: record.fields.name || "Unnamed Product",
      description: record.fields.description || "No description available",
      description2: record.fields.description2 || "",
      ...priceData, // Spread the price data to include all price fields
      categoryId: record.fields.categoryId || 1,
      imageUrl: imageUrl,
      image2Url: image2Url,
      image3Url: image3Url,
      weightOptions: weightOptions,
      slug: slug,
      inStock: record.fields.inStock !== undefined ? record.fields.inStock : true,
      featured: record.fields.featured || false
    }
  } catch (error) {
    console.error(`Error fetching product with slug ${slug}:`, error)
    return null
  }
}

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  try {
    // Since we don't have an actual categories table yet, return predefined categories
    const predefinedCategories: Category[] = [
      { id: 1, name: "Peptides", slug: "peptides", imageUrl: "" },
      { id: 2, name: "SARMs", slug: "sarms", imageUrl: "" },
      { id: 3, name: "Supplements", slug: "supplements", imageUrl: "" },
      { id: 4, name: "Accessories", slug: "accessories", imageUrl: "" }
    ];
    
    return predefinedCategories;
    
    // Uncomment this when you have a categories table in Airtable
    /* 
    const records = await fetchFromAirtable<AirtableCategoryFields>(CATEGORIES_TABLE_ID)
    
    return records.map(record => ({
      id: record.fields.id || parseInt(record.id),
      name: record.fields.name || "Unnamed Category",
      slug: record.fields.slug || `category-${record.id}`,
      imageUrl: record.fields.image || ""
    }))
    */
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

// Fetch products by category
export async function fetchProductsByCategory(categoryId: number): Promise<Product[]> {
  try {
    const records = await fetchFromAirtable<AirtableProductFields>(
      PRODUCTS_TABLE_ID,
      { filterByFormula: `{categoryId}=${categoryId}` }
    )
    
    return records.map(record => {
      // Get price data from helper function
      const priceData = processProductPrices(record);
      
      return {
        id: record.fields.id || parseInt(record.id),
        name: record.fields.name || "Unnamed Product",
        description: record.fields.description || "No description available",
        description2: record.fields.description2 || "",
        ...priceData, // Spread the price data to include all price fields
        categoryId: categoryId,
        imageUrl: getImageUrlFromAirtable(record.fields.image),
        image2Url: record.fields.COA 
          ? getImageUrlFromAirtable(record.fields.COA) 
          : getImageUrlFromAirtable(record.fields.image2),
        image3Url: getImageUrlFromAirtable(record.fields.image3),
        weightOptions: record.fields.weights || record.fields.weightOptions || ["5mg", "10mg"],
        slug: record.fields.slug || `product-${record.id}`,
        inStock: record.fields.inStock !== undefined ? record.fields.inStock : true,
        featured: record.fields.featured || false
      };
    })
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error)
    return []
  }
}

// Fetch featured products
export async function fetchFeaturedProducts(): Promise<Product[]> {
  try {
    // First try to get products marked as featured
    let records = await fetchFromAirtable<AirtableProductFields>(
      PRODUCTS_TABLE_ID,
      { filterByFormula: `{featured}=TRUE()` }
    )
    
    // If no featured products, show all products
    if (records.length === 0) {
      records = await fetchFromAirtable<AirtableProductFields>(PRODUCTS_TABLE_ID)
    }
    
    return records.map(record => {
      // Get price data from helper function
      const priceData = processProductPrices(record);
      
      // Special handling for weight options, especially for NAD+
      let weightOptions = record.fields.weights || record.fields.weightOptions || ["5mg", "10mg"];
      const slug = record.fields.slug || `product-${record.id}`;
      
      // For NAD+ specifically, always include 100mg and 500mg options
      if (record.fields.name === "NAD+" || slug === "nad") {
        if (!weightOptions.includes("100mg")) {
          weightOptions = [...weightOptions, "100mg"];
        }
        if (!weightOptions.includes("500mg")) {
          weightOptions = [...weightOptions, "500mg"];
        }
        console.log("Enhanced NAD+ weight options in featured products:", weightOptions);
      }
      
      return {
        id: record.fields.id || parseInt(record.id),
        name: record.fields.name || "Unnamed Product",
        description: record.fields.description || "No description available",
        description2: record.fields.description2 || "",
        ...priceData, // Spread the price data to include all price fields
        categoryId: record.fields.categoryId || 1,
        imageUrl: getImageUrlFromAirtable(record.fields.image),
        image2Url: record.fields.COA 
          ? getImageUrlFromAirtable(record.fields.COA) 
          : getImageUrlFromAirtable(record.fields.image2),
        image3Url: getImageUrlFromAirtable(record.fields.image3),
        weightOptions: weightOptions,
        slug: slug,
        inStock: record.fields.inStock !== undefined ? record.fields.inStock : true,
        featured: record.fields.featured || false
      };
    })
  } catch (error) {
    console.error("Error fetching featured products:", error)
    return []
  }
}