/**
 * Şifre kuralları — hem sunucuda doğrulama hem formdaki canlı kontrol
 * listesi için ortak kaynak.
 */
export const PASSWORD_MIN = 10;
export const PASSWORD_MAX = 128;

export const passwordRules: { id: string; label: string; test: (pw: string) => boolean }[] = [
  { id: "len", label: `En az ${PASSWORD_MIN} karakter`, test: (pw) => [...pw].length >= PASSWORD_MIN },
  { id: "upper", label: "En az bir büyük harf (A–Z, Ç, Ğ, İ, Ö, Ş, Ü)", test: (pw) => /\p{Lu}/u.test(pw) },
  { id: "lower", label: "En az bir küçük harf", test: (pw) => /\p{Ll}/u.test(pw) },
  { id: "digit", label: "En az bir rakam", test: (pw) => /\d/.test(pw) },
  { id: "symbol", label: "En az bir özel karakter (! ? . * - _ @ # vb.)", test: (pw) => /[^\p{L}\d\s]/u.test(pw) },
];

/** Sık kullanılan / tahmin edilmesi kolay şifre parçaları */
const WEAK_PARTS = [
  "123456", "12345678", "qwerty", "asdf", "password", "parola", "sifre", "şifre",
  "sardes", "salihli", "manisa", "klinik", "dishekimi", "111111", "000000", "abc123",
];

/**
 * Şifrenin neden kabul edilmediğini döndürür; uygunsa null.
 * `personal`: ad, soyad, telefon gibi şifrede geçmemesi gereken bilgiler.
 */
export function passwordProblem(pw: string, personal: string[] = []): string | null {
  if (pw.length > PASSWORD_MAX) return `Şifre en fazla ${PASSWORD_MAX} karakter olabilir.`;
  const failed = passwordRules.filter((r) => !r.test(pw));
  if (failed.length) return `Şifre şu kuralları karşılamıyor: ${failed.map((r) => r.label).join("; ")}.`;

  const lower = pw.toLocaleLowerCase("tr");
  if (WEAK_PARTS.some((w) => lower.includes(w))) {
    return "Şifre tahmin edilmesi kolay bir ifade içeriyor. Lütfen başka bir şifre seçin.";
  }
  if (/(.)\1{3,}/u.test(pw)) return "Şifrede aynı karakter art arda dört kez tekrar edemez.";
  const parts = personal
    .flatMap((p) => p.toLocaleLowerCase("tr").split(/\s+/))
    .map((p) => p.replace(/\D/g, "").length >= 7 ? p.replace(/\D/g, "").slice(-7) : p)
    .filter((p) => p.length >= 3);
  if (parts.some((p) => lower.includes(p))) {
    return "Şifre adınızı, soyadınızı veya telefon numaranızı içermemeli.";
  }
  return null;
}
