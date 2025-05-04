/**
 * Advanced image optimization service
 * This module handles image optimization, format conversion, and caching for better performance
 * 
 * Features:
 * - WebP conversion for supported browsers
 * - Automatic image resizing based on device needs
 * - Efficient caching with versioned keys
 * - Quality optimization for different image types
 */
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

// Create cache directory if it doesn't exist
const CACHE_DIR = path.join(process.cwd(), 'cache', 'images');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate a unique cache key for an image URL with format and width info
 * @param url Image URL
 * @param format Output format (webp, jpeg, etc)
 * @param width Requested width
 * @returns Cache key
 */
function generateCacheKey(url: string, format: string = 'original', width: number = 0): string {
  // Increment version to v3 to invalidate old cached images with lower quality
  return createHash('md5').update(`${url}-${format}-${width}-v3`).digest('hex');
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
 * Detect if the client supports WebP
 * @param req Express request
 * @returns Boolean indicating WebP support
 */
function supportsWebP(req: Request): boolean {
  const acceptHeader = req.headers.accept || '';
  return acceptHeader.includes('image/webp');
}

/**
 * Detect the optimal image format for the client
 * @param req Express request
 * @returns Best image format to serve
 */
function getBestImageFormat(req: Request): 'webp' | 'jpeg' | 'png' {
  // If client supports WebP and isn't requesting SVG, use WebP for best compression
  if (supportsWebP(req)) {
    return 'webp';
  }
  
  // Fallback to original format determination based on URL
  const url = req.query.url as string;
  if (url) {
    const extension = path.extname(url).toLowerCase();
    if (extension === '.png') {
      return 'png';
    }
  }
  
  // Default to JPEG for best compatibility
  return 'jpeg';
}

/**
 * Determine optimal image width based on request
 * @param req Express request
 * @returns Width in pixels
 */
function getOptimalWidth(req: Request): number | null {
  // Check if width parameter is provided
  const width = req.query.width ? parseInt(req.query.width as string, 10) : null;
  
  // Validate width is reasonable (not too large or small)
  if (width && width > 0 && width <= 2000) {
    return width;
  }
  
  // Default widths for common use cases (increased for better quality)
  if (req.query.usage === 'thumbnail') {
    return 400; // Increased from 300 for better thumbnail quality
  } else if (req.query.usage === 'preview') {
    return 800; // Increased from 600 for clearer preview images
  } else if (req.query.usage === 'detail') {
    return 1600; // Increased from 1200 for higher detail resolution
  }
  
  // No width transformation needed
  return null;
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
    let decodedUrl = decodeURIComponent(imageUrl);
    
    // Determine optimal format and size
    const targetFormat = getBestImageFormat(req);
    const targetWidth = getOptimalWidth(req);
    
    // Generate a unique cache key that includes format and size
    const cacheKey = generateCacheKey(decodedUrl, targetFormat, targetWidth || 0);
    
    // Check if we have the optimized version cached
    const cachedImagePath = getCachedImage(cacheKey);
    
    if (cachedImagePath) {
      // Serve from cache for better performance
      console.log(`Serving cached optimized image: ${targetFormat} w:${targetWidth || 'orig'}`);
      
      // Get file stats for cache control headers
      const stats = fs.statSync(cachedImagePath);
      const lastModified = stats.mtime.toUTCString();
      
      // Set content type based on the target format
      const contentType = targetFormat === 'webp' 
                          ? 'image/webp' 
                          : (targetFormat === 'png' ? 'image/png' : 'image/jpeg');
      
      // Set performance-oriented headers
      res.set({
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Type': contentType,
        'Last-Modified': lastModified,
        'Vary': 'Accept', // Important for CDNs to cache variants correctly
      });
      
      // Stream the optimized file
      const fileStream = fs.createReadStream(cachedImagePath);
      fileStream.pipe(res);
      return;
    }
    
    // Not cached, need to fetch and process
    console.log(`Processing image: ${targetFormat} w:${targetWidth || 'orig'}`);
    
    // Handle URLs that are already proxied
    if (decodedUrl.startsWith('/api/image-proxy')) {
      console.error("Proxy URL detected in image optimizer. This is not supported.");
      return res.status(400).json({ 
        message: "Cannot process nested image proxy URLs. Please provide the original image URL."
      });
    }
    
    // Validate URL to ensure it's from trusted sources
    if (!decodedUrl.includes('airtableusercontent.com') &&
        !decodedUrl.includes('trueaminos.com') &&
        !decodedUrl.includes('amazonaws.com')) {
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
      return res.status(fetchResponse.status).json({ 
        message: `Failed to fetch image: ${fetchResponse.statusText}` 
      });
    }
    
    // Get the image data as buffer
    const imageBuffer = await fetchResponse.arrayBuffer();
    const buffer = Buffer.from(imageBuffer);
    
    // SVG images don't need transformation, serve as-is
    const originalContentType = fetchResponse.headers.get('content-type') || '';
    if (originalContentType.includes('svg')) {
      // Set appropriate headers
      res.set({
        'Cache-Control': 'public, max-age=31536000',
        'Content-Type': originalContentType,
      });
      
      // Cache the SVG
      saveToCache(cacheKey, buffer);
      
      // Send directly
      res.send(buffer);
      return;
    }
    
    // Use Sharp to optimize the image
    let sharpInstance = sharp(buffer);
    
    // Resize if width specified
    if (targetWidth) {
      sharpInstance = sharpInstance.resize({
        width: targetWidth,
        withoutEnlargement: true, // Don't upscale small images
        fit: 'inside'
      });
    }
    
    // Apply format-specific optimizations with higher quality settings
    let optimizedBuffer: Buffer;
    if (targetFormat === 'webp') {
      optimizedBuffer = await sharpInstance.webp({
        quality: 95, // Increased from 85 for better image quality
        effort: 3,   // Lower effort (faster) with higher quality
        lossless: req.query.usage === 'detail' ? true : false // Use lossless for detailed product images
      }).toBuffer();
    } else if (targetFormat === 'png') {
      optimizedBuffer = await sharpInstance.png({
        compressionLevel: 6, // Reduced from 8 for better quality
        quality: 95         // Increased from 90
      }).toBuffer();
    } else {
      // Default to JPEG
      optimizedBuffer = await sharpInstance.jpeg({
        quality: 95,        // Increased from 85
        mozjpeg: true,      // Better JPEG compression
        trellisQuantisation: true // Additional quality improvement
      }).toBuffer();
    }
    
    // Save optimized version to cache
    saveToCache(cacheKey, optimizedBuffer);
    
    // Set the appropriate content type
    const contentType = targetFormat === 'webp' 
                        ? 'image/webp' 
                        : (targetFormat === 'png' ? 'image/png' : 'image/jpeg');
    
    // Set cache headers for best performance
    res.set({
      'Cache-Control': 'public, max-age=31536000',
      'Content-Type': contentType,
      'Vary': 'Accept',
    });
    
    // Send the optimized image
    res.send(optimizedBuffer);
    console.log(`Image optimized successfully: ${targetFormat} w:${targetWidth || 'orig'}`);
    
  } catch (error) {
    console.error("Image optimization error:", error);
    res.status(500).json({ message: "Failed to optimize image" });
  }
}