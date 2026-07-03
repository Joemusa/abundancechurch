// Converts loosely formatted South African numbers into E.164
// (e.g. "082 123 4567" -> "+27821234567"). Returns null if it can't be
// confidently normalized. Change DEFAULT_COUNTRY_CODE if you're not in SA.
const DEFAULT_COUNTRY_CODE = "27";

export function normalizePhone(
  raw: string | null | undefined,
  countryCode: string = DEFAULT_COUNTRY_CODE
): string | null {
  if (!raw) return null;

  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith(countryCode)) return `+${digits}`;
  if (digits.startsWith("0")) return `+${countryCode}${digits.slice(1)}`;
  if (digits.length === 9) return `+${countryCode}${digits}`;

  return `+${digits}`;
}
