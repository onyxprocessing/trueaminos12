/**
 * Image optimization service
 * This module handles image optimization and caching for better performance
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { Request, Response } from 'express';

// Cache directory for optimized images
const CACHE_DIR = path.resolve(process.cwd(), 'cache', 'images');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Generate a unique cache key for an image URL
 * @param url Image URL
 * @returns Cache key
 */
function generateCacheKey(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex');
}

/**
 * Check if an image is cached
 * @param cacheKey Cache key
 * @returns Path to cached file or null if not cached
 */
function getCachedImage(cacheKey: string): string | null {
  const cachedFilePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);
  
  if (fs.existsSync(cachedFilePath)) {
    return cachedFilePath;
  }
  
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
      return res.status(400).send('Missing image URL');
    }
    
    // Generate cache key for this URL
    const cacheKey = generateCacheKey(imageUrl);
    
    // Check if image is already cached
    const cachedImagePath = getCachedImage(cacheKey);
    
    if (cachedImagePath) {
      // Serve cached image with appropriate headers
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
      res.setHeader('Content-Type', 'image/jpeg');
      return res.sendFile(cachedImagePath);
    }
    
    // Fetch the original image
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Get content type and image buffer
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.buffer();
    
    // Save to cache (optimized version would require image processing library)
    const cachedFilePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);
    fs.writeFileSync(cachedFilePath, buffer);
    
    // Set cache headers and serve the image
    res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 days
    res.setHeader('Content-Type', contentType);
    res.send(buffer);
    
  } catch (error) {
    console.error('Image optimization error:', error);
    res.status(500).send('Error processing image');
  }
}