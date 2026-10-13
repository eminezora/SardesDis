import Image from "next/image";
import type { Metadata } from "next";
import { clinic, contact, doctors } from "@/config/site";
import { ButtonLink, ArrowRight } from "@/components/ButtonLink";
import { Container } from "@/components/Container";
import { ArchMark, ArchPanel } from "@/components/Motifs";
import {
  ClinicIntroSection,
  ContactSection,
  DoctorsSection,
  FaqSection,
  TreatmentsSection,
} from "@/components/Sections";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const heroPhoto = clinic.photos[0];

  return (
    <>
      {/* İlk ekran */}
      <section className="relative overflow-hidden">
        <Container className="grid items-center gap-14 pb-16 pt-10 sm:pt-14 lg:min-h-[calc(100svh-6rem)] lg:grid-cols-12 lg:gap-8 lg:py-16">
          <div className="lg:col-span-7 lg:pr-8">
            <ArchMark className="h-9 w-7 lg:hidden" />
            <p className="eyebrow mt-6 lg:mt-0">
              {clinic.city} · {clinic.region}
            </p>
            <h1 className="mt-7 text-[clamp(2.75rem,9.5vw,4.875rem)] leading-[1.04] text-ink">
              Gülüşünüze özen,
              <br />
              <em className="font-normal text-bronze">sağlığınıza değer.</em>
            </h1>
            <p className="mt-8 max-w-[34rem] text-lg leading-relaxed text-muted md:text-xl md:leading-relaxed">
              Salihli’de ağız ve diş sağlığınıza yönelik değerlendirme ve
              tedavi süreçlerinde yanınızdayız.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/hekimlerimiz">
                Hekimlerimiz <ArrowRight />
              </ButtonLink>
              <ButtonLink href="/iletisim" variant="outline">
                İletişime Geçin
              </ButtonLink>
            </div>

            <dl className="mt-14 grid gap-6 border-t border-stone-deep pt-7 text-[0.9375rem] sm:grid-cols-2 lg:mt-20">
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  Hekimlerimiz
                </dt>
                <dd className="mt-2 text-ink">
                  {doctors.map((d) => `Dt. ${d.name}`).join(" · ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-[0.2em] text-muted">
                  Adres
                </dt>
                <dd className="mt-2 text-ink">{contact.address.display}</dd>
              </div>
            </dl>
          </div>

          {/* Kemer: gerçek klinik fotoğrafı eklenirse içinde görünür */}
          <div className="hidden lg:col-span-5 lg:block">
            <figure className="relative ml-auto w-full max-w-[26rem]">
              <div className="relative aspect-[2/3] max-h-[72svh] overflow-hidden rounded-t-[999px] bg-[#181818]">
                {heroPhoto ? (
                  <Image
                    src={heroPhoto.src}
                    alt={heroPhoto.alt}
                    fill
                    priority
                    sizes="26rem"
                    className="object-cover"
                  />
                ) : (
                  <>
                    <ArchPanel className="absolute inset-x-0 bottom-0 h-full w-full opacity-40" />
                    {clinic.logo && (
                      <Image
                        src={clinic.logo.src}
                        width={clinic.logo.width}
                        height={clinic.logo.height}
                        alt=""
                        priority
                        sizes="18rem"
                        className="absolute left-1/2 top-[44%] w-[72%] -translate-x-1/2 -translate-y-1/2"
                      />
                    )}
                  </>
                )}
              </div>
              <span aria-hidden="true" className="absolute -left-6 top-1/3 h-px w-12 bg-gold" />
              <figcaption className="mt-5 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-muted">
                <span>{clinic.shortName}</span>
                <span>{clinic.city}</span>
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <ClinicIntroSection />
      <DoctorsSection />
      <TreatmentsSection />
      <FaqSection limit={3} />
      <ContactSection />
    </>
  );
}
