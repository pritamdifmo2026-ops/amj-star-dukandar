import appConfig from '@/config/app.config';

export function calculateGST(basePrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat(((basePrice * rate) / 100).toFixed(2));
}

export function priceWithGST(basePrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat((basePrice + calculateGST(basePrice, rate)).toFixed(2));
}

export function priceWithoutGST(totalPrice: number, rate: number = appConfig.gstRate): number {
  return parseFloat((totalPrice / (1 + rate / 100)).toFixed(2));
}
