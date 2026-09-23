/**
 * Formats an image URL into a lightweight JPEG via wsrv.nl image CDN.
 * Ensures compatibility across WhatsApp, Telegram, Facebook, LinkedIn, etc.
 * Converts WebP, PNG, AVIF to standard JPEG and limits dimensions/weight to avoid WhatsApp rejection.
 */
export function toSocialOgJpeg(imageUrl?: string | null, width = 1200, quality = 80): string {
  const fallbackLogo = 'https://amjstar.com/amjstar01.png';
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return `https://wsrv.nl/?url=${encodeURIComponent(fallbackLogo)}&output=jpeg&q=${quality}&w=${width}`;
  }

  const clean = imageUrl.trim();
  const fullUrl = clean.startsWith('http')
    ? clean
    : `https://amjstar.com${clean.startsWith('/') ? '' : '/'}${clean}`;

  return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=jpeg&q=${quality}&w=${width}`;
}

/**
 * Generates direct share URLs for social media platforms
 */
export interface ShareDetails {
  title: string;
  text?: string;
  url: string;
}

export function shareToWhatsApp(details: ShareDetails): void {
  const message = `${details.title ? `*${details.title}*\n` : ''}${details.text ? `${details.text}\n\n` : ''}${details.url}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
}

export function shareToTelegram(details: ShareDetails): void {
  const text = `${details.title ? `${details.title}\n` : ''}${details.text ? `${details.text}` : ''}`.trim();
  window.open(`https://t.me/share/url?url=${encodeURIComponent(details.url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

export function shareToFacebook(details: ShareDetails): void {
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(details.url)}`, '_blank', 'noopener,noreferrer');
}

export function shareToLinkedIn(details: ShareDetails): void {
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(details.url)}`, '_blank', 'noopener,noreferrer');
}

export function shareToTwitter(details: ShareDetails): void {
  const text = `${details.title ? details.title : ''}${details.text ? `\n${details.text}` : ''}`.trim();
  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(details.url)}&text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

/**
 * Converts a supplier's business name and ObjectId into a clean, human-readable SEO slug:
 * e.g. "Sharma & Sons Traders (Pvt) Ltd" + "66f8a1b2c3d4e5f6a7b8c9d0"
 *   -> "sharma-sons-traders-pvt-ltd-66f8a1b2c3d4e5f6a7b8c9d0"
 */
export function toStoreSlug(businessName?: string, id?: string): string {
  if (!id) return '';
  if (!businessName || !businessName.trim()) return id;
  const cleanName = businessName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove unsupported characters
    .replace(/\s+/g, '-')          // convert spaces to dash
    .replace(/-+/g, '-');          // collapse multiple dashes
  return cleanName ? `${cleanName}-${id}` : id;
}

/**
 * Extracts the 24-character hexadecimal MongoDB ObjectId from a store slug or raw id:
 * e.g. "sharma-electronics-66f8a1b2c3d4e5f6a7b8c9d0" -> "66f8a1b2c3d4e5f6a7b8c9d0"
 */
export function extractSupplierId(slugOrId?: string): string {
  if (!slugOrId) return '';
  const match = slugOrId.match(/([0-9a-fA-F]{24})$/);
  return match ? match[1] : slugOrId;
}

/**
 * Formats product details into a clean, concise 1-2 line description for social sharing:
 * - Bold Product Title
 * - Price & MOQ
 * - Short 1-2 line description snippet (max ~110 chars)
 * - Product Link
 */
export function formatProductShareText(product: {
  name: string;
  price?: number;
  basePrice?: number;
  unit?: string;
  moq?: number;
  minOrderQty?: number;
  description?: string;
}): { title: string; subtitle: string; text: string } {
  const priceVal = product.price ?? product.basePrice;
  const unitVal = product.unit || 'pcs';
  const moqVal = product.moq ?? product.minOrderQty ?? 1;

  const priceText = priceVal !== undefined ? `₹${priceVal}/${unitVal}` : '';
  const moqText = `Min Order: ${moqVal} ${unitVal}`;
  const subtitle = priceText ? `${priceText} • ${moqText}` : moqText;

  let cleanDesc = '';
  if (product.description) {
    cleanDesc = product.description
      .replace(/<[^>]*>?/gm, '') // strip html tags
      .replace(/\s+/g, ' ')       // collapse whitespace & newlines
      .trim();
    if (cleanDesc.length > 115) {
      cleanDesc = cleanDesc.slice(0, 112).trim() + '...';
    }
  }

  const text = cleanDesc ? `${subtitle}\n${cleanDesc}` : subtitle;

  return {
    title: product.name,
    subtitle,
    text,
  };
}


