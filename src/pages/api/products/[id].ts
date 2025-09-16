import type { APIRoute } from 'astro';
import { getPrintfulConfig, isPrintfulConfigured, fetchPrintfulProductDTO } from '../../../../lib/printful';

export const GET: APIRoute = async ({ params }) => {
  const idParam = params.id as string | undefined;
  const id = idParam && /^\d+$/.test(idParam) ? Number(idParam) : NaN;

  if (!id || isNaN(id)) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid product id' }), { status: 400 });
  }

  const cfg = getPrintfulConfig();
  if (!isPrintfulConfigured()) {
    return new Response(JSON.stringify({ success: false, error: 'Printful not configured', debug: { cfg } }), { status: 500 });
  }

  try {
    const dto = await fetchPrintfulProductDTO(id);
    if (!dto) {
      return new Response(JSON.stringify({ success: false, error: 'Product not found or unavailable', id }), { status: 404 });
    }

    return new Response(JSON.stringify({ success: true, data: dto, source: 'printful_store' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message || String(e) }), { status: 500 });
  }
};

