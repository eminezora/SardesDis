import Image from "next/image";
import Link from "next/link";
import { clinic, contact, doctors, faqs } from "@/config/site";
import { visibleTreatments } from "@/lib/content";
import { ArrowRight, ButtonLink } from "./ButtonLink";
import { ContactActions } from "./ContactActions";
import { ContactDetails } from "./ContactDetails";
import { Container } from "./Container";
import { DoctorCard } from "./DoctorCard";
import { FaqAccordion } from "./FaqAccordion";
import { FluteTexture } from "./Motifs";
import { TreatmentIndex } from "./TreatmentList";

/* Yaklaşımımız — üç ilke (yalnızca tutum anlatır, iddia içermez) */
export const principles = [
  {
    title: "Dinlemek",
    text: "Her görüşmeye şikâyetlerinizi, beklentilerinizi ve sorularınızı dinleyerek başlarız.",
  },
  {
    title: "Anlaşılır bilgilendirme",
    text: "Muayene bulgularını ve olası seçenekleri sade bir dille, acele etmeden anlatırız.",
  },
  {
    title: "Kişiye göre planlama",
    text: "Tedavi planını ağız sağlığınıza ve ihtiyaçlarınıza göre, sizinle birlikte oluştururuz.",
  },
];

export function PrinciplesList() {
  return (
    <ol className="grid gap-px overflow-hidden border border-stone-deep bg-stone-deep md:grid-cols-3">
      {principles.map((p, i) => (
        <li key={p.title} className="bg-paper p-8 md:p-10">
          <span className="font-serif text-lg italic text-muted">
            {["I", "II", "III"][i]}
          </span>
          <h3 className="mt-6 text-[1.75rem] text-ink">{p.title}</h3>
          <p className="mt-3 text-[0.9375rem] text-muted">{p.text}</p>
        </li>
      ))}
    </ol>
  );
}

export function ClinicIntroSection() {
  return (
    <section aria-labelledby="klinik-baslik" className="py-24 md:py-36">
      <Container>
        <div className="grid gap-12 md:grid-cols-[5fr_7fr] md:gap-20">
          <div>
            <p className="eyebrow">Kliniğimiz</p>
            <h2 id="klinik-baslik" className="mt-5 text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3.25rem]">
              Sakin bir ortamda, açık bir iletişimle.
            </h2>
          </div>
          <div className="md:pt-14">
            <p className="text-lg leading-relaxed text-ink/85">
              {clinic.name}, {clinic.city}’de ağız ve diş sağlığı alanında
              hizmet veren bir kliniktir. Her hastanın ihtiyacının farklı
              olduğunu bilerek, değerlendirmeden tedaviye kadar her adımı
              anlaşılır biçimde paylaşmayı önemsiyoruz.
            </p>
            <Link
              href="/klinigimiz"
              className="mt-8 inline-flex items-center gap-3 border-b border-gold pb-1 text-[0.9375rem] font-medium text-forest transition-colors hover:border-forest"
            >
              Kliniğimizi tanıyın <ArrowRight />
            </Link>
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <PrinciplesList />
        </div>
      </Container>
    </section>
  );
}

