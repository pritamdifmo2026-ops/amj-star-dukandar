export default async function handler(req, res) {
  const { id } = req.query;
  const supplierId = (id || '').match(/([0-9a-fA-F]{24})$/)?.[1] || id;
  
  // Use VITE_API_BASE_URL if available in the Vercel env, otherwise fallback to production URL
  const apiUrl = (process.env.VITE_API_BASE_URL || 'https://api.amjstar.com/api').replace(/\/$/, '');
  
  try {
    // 1. Fetch store data from backend
    const apiRes = await fetch(`${apiUrl}/supplier/public/${supplierId}`);
    
    if (apiRes.ok) {
      const data = await apiRes.json();
      const storeName = data?.supplier?.businessName || 'AMJSTAR Store';
      const categories = data?.supplier?.categories || [];
      const description = categories.length > 0 
        ? `Explore wholesale products in ${categories.join(', ')} at ${storeName}. Verified supplier on AMJSTAR.` 
        : `Welcome to ${storeName} on AMJSTAR. Discover a wide range of wholesale products directly from verified manufacturers.`;
      
      const host = req.headers.host || 'amjstar.com';
      const protocol = host.includes('localhost') ? 'http' : 'https';

      const rawImage = data?.supplier?.logo || data?.supplier?.profilePicture || data?.supplier?.banner?.desktop;
      let ogImage;
      if (rawImage) {
        const fullImageUrl = rawImage.startsWith('http')
          ? rawImage
          : `${protocol}://${host}${rawImage.startsWith('/') ? '' : '/'}${rawImage}`;
        ogImage = `https://wsrv.nl/?url=${encodeURIComponent(fullImageUrl)}&output=jpeg&q=80&w=1200`;
      } else {
        const defaultLogo = 'https://amjstar.com/amjstar01.png';
        ogImage = `https://wsrv.nl/?url=${encodeURIComponent(defaultLogo)}&output=jpeg&q=80&w=1200`;
      }

      // 2. Fetch the raw index.html from our deployment
      const htmlRes = await fetch(`${protocol}://${host}/index.html`);
      let html = await htmlRes.text();

      // 3. Inject dynamic meta tags (WhatsApp, Telegram, Facebook, LinkedIn, Twitter/X)
      const metaTags = `
        <title>${escapeHtml(storeName)} - AMJSTAR Wholesale Store</title>
        <meta name="description" content="${escapeHtml(description)}">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="AMJSTAR - India ka Apna B2B Bazaar">
        <meta property="og:title" content="${escapeHtml(storeName)} - AMJSTAR Wholesale Store">
        <meta property="og:description" content="${escapeHtml(description)}">
        <meta property="og:image" content="${ogImage}">
        <meta property="og:image:secure_url" content="${ogImage}">
        <meta property="og:image:type" content="image/jpeg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="${escapeHtml(storeName)}">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${escapeHtml(storeName)} - AMJSTAR Wholesale Store">
        <meta name="twitter:description" content="${escapeHtml(description)}">
        <meta name="twitter:image" content="${ogImage}">
      `;

      // Replace title in index.html
      if (/<title>.*?<\/title>/i.test(html)) {
        html = html.replace(/<title>.*?<\/title>/i, metaTags);
      } else {
        html = html.replace('</head>', `${metaTags}\n</head>`);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400'); // Cache for 7 days
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error('Error in store edge function:', error);
  }

  // Fallback
  try {
    const host = req.headers.host || 'amjstar.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const htmlRes = await fetch(`${protocol}://${host}/index.html`);
    const html = await htmlRes.text();
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Internal Server Error while generating preview.');
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
