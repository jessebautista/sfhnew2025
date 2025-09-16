import type { APIRoute } from 'astro';

const PRINTFUL_API_URL = 'https://api.printful.com';
const API_KEY = import.meta.env.PRINTFUL_API_KEY as string | undefined;
const RAW_STORE_ID = import.meta.env.PRINTFUL_STORE_ID as string | undefined;
const STORE_ID = (RAW_STORE_ID && /^\d+$/.test(RAW_STORE_ID)) ? RAW_STORE_ID : '16815860';

import { fetchPrintfulProductDTO } from '../../../lib/printful';

interface CartItemPayload {
  variant_id?: number | string;
  product_id?: number;
  quantity: number;
}

export const POST: APIRoute = async ({ request }) => {
  if (!API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'Printful API key missing' }), { status: 500 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const country = String(payload?.country || 'US').toUpperCase();
  const zip = String(payload?.zip || '').trim();
  const state = payload?.state ? String(payload.state) : undefined;
  const itemsRaw = Array.isArray(payload?.items) ? payload.items : [];
  const normalized: CartItemPayload[] = itemsRaw.map((it: any) => ({
    variant_id: it.variant_id,
    product_id: Number(it.product_id) || undefined,
    quantity: Number(it.quantity) || 1,
  })).filter((it: CartItemPayload) => it.quantity > 0);

  if (!normalized.length) {
    return new Response(JSON.stringify({ success: false, error: 'No items' }), { status: 400 });
  }

  // Ensure numeric variant IDs, falling back to first variant for product if needed
  const ensuredItems: { variant_id: number; quantity: number }[] = [];
  for (const it of normalized) {
    let vid = Number(it.variant_id);
    if (!Number.isFinite(vid) || vid <= 0) {
      if (it.product_id) {
        const dto = await fetchPrintfulProductDTO(it.product_id);
        const first = dto?.variants?.find(v => typeof v.id === 'string' ? Number(v.id) > 0 : (v.id as any) > 0);
        if (first) vid = Number(first.id);
      }
    }
    if (Number.isFinite(vid) && vid > 0) {
      ensuredItems.push({ variant_id: vid, quantity: it.quantity });
    }
  }

  if (!ensuredItems.length) {
    return new Response(JSON.stringify({ success: false, error: 'No resolvable variant IDs' }), { status: 400 });
  }

  const body = {
    recipient: {
      country_code: country,
      state_code: state,
      zip,
    },
    items: ensuredItems,
    currency: 'USD',
  };

  try {
    const res = await fetch(`${PRINTFUL_API_URL}/shipping/rates`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'X-PF-Store-Id': STORE_ID,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, status: res.status, error: text }), { status: 200 });
    }
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    const rates: any[] = Array.isArray(data?.result) ? data.result : [];
    // pick cheapest USD rate
    let best: { rate: number; name?: string } | null = null;
    for (const r of rates) {
      const amount = Number(r.rate || r.amount || 0);
      if (!Number.isFinite(amount)) continue;
      if (!best || amount < best.rate) best = { rate: amount, name: r.name };
    }

    const shipping_cents = best ? Math.round(best.rate * 100) : 0;

    return new Response(JSON.stringify({ success: true, data: { shipping_cents, rates } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || String(e) }), { status: 200 });
  }
};
