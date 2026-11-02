import appConfig from '@/config/app.config';

export function formatCurrency(amount: number): string {
  const safeAmount = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatCompact(amount: number): string {
  if (amount >= 10000000) return `${appConfig.currencySymbol}${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `${appConfig.currencySymbol}${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${appConfig.currencySymbol}${(amount / 1000).toFixed(1)}K`;
  return `${appConfig.currencySymbol}${amount}`;
}
