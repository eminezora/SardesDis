import type { Metadata } from "next";
import { clinic } from "@/config/site";
import { Container } from "@/components/Container";
import { Divider } from "@/components/Motifs";
import { PageHeader } from "@/components/PageHeader";
import { ClinicGallery, ContactSection, PrinciplesList } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Kliniğimiz",
  description: `${clinic.name} hakkında: hasta iletişimi, anlaşılır bilgilendirme ve kişiye göre tedavi planlaması.`,
  alternates: { canonical: "/klinigimiz" },
};

export default function ClinicPage() {
  return (
    <>
      <PageHeader eyebrow="Kliniğimiz" title={clinic.name}>
        <p>
          {clinic.city}, {clinic.region}’de ağız ve diş sağlığınıza yönelik
          değerlendirme ve tedavi süreçlerinde yanınızdayız.
        </p>
      </PageHeader>

      <section className="py-20 md:py-32">
        <Container>
          <div className="grid gap-12 md:grid-cols-[5fr_7fr] md:gap-20">
            <h2 className="text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3rem]">
              Yaklaşımımız
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-ink/85">
              <p>
                Diş hekimine gitmek, çoğu zaman sorularla ve kimi zaman
                kaygıyla başlar. Bu nedenle ilk adımı sizi dinlemek olarak
                görüyoruz: şikâyetlerinizi, beklentilerinizi ve aklınızdaki
                soruları acele etmeden konuşuruz.
              </p>
              <p>
                Muayene sonrasında bulguları ve olası seçenekleri sade bir dille
                paylaşırız. Her seçeneğin size ne ifade ettiğini anlamanız,
                karar sürecinin doğal bir parçasıdır.
              </p>
              <p>
                Tedavi planını ağız sağlığınıza ve ihtiyaçlarınıza göre
                oluştururuz. Plan, sorularınız yanıtlandıktan sonra sizinle
                birlikte netleşir; süreç boyunca sizi her adımda
                bilgilendiririz.
              </p>
            </div>
          </div>

          <Divider className="my-20 md:my-28" />

          <PrinciplesList />
        </Container>
      </section>

      <ClinicGallery />
      <ContactSection />
    </>
  );
}
