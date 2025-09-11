// Printful API integration
const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = import.meta.env.PRINTFUL_API_KEY;
const PRINTFUL_STORE_ID = import.meta.env.PRINTFUL_STORE_ID;

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

// Fetch products from Printful store
export async function fetchPrintfulProducts(): Promise<PrintfulProduct[]> {
  try {
    console.log('Fetching products from Printful store:', PRINTFUL_STORE_ID);
    
    // Try store products first
    let response = await fetch(`${PRINTFUL_API_URL}/store/products`, {
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Printful store products API error ${response.status}:`, errorText);
      
      // Try product templates instead
      console.log('Trying product templates endpoint...');
      response = await fetch(`${PRINTFUL_API_URL}/mockup-generator/templates`, {
        headers: {
          'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Product templates also failed, trying sync products...');
        // Try sync products (products synced to external stores)
        response = await fetch(`${PRINTFUL_API_URL}/sync/products`, {
          headers: {
            'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`All Printful endpoints failed. Last error ${response.status}:`, errorText);
      throw new Error(`Printful API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Printful response:', data);
    return data.result || [];
  } catch (error) {
    console.error('Error fetching Printful products:', error);
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
    price: 2500, // Default price in cents - should be fetched from variants
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