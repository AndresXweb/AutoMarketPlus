/**
 * Sanitizers for form inputs (client-side). Server still validates with Zod.
 */

/** Only digits 0-9 (no minus, no letters, no spaces). */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Phone: optional leading +, then digits only.
 * Rejects letters and minus signs in the middle.
 */
export function sanitizePhone(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) {
    return "+" + onlyDigits(trimmed.slice(1));
  }
  return onlyDigits(trimmed);
}

/** True if phone has at least `min` digits (ignoring +). */
export function isValidPhone(raw: string, min = 7): boolean {
  return onlyDigits(raw).length >= min;
}

/**
 * Parse non-negative integer from form value.
 * Returns null if empty or invalid.
 */
export function parseNonNegInt(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const s = String(raw).replace(/\D/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/**
 * onInput handler for HTML inputs that must stay non-negative integers.
 */
export function onNonNegIntInput(e: { currentTarget: HTMLInputElement }) {
  const t = e.currentTarget;
  const next = onlyDigits(t.value);
  if (t.value !== next) t.value = next;
}

/**
 * onInput handler for phone fields.
 */
export function onPhoneInput(e: { currentTarget: HTMLInputElement }) {
  const t = e.currentTarget;
  const next = sanitizePhone(t.value);
  if (t.value !== next) t.value = next;
}
