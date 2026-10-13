import { clinic, contact, doctors } from "@/config/site";

/**
 * Yapılandırılmış veri (schema.org Dentist).
 * Örnek telefon ve doğrulanmamış sokak adresi EKLENMEZ.
 */
export function JsonLd() {
  const address: Record<string, string> = {
    "@type": "PostalAddress",
    addressLocality: contact.address.district,
    addressRegion: contact.address.province,
    addressCountry: "TR",
  };
  if (contact.address.verified) {
    address.streetAddress = [contact.address.street, contact.address.buildingNo]
      .filter(Boolean)
      .join(" No: ");
    if (contact.address.postalCode) address.postalCode = contact.address.postalCode;
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: clinic.name,
    address,
    areaServed: `${clinic.city}, ${clinic.region}`,
    employee: doctors.map((d) => ({ "@type": "Person", name: d.name, jobTitle: d.title })),
  };
  if (clinic.siteUrl) data.url = clinic.siteUrl;
  if (!contact.phone.isPlaceholder) data.telephone = contact.phone.e164;
  if (contact.email) data.email = contact.email;
  if (contact.map.directionsUrl) data.hasMap = contact.map.directionsUrl;
  if (contact.social.length) data.sameAs = contact.social.map((s) => s.url);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
