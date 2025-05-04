/**
 * Image optimization service
 * This module handles image optimization and caching for better performance
 */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

// Create cache directory if it doesn't exist
const CACHE_DIR = path.join(process.cwd(), 'cache', 'images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate a unique cache key for an image URL
 * @param url Image URL
 * @returns Cache key
 */
function generateCacheKey(url: string): string {
  return createHash('md5').update(url).digest('hex');
}

/**
 * Check if an image is cached
 * @param cacheKey Cache key
 * @returns Path to cached file or null if not cached
 */
function getCachedImage(cacheKey: string): string | null {
  const cachePath = path.join(CACHE_DIR, cacheKey);
  
  if (fs.existsSync(cachePath)) {
    return cachePath;
  }
  
  return null;
}

/**
 * Save image to cache
 * @param cacheKey Cache key
 * @param imageBuffer Image data
 */
function saveToCache(cacheKey: string, imageBuffer: Buffer): void {
  const cachePath = path.join(CACHE_DIR, cacheKey);
  fs.writeFileSync(cachePath, imageBuffer);
}

/**
 * Get content type based on file extension
 * @param url Image URL
 * @returns Content type
 */
function getContentType(url: string, defaultType: string = 'image/jpeg'): string {
  const extension = path.extname(url).toLowerCase();
  
  if (extension === '.jpg' || extension === '.jpeg') {
    return 'image/jpeg';
  } else if (extension === '.png') {
    return 'image/png';
  } else if (extension === '.gif') {
    return 'image/gif';
  } else if (extension === '.webp') {
    return 'image/webp';
  } else if (extension === '.svg') {
    return 'image/svg+xml';
  } else {
    return defaultType;
  }
}

/**
 * Optimize and serve image from URL
 * @param req Express request
 * @param res Express response
 */
export async function optimizeAndServeImage(req: Request, res: Response) {
  try {
    const imageUrl = req.query.url as string;
    
    if (!imageUrl) {
      console.error("Image optimizer error: Missing URL parameter");
      return res.status(400).json({ message: "Missing image URL parameter" });
    }
    
    // Remove any potential URL encoding issues
    const decodedUrl = decodeURIComponent(imageUrl);
    console.log(`Optimizing image: ${decodedUrl.substring(0, 100)}...`);
    
    // Generate a cache key for this URL
    const cacheKey = generateCacheKey(decodedUrl);
    
    // Check if we have the image cached
    const cachedImagePath = getCachedImage(cacheKey);
    
    if (cachedImagePath) {
      console.log(`Serving cached image for: ${decodedUrl.substring(0, 50)}...`);
      
      // Get file stats for cache control headers
      const stats = fs.statSync(cachedImagePath);
      const lastModified = stats.mtime.toUTCString();
      
      // Determine content type
      const contentType = getContentType(decodedUrl);
      
      // Set appropriate headers
      res.set({
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Type': contentType,
        'Last-Modified': lastModified,
      });
      
      // Stream the file to the response
      const fileStream = fs.createReadStream(cachedImagePath);
      fileStream.pipe(res);
      return;
    }
    
    // Not cached, fetch from source
    console.log("No cache found, fetching from source");
    
    // Validate URL to ensure it's from trusted sources
    if (!decodedUrl.includes('airtableusercontent.com') &&
        !decodedUrl.includes('trueaminos.com') &&
        !decodedUrl.includes('amazonaws.com')) {
      console.error("Image optimizer error: Invalid source domain");
      return res.status(403).json({ message: "Invalid image source domain" });
    }
    
    // Fetch the image
    const fetchResponse = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'TrueAminoStore/1.0 Image Optimizer',
        'Accept': 'image/jpeg,image/png,image/webp,image/*,*/*'
      },
    });
    
    if (!fetchResponse.ok) {
      console.error(`Image fetch failed with status: ${fetchResponse.status} - ${fetchResponse.statusText}`);
      return res.status(fetchResponse.status).json({ 
        message: `Failed to fetch image: ${fetchResponse.statusText}` 
      });
    }
    
    // Get the image data
    const imageBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // Save to cache
    console.log(`Saving image to cache: ${cacheKey}`);
    saveToCache(cacheKey, buffer);
    
    // Get content type from response or use a default
    const contentType = fetchResponse.headers.get('content-type') || getContentType(decodedUrl);
    
    // Set appropriate headers
    res.set({
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'Content-Type': contentType,
    });
    
    // Send the image data
    res.send(buffer);
    console.log("Image optimized and served successfully");
    
  } catch (error) {
    console.error("Image optimization error:", error);
    res.status(500).json({ message: "Failed to optimize image" });
  }
}