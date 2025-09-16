// Printful API integration
const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = import.meta.env.PRINTFUL_API_KEY;
// Prefer numeric env var; otherwise lock to SFH 2025 Headless store
const RAW_STORE_ID = import.meta.env.PRINTFUL_STORE_ID as string | undefined;
const PRINTFUL_STORE_ID = (RAW_STORE_ID && /^\d+$/.test(RAW_STORE_ID)) ? RAW_STORE_ID : '16815860';
console.log('[Printful] Using store ID:', PRINTFUL_STORE_ID, 'from', RAW_STORE_ID && /^\d+$/.test(RAW_STORE_ID) ? 'env' : 'default');

export interface PrintfulProduct {
  id: number;
  name: string;
  thumbnail_url: string;
  type: string;
  type_name: string;
}

export interface PrintfulProductDetails {
  id: number;
  name: string;
  description: string;
  thumbnail_url: string;
  price: number;
  variants: PrintfulVariant[];
}

export interface PrintfulVariant {
  id: number;
  name: string;
  size: string;
  color: string;
  price: number;
  availability_status: string;
}

// Internal DTO used by shop UI
export interface StoreProductDTO {
  id: number;
  name: string;
  description: string;
  image: string;
  images?: string[];
  price: number; // base/min variant price in cents
  variants: Array<{
    id: string;
    size?: string;
    color?: string;
    price?: number; // in cents
    availability?: string;
    image?: string;
  }>;
}

// Simple in-memory cache for server runtime
let PRODUCTS_CACHE: { data: StoreProductDTO[]; ts: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const DETAILS_CACHE = new Map<number, { data: StoreProductDTO; ts: number }>();

// Fetch products from Printful store
export async function fetchPrintfulProducts(): Promise<PrintfulProduct[]> {
  try {
    console.log('[Printful] Fetching STORE products only for store:', PRINTFUL_STORE_ID);

    // Store products only (no templates/sync fallbacks)
    const response = await fetch(`${PRINTFUL_API_URL}/store/products`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
        'X-PF-Store-Id': PRINTFUL_STORE_ID,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Printful] Store products API error ${response.status}:`, errorText);
      throw new Error(`Printful Store API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Printful] Store products response received:', Array.isArray(data.result) ? data.result.length : 'n/a');
    return data.result || [];
  } catch (error) {
    console.error('[Printful] Error fetching store products:', error);
    // Return empty array on error to gracefully degrade to mock data
    return [];
  }
}

