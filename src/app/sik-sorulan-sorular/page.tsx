import type { Metadata } from "next";
import { clinic } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { ContactSection } from "@/components/Sections";
import { Container } from "@/components/Container";
import { FaqAccordion } from "@/components/FaqAccordion";
import { faqs } from "@/config/site";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
  description: `${clinic.name}: ilk muayene, randevu öncesi hazırlık ve tedavi planlaması hakkında sık sorulan sorular.`,
  alternates: { canonical: "/sik-sorulan-sorular" },
};

export default function FaqPage() {
  return (
    <>
      <PageHeader eyebrow="Sık Sorulan Sorular" title="Merak ettikleriniz">
        <p>
          İlk muayene, randevu öncesi hazırlık ve tedavi planlaması hakkında
          kısa yanıtlar. Aklınıza takılan başka bir konu olursa bizimle
          iletişime geçebilirsiniz.
        </p>
      </PageHeader>
      <section className="py-16 md:py-24">
        <Container className="max-w-[56rem]">
          <FaqAccordion items={faqs} />
        </Container>
      </section>
      <ContactSection />
    </>
  );
}
