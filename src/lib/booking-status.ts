import { booking, contact, devPreviewSchedule, legal } from "@/config/site";

/**
 * Geliştirme sunucusunda online randevuyu ÖRNEK takvimle denemek için.
 * Yayın derlemesinde bu değer her zaman `false` olur.
 */
export const previewBooking =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PREVIEW_BOOKING === "1";

/** Online randevuyu yayında açmadan önce eksik olanlar */
export const bookingMissing: string[] = [
  !booking.schedule && "Randevu takvimi (booking.schedule)",
  legal.kvkkText.length === 0 && "KVKK aydınlatma metni (legal.kvkkText)",
  !legal.dataController && "Veri sorumlusu (legal.dataController)",
].filter((x): x is string => Boolean(x));

/**
 * Önerilen ama randevuyu engellemeyen eksikler. Örnek telefon numarası
 * sitede "örnek numara" olarak gösterilir ve aranamaz.
 */
export const bookingWarnings: string[] = [
  contact.phone.isPlaceholder && "Gerçek telefon numarası",
].filter((x): x is string => Boolean(x));

/** Hasta kaydı, giriş ve online randevu ziyaretçiye açık mı */
export const bookingOpen =
  previewBooking || (booking.enabled && bookingMissing.length === 0);

/** Kullanılacak takvim: gerçek takvim, yoksa yalnızca önizlemede örnek takvim */
export const activeSchedule =
  booking.schedule ?? (previewBooking ? devPreviewSchedule : null);
