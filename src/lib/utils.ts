import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Locale mapping for currency and date formatting
const LOCALE_MAP: { [key: string]: string } = {
  'en': 'en-US',
  'es': 'es-ES',
  'fr': 'fr-FR',
  'ar': 'ar',
  'zh': 'zh-CN',
};

export function formatPrice(cents: number, locale: string = 'en'): string {
  const localeCode = LOCALE_MAP[locale] || 'en-US';
  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const localeCode = LOCALE_MAP[locale] || 'en-US';
  return new Date(date).toLocaleDateString(localeCode, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Printful API helpers (mock functions for demo)
export async function fetchPrintfulProducts() {
  // In production, this would make actual API calls to Printful
  const mockProducts = [
    {
      id: 1,
      name: 'Sing for Hope T-Shirt',
      price: 2500,
      description: 'Comfortable cotton t-shirt featuring our signature logo',
      image: '/src/images/singforhope.jpg',
      variants: [
        { id: 'tshirt-s', size: 'S', printful_id: 'variant_1' },
        { id: 'tshirt-m', size: 'M', printful_id: 'variant_2' },
        { id: 'tshirt-l', size: 'L', printful_id: 'variant_3' },
        { id: 'tshirt-xl', size: 'XL', printful_id: 'variant_4' },
      ]
    },
    // Add more products...
  ];

  return mockProducts;
}

export async function createPrintfulOrder(orderData: any) {
  // In production, this would create an actual order in Printful
  console.log('Creating Printful order:', orderData);
  
  return {
    id: 'printful_order_123',
    status: 'confirmed',
    tracking_url: 'https://tracking.example.com/123',
  };
}

// Funraise integration helpers
export function initializeFunraise(orgId: string) {
  // Initialize Funraise with organization ID
  if (typeof window !== 'undefined' && window.Funraise) {
    window.Funraise.init({
      orgId,
      // Add additional configuration as needed
    });
  }
}

export function openDonationModal(options: any = {}) {
  if (typeof window !== 'undefined' && window.Funraise) {
    window.Funraise.popup(options);
  }
}

// Analytics helpers
export function trackEvent(eventName: string, properties: any = {}) {
  // Track events for analytics (Google Analytics, etc.)
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, properties);
  }
}

export function trackDonation(amount: number, currency: string = 'USD') {
  trackEvent('donation', {
    event_category: 'engagement',
    event_label: 'donation_completed',
    value: amount,
    currency,
  });
}

export function trackShopPurchase(items: any[], total: number) {
  trackEvent('purchase', {
    event_category: 'ecommerce',
    transaction_id: Date.now().toString(),
    value: total / 100, // Convert cents to dollars
    currency: 'USD',
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      price: item.price / 100,
    })),
  });
}

// Error handling
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any) {
  if (error instanceof AppError) {
    return {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  console.error('Unexpected error:', error);
  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}
