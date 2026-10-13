import type { Metadata } from "next";
import { clinic, contact } from "@/config/site";
import { Container } from "@/components/Container";
import { ContactActions } from "@/components/ContactActions";
import { ContactDetails } from "@/components/ContactDetails";
import { PageHeader } from "@/components/PageHeader";
import { MapEmbed } from "@/components/Sections";

export const metadata: Metadata = {
  title: "İletişim",
  description: `${clinic.name} iletişim bilgileri — ${clinic.city}, ${clinic.region}.`,
  alternates: { canonical: "/iletisim" },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="İletişim" title="Bize ulaşın">
        <p>Randevu ve bilgi almak için kliniğimizle iletişime geçebilirsiniz.</p>
      </PageHeader>

      <section className="py-16 md:py-24">
        <Container>
          <div className="grid gap-14 lg:grid-cols-[5fr_6fr] lg:gap-24">
            <ContactDetails />
            <div className="lg:border-l lg:border-stone-deep lg:pl-16">
              <h2 className="text-[2rem] text-ink md:text-[2.5rem]">Randevu ve bilgi</h2>
              <p className="mt-4 max-w-md text-muted">
                Randevu almak veya sorularınızı iletmek için telefonla
                ulaşabilirsiniz. Lütfen sağlık bilgilerinizi mesajla
                paylaşmayın; bu konuları muayenede konuşuruz.
              </p>
              <div className="mt-8">
                <ContactActions />
              </div>
              {contact.phone.isPlaceholder && (
                <p className="mt-5 text-sm text-muted">
                  Gösterilen numara örnek numaradır; gerçek iletişim bilgisi
                  eklendiğinde arama etkinleşecektir.
                </p>
              )}
            </div>
          </div>
          {contact.map.embedUrl && (
            <div className="mt-16 md:mt-24">
              <MapEmbed />
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
