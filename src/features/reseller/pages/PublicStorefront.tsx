import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, Package } from 'lucide-react';
import Button from '@/shared/components/ui/Button';
import resellerService from '../services/reseller.service';

const PublicStorefront: React.FC = () => {
  const { slug: routeSlug, idOrSlug } = useParams<{ slug?: string; idOrSlug?: string }>();
  const slug = routeSlug || idOrSlug;
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const storeName = slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Reseller Store';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await resellerService.getRequests();
        setProducts((data.requests || []).filter((r: any) => r.status === 'APPROVED'));
      } catch (error) {
        console.error('Failed to load products', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Store Header */}
      <header className="bg-white border-b border-[#eef2f6] shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 py-6 flex items-center gap-4">
          <div className="w-16 h-16 bg-primary text-white rounded-[12px] flex items-center justify-center text-2xl font-extrabold shrink-0">
            {storeName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0f172a] m-0 mb-1">{storeName}</h1>
            <p className="flex items-center gap-1.5 text-sm text-[#059669] font-semibold m-0">
              <ShieldCheck size={15} /> Verified AMJSTAR Reseller
            </p>
          </div>
        </div>
      </header>

      {/* Store Content */}
      <main className="flex-1">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="flex items-center gap-3 bg-[#fff7ed] border border-[#fed7aa] rounded-[12px] px-5 py-4 mb-8 text-[#c2410c]">
            <Star size={22} className="shrink-0 text-[#f59e0b]" />
            <div>
              <h2 className="text-base font-extrabold m-0 mb-0.5">Welcome to my store!</h2>
              <p className="text-sm m-0">I have handpicked the best products for you. Shop with confidence.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#64748b]">Loading store products...</div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-[#64748b]">
              <Package size={48} strokeWidth={1.5} />
              <h3 className="text-lg font-bold text-[#1e293b] m-0">No products available yet</h3>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-5">
              {products.map((req: any) => {
                const basePrice = req.product?.basePrice || 0;
                const sellingPrice = req.sellingPrice || Math.round(basePrice * 1.3);
                return (
                  <div key={req._id} className="bg-white rounded-[12px] border border-[#eef2f6] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] flex flex-col hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-shadow">
                    <div className="w-full aspect-square bg-[#f1f5f9] flex items-center justify-center overflow-hidden">
                      {req.product?.images?.[0] ? (
                        <img src={req.product.images[0]} alt={req.customTitle || req.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag size={32} className="text-[#94a3b8]" />
                      )}
                    </div>
                    <div className="p-4 flex flex-col gap-3 flex-1">
                      <h3 className="text-sm font-bold text-[#0f172a] m-0 line-clamp-2">{req.customTitle || req.product?.name}</h3>
                      {req.highlights && req.highlights.length > 0 && (
                        <ul className="m-0 pl-4 text-xs text-[#64748b] flex flex-col gap-0.5">
                          {req.highlights.map((h: string, idx: number) => <li key={idx}>{h}</li>)}
                        </ul>
                      )}
                      <div className="mt-auto">
                        <span className="text-xl font-extrabold text-primary block mb-3">₹{sellingPrice}</span>
                        <Button className="w-full" onClick={() => alert('Checkout flow will be developed soon!')}>
                          Buy Now
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-[#eef2f6] py-5">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between max-sm:flex-col max-sm:gap-3">
          <p className="text-sm text-[#94a3b8] m-0">Powered by AMJSTAR</p>
          <Button variant="outline" onClick={() => navigate('/')}>Explore AMJSTAR</Button>
        </div>
      </footer>
    </div>
  );
};

export default PublicStorefront;
