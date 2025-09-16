/**
 * Security headers utility for CSP nonce generation and header management
 */

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

export function getSecurityHeaders(nonce?: string) {
  const cspDirectives = [
    "default-src 'self'",
    `script-src 'self' ${nonce ? `'nonce-${nonce}'` : "'unsafe-inline'"} https://api.mapbox.com https://www.google.com https://www.gstatic.com https://js.stripe.com https://checkout.stripe.com https://m.stripe.network https://www.googletagmanager.com https://google-analytics.com https://www.google-analytics.com https://region1.google-analytics.com https://funraise-production.s3.amazonaws.com https://cdn.jsdelivr.net https://unpkg.com`,
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com https://js.stripe.com https://cdn.jsdelivr.net https://unpkg.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https://customer-zqf7uphf6x9b8fuh.cloudflarestream.com",
    "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.supabase.co https://api.stripe.com https://m.stripe.network https://www.google-analytics.com https://region1.google-analytics.com https://checkout.stripe.com",
    "frame-src 'self' https://checkout.stripe.com https://js.stripe.com https://funraise.org https://player.cloudflare.com https://customer-zqf7uphf6x9b8fuh.cloudflarestream.com https://www.google.com https://heyzine.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://checkout.stripe.com",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; ');

  return {
    'Content-Security-Policy': cspDirectives,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
}

export function createSecurityMiddleware() {
  return {
    headers: getSecurityHeaders(),
    nonce: generateNonce()
  };
}
