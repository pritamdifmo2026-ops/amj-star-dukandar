import apiClient from '@/api/client';

const walletApi = {
  getWallet: async () => {
    const res = await apiClient.get('/wallet');
    return res.data;
  },

  getTransactions: async (page = 1, limit = 20) => {
    const res = await apiClient.get('/wallet/transactions', { params: { page, limit } });
    return res.data;
  },

  createTopupOrder: async (amount: number) => {
    const res = await apiClient.post('/wallet/topup/order', { amount });
    return res.data;
  },

  verifyTopup: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount: number;
  }) => {
    const res = await apiClient.post('/wallet/topup/verify', data);
    return res.data;
  },

  requestWithdrawal: async (amount: number, bankDetails: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  }) => {
    const res = await apiClient.post('/wallet/withdraw', { amount, bankDetails });
    return res.data;
  },

  getWithdrawals: async () => {
    const res = await apiClient.get('/wallet/withdrawals');
    return res.data;
  },
};

export default walletApi;
