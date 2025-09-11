/**
 * HTML sanitization utilities to prevent XSS attacks
 */

export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, '');
}

export function sanitizeForTitle(title: string): string {
  // For titles, we want to be extra careful and strip all HTML
  return stripHtml(title).trim();
}

export function truncateText(text: string, limit: number = 150): string {
  const stripped = stripHtml(text);
  if (stripped.length <= limit) return stripped;
  return stripped.substring(0, limit) + '...';
}