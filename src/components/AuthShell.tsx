import type { ReactNode } from "react";
import { Container } from "./Container";
import { ArchMark } from "./Motifs";

/** Giriş, kayıt ve hesap sayfaları için sade çerçeve */
export function AuthShell({
  eyebrow,
  title,
  intro,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <Container className="py-14 md:py-24">
      <div className={`mx-auto ${wide ? "max-w-5xl" : "max-w-xl"}`}>
        <ArchMark className="h-9 w-7" />
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="mt-5 text-[2.5rem] text-ink md:text-[3.25rem]">{title}</h1>
        {intro && <div className="mt-5 text-muted">{intro}</div>}
        <div className="mt-10">{children}</div>
      </div>
    </Container>
  );
}
