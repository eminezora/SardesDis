import type { Metadata } from "next";
import { clinic, doctors } from "@/config/site";
import { PageHeader } from "@/components/PageHeader";
import { ContactSection, DoctorsSection } from "@/components/Sections";

export const metadata: Metadata = {
  title: "Hekimlerimiz",
  description: `${clinic.name} hekimleri: ${doctors.map((d) => `${d.title} ${d.name}`).join(" ve ")}.`,
  alternates: { canonical: "/hekimlerimiz" },
};

export default function DoctorsPage() {
  return (
    <>
      <PageHeader eyebrow="Hekimlerimiz" title="Hekimlerimiz">
        <p>
          {clinic.name}’nde {doctors.map((d) => `${d.title.toLocaleLowerCase("tr")} ${d.name}`).join(" ve ")} sizi
          karşılıyor.
        </p>
      </PageHeader>
      <DoctorsSection detailed asPage />
      <ContactSection />
    </>
  );
}
