import type { ReactNode } from "react";
import { Container } from "./Container";
import { ArchPanel } from "./Motifs";

/** İç sayfaların sakin başlık alanı */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-stone-deep/70">
      <ArchPanel className="pointer-events-none absolute -bottom-6 right-[-4rem] hidden h-[130%] opacity-60 md:block lg:right-[4%]" />
      <Container className="relative pb-16 pt-14 md:pb-24 md:pt-24">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-6 max-w-3xl text-[2.75rem] text-ink sm:text-[3.5rem] md:text-[4.25rem]">
          {title}
        </h1>
        {children && (
          <div className="mt-7 max-w-2xl text-lg leading-relaxed text-muted">
            {children}
          </div>
        )}
      </Container>
    </section>
  );
}

/** Bölüm başlığı */
export function SectionHeading({
  eyebrow,
  title,
  children,
  as: Tag = "h2",
  className = "",
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={className}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-5 text-[2.25rem] text-ink sm:text-[2.75rem] md:text-[3.25rem]">
        {title}
      </Tag>
      {children && <div className="mt-6 max-w-xl text-muted">{children}</div>}
    </div>
  );
}
