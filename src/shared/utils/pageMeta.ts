/**
 * Dynamically updates the page's Open Graph / Twitter meta tags.
 * Called from storefront and product pages after data loads so that
 * JS-capable crawlers (Google, Bing) see the correct per-page metadata.
 *
 * For WhatsApp / Telegram / Facebook bots that DON'T execute JS,
 * the backend `/og/store/:id` and `/og/product/:id` proxy endpoints
 * serve the correct HTML directly.
 */

export interface PageMetaOptions {
  title: string;
  description: string;
  /** Absolute or relative URL to the image. Falls back to AMJSTAR logo. */
  imageUrl?: string | null;
  /** Canonical URL for this page */
  canonicalUrl?: string;
}

const FALLBACK_IMAGE =
  'https://wsrv.nl/?url=https%3A%2F%2Famjstar.com%2Famjstar01.png&output=jpeg&q=80&w=1200';

/** Converts any image URL to a WhatsApp-safe JPEG via wsrv.nl CDN */
function toOgJpeg(imageUrl?: string | null, width = 1200, quality = 80): string {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) return FALLBACK_IMAGE;
  const clean = imageUrl.trim();
  const fullUrl = clean.startsWith('http')
    ? clean
    : `https://amjstar.com${clean.startsWith('/') ? '' : '/'}${clean}`;
  return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=jpeg&q=${quality}&w=${width}`;
}

function setMeta(property: string, content: string) {
  // Try property attribute first (og:xxx), then name (twitter:xxx)
  let el = document.querySelector<HTMLMetaElement>(
    `meta[property="${property}"], meta[name="${property}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    const isOg = property.startsWith('og:');
    el.setAttribute(isOg ? 'property' : 'name', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Call this inside a useEffect after page data has loaded.
 * Resets meta tags to defaults when called with no arguments or on unmount.
 */
export function setPageMeta(opts?: PageMetaOptions): void {
  if (!opts) {
    // Reset to site defaults
    document.title = 'AMJSTAR - India ka Apna B2B Bazaar';
    setMeta('description', "India's leading B2B marketplace connecting verified manufacturers, suppliers, and buyers directly.");
    setMeta('og:title', 'AMJSTAR - India ka Apna B2B Bazaar');
    setMeta('og:description', "India's leading B2B marketplace connecting verified manufacturers, suppliers, and buyers directly.");
    setMeta('og:image', FALLBACK_IMAGE);
    setMeta('og:image:secure_url', FALLBACK_IMAGE);
    setMeta('og:url', 'https://amjstar.com');
    setMeta('twitter:title', 'AMJSTAR - India ka Apna B2B Bazaar');
    setMeta('twitter:description', "India's leading B2B marketplace connecting verified manufacturers, suppliers, and buyers directly.");
    setMeta('twitter:image', FALLBACK_IMAGE);
    return;
  }

  const { title, description, imageUrl, canonicalUrl } = opts;
  const ogImage = toOgJpeg(imageUrl, 1200, 80);
  const url = canonicalUrl || (typeof window !== 'undefined' ? window.location.href : 'https://amjstar.com');

  document.title = title;
  setMeta('description', description);
  setMeta('og:title', title);
  setMeta('og:description', description);
  setMeta('og:image', ogImage);
  setMeta('og:image:secure_url', ogImage);
  setMeta('og:image:type', 'image/jpeg');
  setMeta('og:image:width', '1200');
  setMeta('og:image:height', '630');
  setMeta('og:url', url);
  setMeta('og:type', 'website');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', title);
  setMeta('twitter:description', description);
  setMeta('twitter:image', ogImage);

  if (canonicalUrl) {
    setLink('canonical', canonicalUrl);
  }
}
