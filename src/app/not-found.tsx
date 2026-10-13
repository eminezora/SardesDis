import { ButtonLink } from "@/components/ButtonLink";
import { Container } from "@/components/Container";

export default function NotFound() {
  return (
    <Container className="py-28 md:py-40">
      <p className="eyebrow">Sayfa bulunamadı</p>
      <h1 className="mt-6 text-[2.75rem] md:text-[4rem]">Aradığınız sayfaya ulaşılamadı.</h1>
      <div className="mt-10">
        <ButtonLink href="/">Ana Sayfaya Dön</ButtonLink>
      </div>
    </Container>
  );
}
