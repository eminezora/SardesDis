import Image from "next/image";
import type { Doctor } from "@/config/site";
import { initials } from "@/lib/content";

/**
 * Hekim tanıtımı. Fotoğraf yoksa isim baş harfleri kemer içinde gösterilir
 * (sahte portre kullanılmaz). Özgeçmiş alanları yalnızca doluysa görünür.
 */
export function DoctorCard({
  doctor,
  detailed = false,
  headingLevel = "h3",
}: {
  doctor: Doctor;
  detailed?: boolean;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const sections = [
    { label: "Eğitim", items: doctor.education },
    { label: "İlgi alanları", items: doctor.focusAreas },
    { label: "Yabancı dil", items: doctor.languages },
  ].filter((s) => s.items.length > 0);

  return (
    <article id={doctor.slug} className="flex flex-col scroll-mt-28">
      <div className={`relative overflow-hidden bg-stone ${doctor.photo ? "aspect-[4/5]" : "aspect-[5/4] sm:aspect-[4/5] lg:aspect-[6/5]"}`}>
        {doctor.photo ? (
          <Image
            src={doctor.photo.src}
            alt={doctor.photo.alt}
            width={doctor.photo.width}
            height={doctor.photo.height}
            sizes="(min-width: 768px) 40vw, 100vw"
            className="h-full w-full object-cover"
          />
        ) : (
          <div aria-hidden="true" className="absolute inset-0 flex items-end justify-center">
            <svg viewBox="0 0 300 375" className="absolute inset-0 h-full w-full" fill="none" preserveAspectRatio="xMidYMax slice">
              <path d="M60 375V170a90 90 0 0 1 180 0v205" stroke="var(--color-gold)" strokeWidth="0.8" />
              <path d="M72 375V170a78 78 0 0 1 156 0v205" stroke="var(--color-stone-deep)" strokeWidth="1" />
            </svg>
            <span className="relative mb-[16%] sm:mb-[22%] font-serif text-[clamp(4rem,9vw,6rem)] font-normal leading-none tracking-[0.06em] text-forest/85">
              {initials(doctor.name)}
            </span>
          </div>
        )}
      </div>

      <div className="pt-7">
        <p className="eyebrow">{doctor.title}</p>
        <Heading className="mt-3 text-[2rem] text-ink md:text-[2.375rem]">
          {doctor.name}
        </Heading>

        {detailed && doctor.about && (
          <p className="mt-5 max-w-prose text-muted">{doctor.about}</p>
        )}

        {detailed && sections.length > 0 && (
          <dl className="mt-6 space-y-4 border-t border-stone-deep pt-6">
            {sections.map((s) => (
              <div key={s.label} className="grid gap-1 sm:grid-cols-[9rem_1fr]">
                <dt className="text-sm font-medium text-ink">{s.label}</dt>
                <dd className="text-muted">{s.items.join(", ")}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </article>
  );
}
