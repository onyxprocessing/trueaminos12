import { 
  type Product, 
  type InsertProduct, 
  type Category, 
  type InsertCategory, 
  type CartItem, 
  type InsertCartItem,
  type CartItemWithProduct
} from "@shared/schema";

import { 
  fetchProducts, 
  fetchProductById, 
  fetchProductBySlug, 
  fetchProductsByCategory, 
  fetchFeaturedProducts, 
  fetchCategories 
} from '@/lib/airtable';

// Session type for storage
type Session = {
  id: string;
  personalInfo?: any;
  shippingInfo?: any;
  checkoutId?: string;
  checkoutStep?: string;
};

// Storage interface
export interface IStorage {
  // Product methods
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductBySlug(slug: string): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;

  // Category methods
  getCategories(): Promise<Category[]>;
  getCategoryById(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;

  // Cart methods
  getCartItems(sessionId: string): Promise<CartItemWithProduct[]>;
  getCartItem(sessionId: string, productId: number, selectedWeight?: string): Promise<CartItem | undefined>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeCartItem(id: number): Promise<boolean>;
  clearCart(sessionId: string): Promise<boolean>;
  
  // Session methods
  getSession(sessionId: string): Promise<Session | undefined>;
}

// Hybrid storage implementation that uses Airtable for products and categories
// and in-memory storage for cart items
export class AirtableMemStorage implements IStorage {
  private cartItems: Map<number, CartItem>;
  private cartItemIdCounter: number;
  private productCache: Map<number, Product>;
  private categoryCache: Map<number, Category>;
  private sessionStore: Map<string, Session>; // Add session storage

  constructor() {
    this.cartItems = new Map();
    this.cartItemIdCounter = 1;
    this.productCache = new Map();
    this.categoryCache = new Map();
    this.sessionStore = new Map();
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    try {
      console.log("Fetching products from Airtable in storage.ts");
      const products = await fetchProducts();
      
      // Update cache
      products.forEach(product => {
        this.productCache.set(product.id, product);
      });
      
      return products;
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  async getProductById(id: number): Promise<Product | undefined> {
    try {
      // Check cache first
      if (this.productCache.has(id)) {
        return this.productCache.get(id);
      }
      
      const product = await fetchProductById(id);
      if (product) {
        this.productCache.set(id, product);
        return product;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      return undefined;
    }
  }

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    try {
      // Check cache
      const cachedProduct = Array.from(this.productCache.values()).find(p => p.slug === slug);
      if (cachedProduct) {
        return cachedProduct;
      }
      
      const product = await fetchProductBySlug(slug);
      if (product) {
        this.productCache.set(product.id, product);
        return product;
      }
      
      return undefined;
    } catch (error) {
      console.error(`Error fetching product with slug ${slug}:`, error);
      return undefined;
    }
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    try {
      const products = await fetchProductsByCategory(categoryId);
      
      // Update cache
      products.forEach(product => {
        this.productCache.set(product.id, product);
      });
      
      return products;
    } catch (error) {
      console.error(`Error fetching products for category ${categoryId}:`, error);
      return [];
    }
  }

  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const products = await fetchFeaturedProducts();
      
      // Update cache
      products.forEach(product => {
        this.productCache.set(product.id, product);
      });
      
      return products;
    } catch (error) {
      console.error("Error fetching featured products:", error);
      return [];
    }
  }

  // This is just a stub since we're not creating products via the API
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = Date.now();
    const newProduct = { ...product, id };
    this.productCache.set(id, newProduct);
    return newProduct;
  }

  // Category methods
  async getCategories(): Promise<Category[]> {
    try {
      const categories = await fetchCategories();
      
      // Update cache
      categories.forEach(category => {
        this.categoryCache.set(category.id, category);
      });
      
      return categories;
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    // Check cache first
    if (this.categoryCache.has(id)) {
      return this.categoryCache.get(id);
    }
    
    // Load all categories to find this one
    const categories = await this.getCategories();
    const category = categories.find(c => c.id === id);
    
    return category;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    // Check cache
    const cachedCategory = Array.from(this.categoryCache.values()).find(c => c.slug === slug);
    if (cachedCategory) {
      return cachedCategory;
    }
    
    // Load all categories to find this one
    const categories = await this.getCategories();
    const category = categories.find(c => c.slug === slug);
    
    return category;
  }

  // This is just a stub since we're not creating categories via the API
  async createCategory(category: InsertCategory): Promise<Category> {
    const id = Date.now();
    const newCategory = { ...category, id };
    this.categoryCache.set(id, newCategory);
    return newCategory;
  }

  // Cart methods - these remain in memory
  async getCartItems(sessionId: string): Promise<CartItemWithProduct[]> {
    const cartItems = Array.from(this.cartItems.values())
      .filter(item => item.sessionId === sessionId);
    
    return Promise.all(
      cartItems.map(async item => {
        const product = await this.getProductById(item.productId);
        return { ...item, product: product! };
      })
    );
  }

  async getCartItem(sessionId: string, productId: number, selectedWeight?: string): Promise<CartItem | undefined> {
    return Array.from(this.cartItems.values())
      .find(item => 
        item.sessionId === sessionId && 
        item.productId === productId && 
        (selectedWeight ? item.selectedWeight === selectedWeight : true)
      );
  }

  async addToCart(cartItem: InsertCartItem): Promise<CartItem> {
    // Ensure cartItem has valid quantity and selectedWeight values
    const validatedCartItem = {
      ...cartItem,
      quantity: cartItem.quantity || 1, // Default to 1 if quantity is undefined
      selectedWeight: cartItem.selectedWeight || null // Default to null if selectedWeight is undefined
    };
    
    // Check if item already exists in cart with the same weight (if specified)
    const existingItem = await this.getCartItem(
      validatedCartItem.sessionId, 
      validatedCartItem.productId, 
      validatedCartItem.selectedWeight
    );
    
    if (existingItem) {
      // Update quantity of existing item
      return this.updateCartItem(existingItem.id, existingItem.quantity + validatedCartItem.quantity) as Promise<CartItem>;
    }
    
    // Add new item to cart
    const id = this.cartItemIdCounter++;
    const newCartItem = { ...validatedCartItem, id } as CartItem;
    this.cartItems.set(id, newCartItem);
    return newCartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem | undefined> {
    const cartItem = this.cartItems.get(id);
    
    if (!cartItem) {
      return undefined;
    }
    
    const updatedCartItem = { ...cartItem, quantity };
    this.cartItems.set(id, updatedCartItem);
    return updatedCartItem;
  }

  async removeCartItem(id: number): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<boolean> {
    const cartItems = Array.from(this.cartItems.values())
      .filter(item => item.sessionId === sessionId);
    
    cartItems.forEach(item => {
      this.cartItems.delete(item.id);
    });
    
    return true;
  }
  
  // Session methods
  async getSession(sessionId: string): Promise<Session | undefined> {
    // We'll use express-session for storage, but provide a fallback 
    // for direct access when working with checkout calculations
    if (this.sessionStore.has(sessionId)) {
      return this.sessionStore.get(sessionId);
    }
    
    // Return basic session data if we don't have it in local store
    return {
      id: sessionId
    };
  }
}

// Export singleton instance
export const storage = new AirtableMemStorage();
