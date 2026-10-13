/** Form doğrulama yardımcıları (sunucuda çalışır). */

export type FieldErrors = Partial<Record<string, string>>;

export function str(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/** 05xx xxx xx xx biçimindeki cep telefonunu +905xxxxxxxxx yapar; geçersizse null */
export function normalizeMobile(input: string): string | null {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return /^5\d{9}$/.test(d) ? `+90${d}` : null;
}

/** +905321234567 → 0532 123 45 67 */
export function formatMobile(e164: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/^\+90/, "0");
  return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7, 9)} ${d.slice(9, 11)}`;
}

export function normalizeEmail(input: string): string | null {
  const e = input.toLowerCase().trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 120 ? e : null;
}

export function validName(s: string): boolean {
  return s.length >= 2 && s.length <= 50 && /^[\p{L}][\p{L}\s'.-]*$/u.test(s);
}

export { passwordProblem, PASSWORD_MIN } from "./password-rules";
