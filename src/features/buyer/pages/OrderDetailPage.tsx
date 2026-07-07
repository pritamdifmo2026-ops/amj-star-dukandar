import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi } from '@/features/order/services/order.api';
import { useAppSelector } from '@/store/hooks';
import OrderManage from '../components/OrderManage';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector(s => s.auth);
  const { profile } = useAppSelector((s: any) => s.supplier);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = () => {
    if (!id) return;
    setLoading(true);
    orderApi.detail(id)
      .then((data: any) => { setOrder(data.order ?? data); setError(null); })
      .catch(() => setError('Order not found or you do not have permission to view it.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const isSupplier = user?.role === 'supplier';
  const policy = profile?.businessDetails?.returnPolicyType;
  const allowedMethods: ('refund' | 'replacement')[] =
    policy === 'refund'      ? ['refund'] :
    policy === 'replacement' ? ['replacement'] :
    ['refund', 'replacement'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
      <div className="w-8 h-8 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#f8fafc] px-4">
      <p className="text-sm text-[#64748b]">{error ?? 'Order not found.'}</p>
      <button
        onClick={() => navigate(-1)}
        className="px-4 py-2 bg-[#059669] text-white text-sm font-semibold rounded-[8px] border-none cursor-pointer hover:bg-[#047857]"
      >
        Go Back
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <OrderManage
        order={order}
        isSupplier={isSupplier}
        isOwnShipping={true}
        allowedMethods={allowedMethods}
        onBack={() => navigate(-1)}
        onRefresh={fetchOrder}
      />
    </div>
  );
};

export default OrderDetailPage;