export function DoctorsSection({ detailed = false, asPage = false }: { detailed?: boolean; asPage?: boolean }) {
  return (
    <section aria-labelledby={asPage ? undefined : "hekim-baslik"} className={asPage ? "py-20 md:py-28" : "bg-stone/60 py-24 md:py-36"}>
      <Container>
        {!asPage && (
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">Hekimlerimiz</p>
              <h2 id="hekim-baslik" className="mt-5 text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3.25rem]">
                Sizi karşılayan hekimlerimiz
              </h2>
            </div>
            <ButtonLink href="/hekimlerimiz" variant="outline" className="self-start md:self-auto">
              Hekimlerimizi tanıyın <ArrowRight />
            </ButtonLink>
          </div>
        )}
        <div className={`grid gap-14 sm:grid-cols-2 sm:gap-8 lg:gap-16 ${asPage ? "" : "mt-14 md:mt-20"}`}>
          {doctors.map((d) => (
            <DoctorCard key={d.slug} doctor={d} detailed={detailed} headingLevel={asPage ? "h2" : "h3"} />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function TreatmentsSection() {
  const items = visibleTreatments;
  return (
    <section aria-labelledby="tedavi-baslik" className="py-24 md:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-20">
          <div>
            <p className="eyebrow">Tedaviler</p>
            <h2 id="tedavi-baslik" className="mt-5 text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3.25rem]">
              Size uygun tedavi, muayeneyle belirlenir.
            </h2>
            <p className="mt-6 max-w-sm text-muted">
              Aşağıdaki bilgiler genel bilgilendirme amaçlıdır. Hangi tedavinin
              sizin için uygun olduğu, muayene sonrasında birlikte belirlenir.
            </p>
            <div className="mt-8">
              <ButtonLink href="/tedaviler" variant="outline">
                Tedavi alanları <ArrowRight />
              </ButtonLink>
            </div>
          </div>
          {items.length > 0 ? (
            <TreatmentIndex items={items} />
          ) : (
            <TreatmentProcess />
          )}
        </div>
      </Container>
    </section>
  );
}

/** Onaylı tedavi yokken gösterilen genel süreç anlatımı */
export function TreatmentProcess() {
  const steps = [
    ["Görüşme", "Şikâyetlerinizi ve beklentilerinizi dinleriz."],
    ["Muayene", "Ağız içi muayene yapılır; gerekirse ek değerlendirme istenir."],
    ["Bilgilendirme", "Bulgular ve olası seçenekler size anlaşılır biçimde aktarılır."],
    ["Planlama", "Tedavi planı, sorularınız yanıtlandıktan sonra birlikte oluşturulur."],
  ];
  return (
    <ol className="border-t border-stone-deep">
      {steps.map(([t, d], i) => (
        <li key={t} className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-b border-stone-deep py-6 md:grid-cols-[4rem_14rem_1fr] md:gap-x-8 md:py-8">
          <span className="pt-1.5 text-xs tabular-nums lining-nums text-muted">{String(i + 1).padStart(2, "0")}</span>
          <span className="font-serif text-[1.625rem] leading-tight text-ink md:text-[1.875rem]">{t}</span>
          <span className="col-start-2 mt-2 text-[0.9375rem] text-muted md:col-start-3 md:mt-1">{d}</span>
        </li>
      ))}
    </ol>
  );
}

export function FaqSection({ limit }: { limit?: number }) {
  const items = limit ? faqs.slice(0, limit) : faqs;
  return (
    <section aria-labelledby="sss-baslik" className="border-t border-stone-deep/70 py-24 md:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[4fr_8fr] lg:gap-20">
          <div>
            <p className="eyebrow">Sık Sorulan Sorular</p>
            <h2 id="sss-baslik" className="mt-5 text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3.25rem]">
              Merak ettikleriniz
            </h2>
            {limit && (
              <Link
                href="/sik-sorulan-sorular"
                className="mt-8 inline-flex items-center gap-3 border-b border-gold pb-1 text-[0.9375rem] font-medium text-forest transition-colors hover:border-forest"
              >
                Tüm sorular <ArrowRight />
              </Link>
            )}
          </div>
          <FaqAccordion items={items} />
        </div>
      </Container>
    </section>
  );
}

export function ContactSection({ headingLevel = "h2" }: { headingLevel?: "h1" | "h2" }) {
  const Heading = headingLevel;
  return (
    <section aria-labelledby="iletisim-baslik" className="on-dark relative overflow-hidden bg-forest text-paper">
      <FluteTexture className="absolute inset-0 text-paper opacity-[0.035]" />
      <Container className="relative py-24 md:py-32">
        <div className="grid gap-14 lg:grid-cols-[6fr_5fr] lg:gap-24">
          <div>
            <p className="eyebrow !text-champagne">İletişim</p>
            <Heading id="iletisim-baslik" className="mt-5 text-[2.5rem] text-paper sm:text-[3rem] md:text-[3.75rem]">
              Sorularınız için bize ulaşın.
            </Heading>
            <p className="mt-6 max-w-md text-paper/80">
              Randevu ve bilgi almak için kliniğimizle iletişime geçebilirsiniz.
            </p>
            <div className="mt-10">
              <ContactActions dark />
            </div>
          </div>
          <div className="lg:border-l lg:border-paper/15 lg:pl-16">
            <ContactDetails dark />
          </div>
        </div>
      </Container>
    </section>
  );
}

/** Harita: yalnızca gerçek konum bağlantısı girildiğinde görünür */
export function MapEmbed() {
  if (!contact.map.embedUrl) return null;
  return (
    <div className="aspect-[16/10] w-full overflow-hidden border border-stone-deep bg-stone md:aspect-[21/9]">
      <iframe
        src={contact.map.embedUrl}
        title={`${clinic.name} konumu`}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}

/** Gerçek klinik fotoğrafları: liste boşsa bölüm hiç görünmez */
export function ClinicGallery() {
  if (clinic.photos.length === 0) return null;
  return (
    <section aria-label="Klinikten görüntüler" className="pb-24 md:pb-36">
      <Container>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clinic.photos.map((p, i) => (
            <li key={p.src} className={i === 0 ? "sm:col-span-2" : ""}>
              <Image
                src={p.src}
                alt={p.alt}
                width={p.width}
                height={p.height}
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="h-full w-full object-cover"
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
