export default async function handler(req, res) {
  const { id } = req.query;
  
  // Use VITE_API_BASE_URL if available in the Vercel env, otherwise fallback to production URL
  const apiUrl = (process.env.VITE_API_BASE_URL || 'https://api.amjstar.com/api').replace(/\/$/, '');
  
  try {
    // 1. Fetch store data from backend
    const apiRes = await fetch(`${apiUrl}/supplier/public/${id}`);
    
    if (apiRes.ok) {
      const data = await apiRes.json();
      const storeName = data?.supplier?.businessName || 'AMJSTAR Store';
      const categories = data?.supplier?.categories || [];
      const description = categories.length > 0 
        ? `Explore wholesale products in ${categories.join(', ')} at ${storeName}.` 
        : `Welcome to ${storeName} on AMJSTAR. Discover a wide range of wholesale products.`;
      
      const imageUrl = data?.supplier?.profilePicture || 'https://amjstar.com/default-preview.png';

      // 2. Fetch the raw index.html from our own deployment
      // req.headers.host contains the current Vercel deployment URL (e.g. amjstar.vercel.app)
      const host = req.headers.host || 'amjstar.vercel.app';
      const protocol = host.includes('localhost') ? 'http' : 'https';
      
      const htmlRes = await fetch(`${protocol}://${host}/index.html`);
      let html = await htmlRes.text();

      // 3. Inject dynamic meta tags (Social Media Preview Cards)
      const metaTags = `
        <title>${storeName} - AMJSTAR</title>
        <meta property="og:title" content="${storeName} - AMJSTAR">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${imageUrl}">
        <meta property="og:type" content="website">
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${storeName} - AMJSTAR">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${imageUrl}">
        <meta name="description" content="${description}">
      `;

      // Replace the default title/meta tags in index.html
      html = html.replace('<title>AMJSTAR</title>', metaTags);

      res.setHeader('Content-Type', 'text/html');
      // Cache the result heavily at the Edge (CDN) to prevent hitting the backend on every share
      res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate=86400'); // Cache for 7 days
      
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error('Error in edge function:', error);
  }

  // Fallback: If anything fails (e.g., API is down, store not found), 
  // just fetch and return the raw default index.html so the app still works!
  try {
    const host = req.headers.host || 'amjstar.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const htmlRes = await fetch(`${protocol}://${host}/index.html`);
    const html = await htmlRes.text();
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Internal Server Error while generating preview.');
  }
}
