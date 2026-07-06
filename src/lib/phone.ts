export const COUNTRY_CODE_OPTIONS = [
  { code: "+91", label: "IN +91", country: "India", placeholder: "8055678283", nationalDigits: 10 },
  { code: "+1", label: "US +1", country: "USA", placeholder: "4155552671", nationalDigits: 10 },
] as const;

export type CountryCode = (typeof COUNTRY_CODE_OPTIONS)[number]["code"];

export const DEFAULT_COUNTRY_CODE: CountryCode = "+91";

export function countryOptionFor(countryCode: string) {
  return COUNTRY_CODE_OPTIONS.find((option) => option.code === countryCode) || COUNTRY_CODE_OPTIONS[0];
}

export function sanitizeNationalPhoneDigits(value: string, countryCode: string) {
  const option = countryOptionFor(countryCode);
  const digits = value.replace(/\D/g, "");
  const countryDigits = option.code.replace(/\D/g, "");
  const nationalDigits = digits.length > option.nationalDigits && digits.startsWith(countryDigits)
    ? digits.slice(countryDigits.length)
    : digits;

  return nationalDigits.slice(0, option.nationalDigits);
}

export function splitPhoneNumber(value: string, fallbackCountryCode: string = DEFAULT_COUNTRY_CODE) {
  const trimmed = value.trim();
  const matchedOption = COUNTRY_CODE_OPTIONS
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find((option) => trimmed.startsWith(option.code));
  const option = matchedOption || countryOptionFor(fallbackCountryCode);
  const nationalValue = matchedOption ? trimmed.slice(option.code.length) : trimmed;

  return {
    countryCode: option.code,
    digits: sanitizeNationalPhoneDigits(nationalValue, option.code),
  };
}

export function formatPhoneNumber(countryCode: string, nationalValue: string) {
  const option = countryOptionFor(countryCode);
  return `${option.code}${sanitizeNationalPhoneDigits(nationalValue, option.code)}`;
}

export function normalizePhoneNumber(value: string, fallbackCountryCode: string = DEFAULT_COUNTRY_CODE): { ok: true; value: string } | { ok: false; message: string } {
  if (!value.trim()) return { ok: false, message: "Enter a phone number and select a country code." };

  const phone = splitPhoneNumber(value, fallbackCountryCode);
  const option = countryOptionFor(phone.countryCode);
  if (phone.digits.length !== option.nationalDigits) {
    return { ok: false, message: `Enter a ${option.nationalDigits} digit ${option.country} phone number.` };
  }

  return { ok: true, value: `${option.code}${phone.digits}` };
}
