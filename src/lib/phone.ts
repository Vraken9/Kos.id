/**
 * Normalize Indonesian WhatsApp number to international format (without +)
 * 08xxx -> 628xxx
 * +628xxx -> 628xxx
 * 628xxx -> 628xxx
 */
export function normalizeIndonesianWhatsapp(input: string): string {
  // Remove all non-digit characters except leading +
  let cleaned = input.trim().replace(/[^\d+]/g, '');

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Convert 0xxx to 62xxx
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }

  return cleaned;
}

/**
 * Validate that a string looks like a valid Indonesian phone number
 */
export function isValidIndonesianPhone(input: string): boolean {
  const normalized = normalizeIndonesianWhatsapp(input);
  // Indonesian numbers: 62 + 8-13 digits
  return /^62\d{8,13}$/.test(normalized);
}

/**
 * Format phone for WhatsApp link (wa.me format, no +)
 */
export function formatWhatsappLink(phone: string, message?: string): string {
  const normalized = normalizeIndonesianWhatsapp(phone);
  const base = `https://wa.me/${normalized}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}
