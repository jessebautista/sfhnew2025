import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { fetchPrintfulProductDTO } from '../../../lib/printful';

const STRIPE_SECRET_KEY = import.meta.env.STRIPE_SECRET_KEY as string | undefined;
if (!STRIPE_SECRET_KEY) {
  console.warn('[checkout/create] STRIPE_SECRET_KEY not set; endpoint will error on use');
}

const PRINTFUL_API_URL = 'https://api.printful.com';
const PRINTFUL_API_KEY = import.meta.env.PRINTFUL_API_KEY as string | undefined;
const RAW_STORE_ID = import.meta.env.PRINTFUL_STORE_ID as string | undefined;
const STORE_ID = (RAW_STORE_ID && /^\d+$/.test(RAW_STORE_ID)) ? RAW_STORE_ID : '16815860';

function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const allowed = new Set([
    'http://localhost:4321',
    'http://localhost:4322',
    'https://singforhope.org',
    'https://www.singforhope.org',
  ]);
  return origin ? allowed.has(origin) : true; // allow when no origin (server-to-server)
}

async function estimateShippingCents(dest: { country?: string; zip?: string }, items: { variant_id: number; quantity: number }[]) {
  if (!PRINTFUL_API_KEY) return 0;
  try {
    const res = await fetch(`${PRINTFUL_API_URL}/shipping/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
        'Content-Type': 'application/json',
        'X-PF-Store-Id': STORE_ID,
      },
      body: JSON.stringify({
        recipient: {
          country_code: (dest.country || 'US').toUpperCase(),
          zip: dest.zip || '',
        },
        items,
        currency: 'USD',
      }),
    });
    const data: any = await res.json().catch(() => ({}));
    const rates: any[] = Array.isArray(data?.result) ? data.result : [];
    let best: number | null = null;
    for (const r of rates) {
      const amount = Number(r.rate || r.amount || 0);
      if (!Number.isFinite(amount)) continue;
      if (best == null || amount < best) best = amount;
    }
    return best != null ? Math.round(best * 100) : 0;
  } catch {
    return 0;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!validateOrigin(request)) {
      return new Response(JSON.stringify({ error: 'Invalid origin' }), { status: 403 });
    }
    if (!STRIPE_SECRET_KEY) {
      return new Response(JSON.stringify({ error: 'Stripe not configured' }), { status: 500 });
    }

    const payload = await request.json();
    const items = Array.isArray(payload?.items) ? payload.items : [];
    const dest = payload?.destination || {};
    const successUrl = typeof payload?.successUrl === 'string' ? payload.successUrl : `${request.headers.get('origin') || ''}/shop/success`;
    const cancelUrl = typeof payload?.cancelUrl === 'string' ? payload.cancelUrl : `${request.headers.get('origin') || ''}/shop/cancel`;

    // Validate minimal structure (allow non-numeric variant id; we'll resolve below)
    const normalizedRaw = items
      .map((it: any) => ({ product_id: Number(it.product_id), variant_id: it.variant_id, quantity: Number(it.quantity) || 1 }))
      .filter((it: any) => Number.isFinite(it.product_id) && it.quantity > 0 && it.quantity <= 20);
    if (!normalizedRaw.length) {
      return new Response(JSON.stringify({ error: 'No valid items' }), { status: 400 });
    }

    // Build Stripe line items using server-side product data
    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const ensured: { product_id: number; variant_id: number; quantity: number }[] = [];
    for (const it of normalizedRaw) {
      const dto = await fetchPrintfulProductDTO(it.product_id);
      if (!dto) continue;
      let variant = (dto.variants || []).find(v => Number(v.id) === Number(it.variant_id)) || null;
      if (!variant && dto.variants && dto.variants.length) {
        variant = dto.variants[0];
      }
      if (!variant) continue;
      ensured.push({ product_id: it.product_id, variant_id: Number(variant.id), quantity: it.quantity });
      const unit_amount = variant?.price || dto.price;
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${dto.name}${variant?.size ? ` - ${variant.size}` : ''}${variant?.color ? ` / ${variant.color}` : ''}`,
            images: dto.images && dto.images.length ? [dto.images[0]] : [dto.image],
          },
          unit_amount,
        },
        quantity: it.quantity,
      });
    }

    if (!line_items.length) {
      return new Response(JSON.stringify({ error: 'Unable to build line items' }), { status: 400 });
    }

    // Optionally add shipping as a separate line item (cheapest rate)
    if (dest && (dest.zip || dest.country)) {
      const shippingCents = await estimateShippingCents(dest, ensured.map(i => ({ variant_id: i.variant_id, quantity: i.quantity })));
      if (shippingCents > 0) {
        line_items.push({
          price_data: {
            currency: 'usd',
            product_data: { name: 'Shipping' },
            unit_amount: shippingCents,
          },
          quantity: 1,
        });
      }
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      shipping_address_collection: { allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR'] },
      metadata: { store: 'printful_16815860' },
    });

    return new Response(JSON.stringify({ success: true, url: session.url, sessionId: session.id }), { status: 200 });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), { status: 500 });
  }
};
