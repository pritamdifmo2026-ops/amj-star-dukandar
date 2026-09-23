export default async function handler(req, res) {
  const { id } = req.query;

  // Use VITE_API_BASE_URL if available in the Vercel env, otherwise fallback to production URL
  const apiUrl = (process.env.VITE_API_BASE_URL || 'https://api.amjstar.com/api').replace(/\/$/, '');

  try {
    // 1. Fetch product data from backend
    const apiRes = await fetch(`${apiUrl}/products/${id}`);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const product = data?.product || data;

      const productName = product?.name || 'Wholesale Product';
      const supplierName = product?.supplierId?.businessName || 'Verified Supplier';
      const price = product?.basePrice ?? product?.price;
      const unit = product?.unit || 'pcs';
      const moq = product?.moq ?? product?.minOrderQty ?? 1;

      const priceInfo = price !== undefined ? `₹${price}/${unit} (Min Order: ${moq} ${unit})` : `Min Order: ${moq} ${unit}`;
      
      let cleanDesc = '';
      if (product?.description) {
        cleanDesc = product.description
          .replace(/<[^>]*>?/gm, '')
          .replace(/\s+/g, ' ')
          .trim();
        if (cleanDesc.length > 120) {
          cleanDesc = cleanDesc.slice(0, 117).trim() + '...';
        }
      }

      const description = cleanDesc ? `${priceInfo} • ${cleanDesc}` : `${priceInfo} | Available on AMJSTAR`;
      const title = `${productName} - ${priceInfo} | AMJSTAR`;

      // 2. Extract product image and convert to lightweight JPEG via wsrv.nl
      const rawImage = (product?.images && product.images.length > 0)
        ? product.images[0]
        : (product?.imageUrl || null);

      const host = req.headers.host || 'amjstar.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      let ogImage;
      if (rawImage) {
        const fullImageUrl = rawImage.startsWith('http')
          ? rawImage
          : `${protocol}://${host}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
        // Automatically convert any format (WebP, PNG, etc.) to optimized JPEG for WhatsApp/Telegram preview
        ogImage = `https://wsrv.nl/?url=${encodeURIComponent(fullImageUrl)}&output=jpeg&q=80&w=1200`;
      } else {
        const defaultLogo = 'https://amjstar.com/amjstar01.png';
        ogImage = `https://wsrv.nl/?url=${encodeURIComponent(defaultLogo)}&output=jpeg&q=80&w=1200`;
      }

      // 3. Fetch base index.html
      const htmlRes = await fetch(`${protocol}://${host}/index.html`);
      let html = await htmlRes.text();

      // 4. Inject dynamic social media preview tags (WhatsApp, Telegram, Facebook, LinkedIn, Twitter/X)
      const metaTags = `
        <title>${escapeHtml(title)}</title>
        <meta name="description" content="${escapeHtml(description)}" />
        
        <!-- Open Graph / WhatsApp / Facebook / LinkedIn -->
        <meta property="og:type" content="product" />
        <meta property="og:site_name" content="AMJSTAR - India ka Apna B2B Bazaar" />
        <meta property="og:title" content="${escapeHtml(title)}" />
        <meta property="og:description" content="${escapeHtml(description)}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:image:secure_url" content="${ogImage}" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="${escapeHtml(productName)}" />
        
        <!-- Twitter / Telegram -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapeHtml(title)}" />
        <meta name="twitter:description" content="${escapeHtml(description)}" />
        <meta name="twitter:image" content="${ogImage}" />
      `;

      // Replace existing title or inject in head
      if (/<title>.*?<\/title>/i.test(html)) {
        html = html.replace(/<title>.*?<\/title>/i, metaTags);
      } else {
        html = html.replace('</head>', `${metaTags}\n</head>`);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200'); // Cache for 24h
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error('Error in product preview edge function:', error);
  }

  // Fallback: If anything fails (e.g. API is down or product not found), return default index.html
  try {
    const host = req.headers.host || 'amjstar.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const htmlRes = await fetch(`${protocol}://${host}/index.html`);
    const html = await htmlRes.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