// Fetch detailed product information
export async function fetchPrintfulProductDetails(productId: number): Promise<PrintfulProductDetails | null> {
  try {
    const response = await fetch(`${PRINTFUL_API_URL}/store/products/${productId}`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
        'X-PF-Store-Id': PRINTFUL_STORE_ID,
      },
    });

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status}`);
    }

    const data = await response.json();
    return data.result || null;
  } catch (error) {
    console.error('Error fetching Printful product details:', error);
    return null;
  }
}

// Transform Printful product to our internal format
export function transformPrintfulProduct(product: PrintfulProduct): any {
  return {
    id: product.id,
    name: product.name,
    price: 2500, // Fallback price in cents - real variants preferred
    description: `High-quality ${product.type_name} from Sing for Hope`,
    image: product.thumbnail_url || '/logo.svg',
    variants: [
      { id: `${product.id}-default`, size: 'One Size' }
    ],
    printful_id: product.id
  };
}

// Check if Printful is configured
export function isPrintfulConfigured(): boolean {
  return !!(PRINTFUL_API_KEY && PRINTFUL_STORE_ID && 
           PRINTFUL_API_KEY !== 'your-printful-api-key' && 
           PRINTFUL_STORE_ID !== 'your-printful-store-id');
}

export function getPrintfulConfig() {
  return {
    storeId: PRINTFUL_STORE_ID,
    hasApiKey: !!PRINTFUL_API_KEY && PRINTFUL_API_KEY !== 'your-printful-api-key',
    configured: isPrintfulConfigured()
  };
}

// High-level: fetch products with variants/prices/mockups and normalize
export async function fetchPrintfulProductsWithDetails(): Promise<StoreProductDTO[]> {
  // Serve from cache when fresh
  if (PRODUCTS_CACHE && Date.now() - PRODUCTS_CACHE.ts < CACHE_TTL_MS) {
    return PRODUCTS_CACHE.data;
  }

  const list = await fetchPrintfulProducts();
  if (!list.length) return [];

  const results: StoreProductDTO[] = [];

  for (const p of list) {
    try {
      const details = await fetchPrintfulProductDetails(p.id);
      if (!details) {
        // Fallback transform
        results.push(transformPrintfulProduct(p));
        continue;
      }

      // Map variants; Printful returns price as string dollars sometimes; normalize to cents
      const variants = (details.variants || []).map((v: any) => ({
        id: String(v.id),
        size: v.size || v.size_name || v.option?.size,
        color: v.color || v.color_code || v.option?.color,
        price: typeof v.price === 'number' ? Math.round(v.price * 100) : Number((v.price || '0').toString().replace(/[^0-9.]/g, '')) * 100 || undefined,
        availability: v.availability_status || v.availability || undefined,
      }));

      const minPriceCents = variants
        .map(v => v.price)
        .filter((n): n is number => typeof n === 'number')
        .sort((a, b) => a - b)[0];

      const dto: StoreProductDTO = {
        id: details.id,
        name: details.name || p.name,
        description: details.description || `High-quality ${p.type_name}`,
        image: details.thumbnail_url || p.thumbnail_url || '/logo.svg',
        price: minPriceCents || 2500,
        variants: variants.length ? variants : [{ id: `${details.id}-default` }]
      };

      results.push(dto);
    } catch (e) {
      console.warn('Failed to enrich product', p.id, e);
      results.push(transformPrintfulProduct(p));
    }
  }

  PRODUCTS_CACHE = { data: results, ts: Date.now() };
  return results;
}

export async function fetchPrintfulProductDTO(productId: number): Promise<StoreProductDTO | null> {
  const cached = DETAILS_CACHE.get(productId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const details = await fetchPrintfulProductDetails(productId);
  if (!details) return null;

  const variants = (details as any).variants || [];
  const normVariants = variants.map((v: any) => {
    // normalize price to cents
    const raw = v.price;
    let priceCents: number | undefined = undefined;
    if (typeof raw === 'number') priceCents = Math.round(raw * 100);
    else if (typeof raw === 'string') {
      const n = Number(raw.replace(/[^0-9.]/g, ''));
      if (!isNaN(n)) priceCents = Math.round(n * 100);
    }
    return {
      id: String(v.id),
      size: v.size || v.size_name || v.option?.size,
      color: v.color || v.color_code || v.option?.color,
      price: priceCents,
      availability: v.availability_status || v.availability,
    };
  });

  const minPrice = normVariants
    .map(v => v.price)
    .filter((p): p is number => typeof p === 'number')
    .sort((a, b) => a - b)[0];

  // try collect extra images if present
  const images: string[] = [];
  const thumb = (details as any).thumbnail_url;
  if (thumb) images.push(thumb);
  const files = (details as any).files || (details as any).images || [];
  for (const f of files) {
    const url = f.preview_url || f.thumbnail_url || f.url;
    if (url && !images.includes(url)) images.push(url);
  }

  const dto: StoreProductDTO = {
    id: details.id,
    name: details.name,
    description: details.description || '',
    image: images[0] || '/logo.svg',
    images: images.length ? images : undefined,
    price: minPrice || 2500,
    variants: normVariants.length ? normVariants : [{ id: `${details.id}-default` }],
  };

  DETAILS_CACHE.set(productId, { data: dto, ts: Date.now() });
  return dto;
}
