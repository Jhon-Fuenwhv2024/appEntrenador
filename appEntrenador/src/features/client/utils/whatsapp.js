/**
 * Build https://wa.me/ URL from a trainer profile phone.
 * Colombian 10-digit mobiles (3…) get country code 57 when missing.
 */
export function toWhatsAppDigits(phone) {
  let digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;

  // Strip leading 00 international prefix
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Local CO mobile without country code
  if (digits.length === 10 && digits.startsWith('3')) {
    digits = `57${digits}`;
  }

  // wa.me needs international number without +
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function buildWhatsAppUrl(phone, prefillText = '') {
  const digits = toWhatsAppDigits(phone);
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  if (!prefillText) return base;
  return `${base}?text=${encodeURIComponent(prefillText)}`;
}
