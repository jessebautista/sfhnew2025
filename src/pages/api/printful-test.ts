import type { APIRoute } from 'astro';

const PRINTFUL_API_URL = 'https://api.printful.com';
const API_KEY = import.meta.env.PRINTFUL_API_KEY as string | undefined;
const RAW_STORE_ID = import.meta.env.PRINTFUL_STORE_ID as string | undefined;
const STORE_ID = (RAW_STORE_ID && /^\d+$/.test(RAW_STORE_ID)) ? RAW_STORE_ID : '16815860';

export const GET: APIRoute = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (API_KEY) headers['Authorization'] = `Bearer ${API_KEY}`;
  headers['X-PF-Store-Id'] = STORE_ID;

  let status = 0;
  let ok = false;
  let bodyText = '';
  try {
    const res = await fetch(`${PRINTFUL_API_URL}/store/products`, { headers });
    status = res.status;
    ok = res.ok;
    bodyText = await res.text();
  } catch (e: any) {
    bodyText = `Fetch error: ${e?.message || String(e)}`;
  }

  // Avoid returning huge payloads
  const preview = bodyText.length > 2000 ? bodyText.slice(0, 2000) + '...<truncated>' : bodyText;

  return new Response(JSON.stringify({
    ok,
    status,
    storeId: STORE_ID,
    hasApiKey: !!API_KEY,
    hint: 'Ensure PRINTFUL_API_KEY has access to the specified store.',
    responsePreview: preview,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

