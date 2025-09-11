// API route for creating Stripe checkout sessions
import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Server-side product catalog with authorized prices
const AUTHORIZED_PRODUCTS = {
  'piano-tshirt-basic': {
    name: 'Sing for Hope Piano T-Shirt',
    price: 2500, // $25.00 in cents
    image: '/images/products/piano-tshirt.jpg',
  },
  'piano-hoodie': {
    name: 'Sing for Hope Piano Hoodie',
    price: 4500, // $45.00 in cents
    image: '/images/products/piano-hoodie.jpg',
  },
  // Add more authorized products as needed
} as const;

type ProductId = keyof typeof AUTHORIZED_PRODUCTS;

interface CartItem {
  productId: ProductId;
  quantity: number;
}

interface CheckoutRequest {
  items: CartItem[];
  successUrl: string;
  cancelUrl: string;
}

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Origin validation
function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    'https://singforhope.org', 
    'https://www.singforhope.org',
    'http://localhost:4321', // Development only
  ];
  return origin ? allowedOrigins.includes(origin) : false;
}

// Input validation
function validateCheckoutRequest(data: any): data is CheckoutRequest {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.items)) return false;
  if (typeof data.successUrl !== 'string' || typeof data.cancelUrl !== 'string') return false;
  
  return data.items.every((item: any) => 
    typeof item.productId === 'string' &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    item.quantity <= 10 &&
    item.productId in AUTHORIZED_PRODUCTS
  );
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate origin for CSRF protection
    if (!validateOrigin(request)) {
      return new Response(JSON.stringify({ error: 'Invalid origin' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestData = await request.json();
    
    // Validate input
    if (!validateCheckoutRequest(requestData)) {
      return new Response(JSON.stringify({ error: 'Invalid request data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { items, successUrl, cancelUrl } = requestData;

    // Create line items from server-side product catalog
    const lineItems = items.map(item => {
      const product = AUTHORIZED_PRODUCTS[item.productId];
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: product.price, // Use server-side price, not client-provided
        },
        quantity: item.quantity,
      };
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      billing_address_collection: 'required',
      metadata: {
        order_type: 'shop_purchase',
        // Add any other metadata needed for Printful integration
      },
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
