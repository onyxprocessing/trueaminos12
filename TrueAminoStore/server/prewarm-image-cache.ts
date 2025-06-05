// Pre-warm the image cache for all product images by requesting the image-proxy endpoint for each image and size.
import fetch from 'node-fetch';
import path from 'path';
import { fetchProducts } from '../client/src/lib/airtable';

const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:5173'; // Adjust if your server runs on a different port
const SIZES = [1600, 240]; // Detail and thumbnail sizes

async function prewarmImage(url: string, width: number) {
  if (!url) return;
  // Ensure the URL is proxied
  let proxyUrl = url;
  if (!url.startsWith('/api/image-proxy')) {
    proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  // Add width param
  if (!proxyUrl.includes('width=')) {
    proxyUrl += (proxyUrl.includes('?') ? '&' : '?') + `width=${width}`;
  }
  const fullUrl = SERVER_URL + proxyUrl;
  try {
    const res = await fetch(fullUrl, { method: 'GET' });
    if (res.ok) {
      console.log(`Warmed: ${fullUrl}`);
    } else {
      console.warn(`Failed to warm: ${fullUrl} (${res.status})`);
    }
  } catch (err) {
    console.error(`Error warming: ${fullUrl}`, err);
  }
}

async function main() {
  const products = await fetchProducts();
  const allImages = [];
  for (const product of products) {
    for (const key of ['imageUrl', 'image2Url', 'image3Url']) {
      const url = product[key];
      if (url) {
        for (const width of SIZES) {
          allImages.push({ url, width });
        }
      }
    }
  }
  // Limit concurrency
  const CONCURRENCY = 5;
  let idx = 0;
  async function next() {
    if (idx >= allImages.length) return;
    const { url, width } = allImages[idx++];
    await prewarmImage(url, width);
    await next();
  }
  await Promise.all(Array(CONCURRENCY).fill(0).map(next));
  console.log('Image cache pre-warm complete.');
}

main().catch(err => {
  console.error('Pre-warm script failed:', err);
  process.exit(1);
});
