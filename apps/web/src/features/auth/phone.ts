/** Country codes offered at sign-up (UAE first). The parent can also type a full +number. */
export const DIAL_CODES = [
  { code: '+971', flag: '🇦🇪' },
  { code: '+966', flag: '🇸🇦' },
  { code: '+965', flag: '🇰🇼' },
  { code: '+974', flag: '🇶🇦' },
  { code: '+973', flag: '🇧🇭' },
  { code: '+968', flag: '🇴🇲' },
  { code: '+91', flag: '🇮🇳' },
  { code: '+92', flag: '🇵🇰' },
  { code: '+20', flag: '🇪🇬' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+1', flag: '🇺🇸' },
] as const;

/**
 * Joins the country code and the typed number into E.164 (+971501234567), or null if it can't be
 * a real number. A leading 0 on the local number is dropped (050… → 50…); a number typed with its
 * own +code or 00code wins over the dropdown.
 */
export function toE164(dial: string, typed: string): string | null {
  const raw = typed.replace(/[\s\-().]/g, '');
  let full: string;
  if (raw.startsWith('+')) full = raw;
  else if (raw.startsWith('00')) full = `+${raw.slice(2)}`;
  else full = dial + raw.replace(/^0+/, '');
  return /^\+[1-9]\d{7,14}$/.test(full) ? full : null;
}
