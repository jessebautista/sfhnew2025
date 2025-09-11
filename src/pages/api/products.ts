import type { APIRoute } from 'astro';
import { fetchPrintfulProducts, transformPrintfulProduct, isPrintfulConfigured } from '../../lib/printful';

// Mock products as fallback
const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Sing for Hope T-Shirt',
    price: 2500,
    description: 'Comfortable cotton t-shirt featuring our signature logo',
    image: '/src/images/singforhope.jpg',
    variants: [
      { id: 'tshirt-s', size: 'S' },
      { id: 'tshirt-m', size: 'M' },
      { id: 'tshirt-l', size: 'L' },
      { id: 'tshirt-xl', size: 'XL' },
    ]
  },
  {
    id: 2,
    name: 'Piano Design Tote Bag',
    price: 1800,
    description: 'Canvas tote bag featuring beautiful piano artwork',
    image: '/src/images/pianos-stock-1.png',
    variants: [
      { id: 'tote-standard', size: 'One Size' }
    ]
  },
  {
    id: 3,
    name: 'Music Note Pin Set',
    price: 1200,
    description: 'Set of enamel pins featuring musical notes and SFH logo',
    image: '/pianos-icon.png',
    variants: [
      { id: 'pins-set', size: 'Set of 3' }
    ]
  },
  {
    id: 4,
    name: 'Harmony Coffee Mug',
    price: 1500,
    description: 'Ceramic mug with inspiring arts quotes',
    image: '/logo.svg',
    variants: [
      { id: 'mug-11oz', size: '11oz' }
    ]
  }
];

export const GET: APIRoute = async () => {
  try {
    // Check if Printful is properly configured
    if (!isPrintfulConfigured()) {
      console.log('Printful not configured, using mock products');
      return new Response(JSON.stringify({
        success: true,
        data: MOCK_PRODUCTS,
        source: 'mock'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fetch real products from Printful
    const printfulProducts = await fetchPrintfulProducts();
    
    if (printfulProducts.length === 0) {
      console.log('No Printful products found, using mock products');
      return new Response(JSON.stringify({
        success: true,
        data: MOCK_PRODUCTS,
        source: 'mock'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Transform Printful products to our format
    const products = printfulProducts.map(transformPrintfulProduct);
    
    return new Response(JSON.stringify({
      success: true,
      data: products,
      source: 'printful'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error in products API:', error);
    
    // Fallback to mock products on error
    return new Response(JSON.stringify({
      success: true,
      data: MOCK_PRODUCTS,
      source: 'mock_fallback',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};