import apiClient from '@/api/client';

export const paymentApi = {
  createOrder: async (orderId: string) => {
    const response = await apiClient.post('/payments/create-order', { orderId });
    return response.data;
  },
  
  verifyPayment: async (paymentData: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await apiClient.post('/payments/verify', paymentData);
    return response.data;
  }
};
