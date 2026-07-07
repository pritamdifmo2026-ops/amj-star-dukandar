/**
 * Derives the Indian state from a 6-digit pincode using postal circle ranges.
 * Returns null if the pincode is invalid or unrecognised.
 */
export function pincodeToState(pincode: string): string | null {
  const cleaned = pincode.replace(/\D/g, '');
  if (cleaned.length !== 6) return null;

  const p = parseInt(cleaned.substring(0, 3), 10);

  if (p === 110 || p === 111) return 'Delhi';
  if (p >= 120 && p <= 135) return 'Haryana';
  if (p >= 140 && p <= 160) return 'Punjab';
  if (p >= 171 && p <= 177) return 'Himachal Pradesh';
  if (p >= 180 && p <= 194) return 'Jammu & Kashmir';
  if (p >= 195 && p <= 197) return 'Ladakh';
  if ((p >= 246 && p <= 249) || (p >= 263 && p <= 263)) return 'Uttarakhand';
  if (p >= 201 && p <= 285) return 'Uttar Pradesh';
  if (p >= 301 && p <= 345) return 'Rajasthan';
  if (p >= 360 && p <= 396) return 'Gujarat';
  if (p === 403) return 'Goa';
  if (p >= 400 && p <= 445) return 'Maharashtra';
  if (p >= 450 && p <= 482) return 'Madhya Pradesh';
  if (p >= 490 && p <= 497) return 'Chhattisgarh';
  if (p >= 500 && p <= 509) return 'Telangana';
  if (p >= 515 && p <= 535) return 'Andhra Pradesh';
  if (p >= 560 && p <= 599) return 'Karnataka';
  if (p === 605 || p === 607 || p === 609 || p === 533) return 'Puducherry';
  if (p >= 600 && p <= 643) return 'Tamil Nadu';
  if (p >= 670 && p <= 695) return 'Kerala';
  if (p >= 700 && p <= 743) return 'West Bengal';
  if (p >= 744 && p <= 744) return 'Andaman & Nicobar Islands';
  if (p >= 751 && p <= 770) return 'Odisha';
  if (p >= 781 && p <= 786) return 'Assam';
  if (p === 787) return 'Arunachal Pradesh';
  if (p === 788 || p === 796 || p === 797) return 'Mizoram';
  if (p >= 793 && p <= 794) return 'Meghalaya';
  if (p === 795) return 'Manipur';
  if (p === 798 || p === 799) return 'Nagaland';
  if (p === 799) return 'Tripura';
  if (p >= 790 && p <= 792) return 'Arunachal Pradesh';
  if (p >= 825 && p <= 835) return 'Jharkhand';
  if (p >= 800 && p <= 855) return 'Bihar';
  if (p >= 160 && p <= 160) return 'Chandigarh';
  if (p >= 682 && p <= 682) return 'Lakshadweep';

  return null;
}

