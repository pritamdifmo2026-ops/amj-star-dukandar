/**
 * Format number in Indian numbering system (1,00,000)
 * Used for displaying production capacity and turnover in forms
 */
export function formatIndianNumber(num: number | undefined): string {
  if (!num && num !== 0) return '';
  
  const str = Math.floor(num).toString();
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  
  if (otherNumbers !== '') {
    return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return lastThree;
}

/**
 * Parse Indian formatted number back to plain number
 */
export function parseIndianNumber(str: string): number {
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}
