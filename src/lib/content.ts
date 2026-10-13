import { clinic, contact, treatments, type Doctor } from "@/config/site";

/* İletişim -------------------------------------------------------- */

/** Telefon, örnek numara değiştirilene kadar aranamaz. */
export const phoneActive = !contact.phone.isPlaceholder;

export const telHref = phoneActive ? `tel:${contact.phone.e164}` : null;

const waDigits = contact.whatsapp?.replace(/\D/g, "") ?? "";
/** WhatsApp, gerçek bir numara girilmeden etkinleşmez. */
export const whatsappHref =
  phoneActive && waDigits.length >= 10 ? `https://wa.me/${waDigits}` : null;

export const directionsHref = contact.map.directionsUrl;

/* Tedaviler ------------------------------------------------------- */

/**
 * Taslak önizleme yalnızca geliştirme sunucusunda çalışır.
 * Yayın derlemesinde onaylanmamış tedaviler her koşulda gizlenir.
 */
export const previewDrafts =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_PREVIEW_DRAFTS === "1";

export const visibleTreatments = treatments.filter(
  (t) => t.approved || previewDrafts,
);

/* Hekimler -------------------------------------------------------- */

export function hasProfileDetails(d: Doctor) {
  return Boolean(
    d.about ||
      d.education.length ||
      d.focusAreas.length ||
      d.languages.length,
  );
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("");
}

/* SEO ------------------------------------------------------------- */

/** Alan adı girilmediyse yerel geliştirme adresi kullanılır. */
export const baseUrl = clinic.siteUrl ?? "http://localhost:3000";

export const siteTitle = `${clinic.name} — ${clinic.city}, ${clinic.region}`;
