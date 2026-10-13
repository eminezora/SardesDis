import type { Metadata } from "next";
import { clinic } from "@/config/site";
import { previewDrafts, visibleTreatments } from "@/lib/content";
import { Container } from "@/components/Container";
import { PageHeader } from "@/components/PageHeader";
import { TreatmentDetails } from "@/components/TreatmentList";
import { ContactSection, TreatmentProcess } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Tedaviler",
  description: `${clinic.name} tedavi alanları hakkında genel bilgiler. Size uygun tedavi muayene sonrasında belirlenir.`,
  alternates: { canonical: "/tedaviler" },
};

export default function TreatmentsPage() {
  const items = visibleTreatments;
  return (
    <>
      <PageHeader eyebrow="Tedaviler" title="Tedavi alanları">
        <p>
          Bu sayfadaki açıklamalar genel bilgilendirme amaçlıdır. Size uygun
          tedavi, muayene ve gerekli değerlendirmeler sonrasında belirlenir;
          tedavinin süreci ve sonucu kişiden kişiye farklılık gösterebilir.
        </p>
      </PageHeader>

      <section className="py-16 md:py-24">
        <Container>
          {previewDrafts && (
            <p className="mb-10 border border-dashed border-muted/50 bg-paper px-5 py-4 text-sm text-muted">
              Geliştirme önizlemesi: “Taslak” etiketli tedaviler yalnızca bu
              ortamda görünür. Yayında görünmeleri için <code>src/config/site.ts</code>{" "}
              dosyasında <code>approved: true</code> yapın.
            </p>
          )}
          {items.length > 0 ? (
            <TreatmentDetails items={items} />
          ) : (
            <div className="grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-20">
              <h2 className="text-[2.25rem] text-ink md:text-[2.75rem]">
                Tedavi süreci nasıl ilerler?
              </h2>
              <TreatmentProcess />
            </div>
          )}
        </Container>
      </section>

      <ContactSection />
    </>
  );
}
