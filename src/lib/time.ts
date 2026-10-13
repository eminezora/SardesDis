/**
 * Tarih/saat yardımcıları. Türkiye 2016'dan beri yaz saati uygulamadan
 * sabit UTC+3 kullandığı için İstanbul saati basit bir kaymayla hesaplanır.
 * Tarihler "YYYY-AA-GG", saatler "SS:DD" metni olarak saklanır.
 */
const OFFSET_MS = 3 * 60 * 60 * 1000;

/** İstanbul'daki yerel tarih/saati UTC zaman damgasına çevirir */
export function toEpoch(date: string, time = "00:00"): number {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm) - OFFSET_MS;
}

/** Bir zaman damgasının İstanbul'daki tarihi */
export function istanbulDate(epoch = Date.now()): string {
  return new Date(epoch + OFFSET_MS).toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 1 = Pazartesi … 7 = Pazar */
export function isoWeekday(date: string): 1 | 2 | 3 | 4 | 5 | 6 | 7 {
  const [y, m, d] = date.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return (w === 0 ? 7 : w) as 1 | 2 | 3 | 4 | 5 | 6 | 7;
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function fromMinutes(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const longFmt = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortFmt = new Intl.DateTimeFormat("tr-TR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function utcDate(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** "14 Ekim 2026 Çarşamba" */
export function formatDateLong(date: string): string {
  return longFmt.format(utcDate(date));
}

/** "Çar 14 Eki" */
export function formatDateShort(date: string): string {
  return shortFmt.format(utcDate(date));
}