const STATE_NEIGHBOURS: Record<string, string[]> = {
  'Andhra Pradesh': ['Telangana', 'Karnataka', 'Tamil Nadu', 'Odisha', 'Chhattisgarh'],
  'Arunachal Pradesh': ['Assam', 'Nagaland'],
  'Assam': ['West Bengal', 'Meghalaya', 'Arunachal Pradesh', 'Nagaland', 'Manipur', 'Mizoram', 'Tripura'],
  'Bihar': ['Uttar Pradesh', 'Jharkhand', 'West Bengal'],
  'Chhattisgarh': ['Madhya Pradesh', 'Maharashtra', 'Telangana', 'Andhra Pradesh', 'Odisha', 'Jharkhand', 'Uttar Pradesh'],
  'Delhi': ['Haryana', 'Uttar Pradesh', 'Rajasthan'],
  'Goa': ['Maharashtra', 'Karnataka'],
  'Gujarat': ['Maharashtra', 'Goa', 'Rajasthan', 'Madhya Pradesh'],
  'Haryana': ['Delhi', 'Punjab', 'Rajasthan', 'Uttar Pradesh', 'Himachal Pradesh', 'Uttarakhand', 'Chandigarh'],
  'Himachal Pradesh': ['Punjab', 'Haryana', 'Uttarakhand', 'Jammu & Kashmir'],
  'Jammu & Kashmir': ['Punjab', 'Himachal Pradesh', 'Ladakh'],
  'Jharkhand': ['Bihar', 'West Bengal', 'Odisha', 'Chhattisgarh', 'Uttar Pradesh'],
  'Karnataka': ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Kerala', 'Goa', 'Maharashtra'],
  'Kerala': ['Karnataka', 'Tamil Nadu'],
  'Ladakh': ['Jammu & Kashmir', 'Himachal Pradesh'],
  'Madhya Pradesh': ['Rajasthan', 'Gujarat', 'Maharashtra', 'Chhattisgarh', 'Uttar Pradesh'],
  'Maharashtra': ['Gujarat', 'Goa', 'Karnataka', 'Telangana', 'Andhra Pradesh', 'Madhya Pradesh', 'Chhattisgarh'],
  'Manipur': ['Assam', 'Nagaland', 'Mizoram'],
  'Meghalaya': ['Assam'],
  'Mizoram': ['Assam', 'Manipur', 'Tripura'],
  'Nagaland': ['Assam', 'Arunachal Pradesh', 'Manipur'],
  'Odisha': ['West Bengal', 'Jharkhand', 'Chhattisgarh', 'Andhra Pradesh', 'Telangana'],
  'Punjab': ['Haryana', 'Delhi', 'Rajasthan', 'Himachal Pradesh', 'Jammu & Kashmir', 'Chandigarh'],
  'Rajasthan': ['Gujarat', 'Madhya Pradesh', 'Uttar Pradesh', 'Haryana', 'Punjab', 'Delhi'],
  'Sikkim': ['West Bengal'],
  'Tamil Nadu': ['Karnataka', 'Kerala', 'Andhra Pradesh', 'Puducherry'],
  'Telangana': ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'Chhattisgarh', 'Odisha'],
  'Tripura': ['Assam', 'Mizoram'],
  'Uttar Pradesh': ['Delhi', 'Haryana', 'Rajasthan', 'Madhya Pradesh', 'Chhattisgarh', 'Jharkhand', 'Bihar', 'Uttarakhand'],
  'Uttarakhand': ['Himachal Pradesh', 'Haryana', 'Uttar Pradesh'],
  'West Bengal': ['Bihar', 'Jharkhand', 'Odisha', 'Assam', 'Sikkim'],
  'Chandigarh': ['Punjab', 'Haryana'],
  'Puducherry': ['Tamil Nadu'],
  'Andaman & Nicobar Islands': [],
  'Lakshadweep': [],
};

export type ShippingZone = 'local' | 'regional' | 'national';

export function getShippingZone(buyerState: string, supplierState: string): ShippingZone {
  const buyer = normaliseState(buyerState);
  const supplier = normaliseState(supplierState);
  if (!buyer || !supplier) return 'national';
  if (buyer === supplier) return 'local';
  const neighbours = STATE_NEIGHBOURS[supplier] ?? [];
  return neighbours.includes(buyer) ? 'regional' : 'national';
}

/**
 * Normalise state strings coming from the supplier profile so they match
 * what pincodeToState returns. Handles abbreviations and alternate spellings.
 */
export function normaliseState(raw: string): string {
  const s = raw.trim().toLowerCase();
  const MAP: Record<string, string> = {
    'ap': 'Andhra Pradesh',
    'andhra': 'Andhra Pradesh',
    'ts': 'Telangana',
    'tg': 'Telangana',
    'ka': 'Karnataka',
    'kl': 'Kerala',
    'tn': 'Tamil Nadu',
    'mh': 'Maharashtra',
    'gj': 'Gujarat',
    'rj': 'Rajasthan',
    'up': 'Uttar Pradesh',
    'mp': 'Madhya Pradesh',
    'wb': 'West Bengal',
    'or': 'Odisha',
    'odisha': 'Odisha',
    'orissa': 'Odisha',
    'dl': 'Delhi',
    'hr': 'Haryana',
    'pb': 'Punjab',
    'hp': 'Himachal Pradesh',
    'jk': 'Jammu & Kashmir',
    'j&k': 'Jammu & Kashmir',
    'uk': 'Uttarakhand',
    'ua': 'Uttarakhand',
    'uttaranchal': 'Uttarakhand',
    'cg': 'Chhattisgarh',
    'jh': 'Jharkhand',
    'as': 'Assam',
    'mn': 'Manipur',
    'ml': 'Meghalaya',
    'mz': 'Mizoram',
    'nl': 'Nagaland',
    'tr': 'Tripura',
    'ar': 'Arunachal Pradesh',
    'sk': 'Sikkim',
    'ga': 'Goa',
    'la': 'Ladakh',
    'py': 'Puducherry',
    'pondicherry': 'Puducherry',
    'an': 'Andaman & Nicobar Islands',
    'chandigarh': 'Chandigarh',
    'ch': 'Chandigarh',
    'dd': 'Dadra & Nagar Haveli and Daman & Diu',
    'lk': 'Lakshadweep',
  };
  return MAP[s] ?? raw.trim();
}
