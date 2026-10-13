import Link from "next/link";
import { navigation } from "@/config/navigation";
import { clinic, contact } from "@/config/site";
import { bookingOpen } from "@/lib/booking-status";
import { Container } from "./Container";
import { Logo } from "./Logo";
import { PhoneLine } from "./ContactActions";

export function Footer() {
  return (
    <footer className="on-dark bg-forest-deep text-paper">
      <Container className="py-16 md:py-20">
        <div className="grid gap-12 md:grid-cols-[1.3fr_1fr_1fr]">
          <div>
            <Logo inverted sizeClass="h-28" />
            <p className="mt-6 max-w-xs text-[0.9375rem] leading-relaxed text-paper/75">
              {clinic.city}, {clinic.region}’de ağız ve diş sağlığınıza yönelik
              değerlendirme ve tedavi süreçlerinde yanınızdayız.
            </p>
          </div>

          <nav aria-label="Alt menü">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-champagne">Sayfalar</p>
            <ul className="mt-5 grid gap-2.5 text-[0.9375rem]">
              {navigation.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="text-paper/85 transition-colors hover:text-champagne">
                    {n.label}
                  </Link>
                </li>
              ))}
              {bookingOpen && (
                <li className="mt-3 border-t border-paper/15 pt-4">
                  <Link href="/randevu" className="text-paper/85 transition-colors hover:text-champagne">
                    Online Randevu
                  </Link>
                  <span className="text-paper/40"> · </span>
                  <Link href="/giris" className="text-paper/85 transition-colors hover:text-champagne">
                    Hesabım
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-champagne">İletişim</p>
            <address className="mt-5 space-y-3 text-[0.9375rem] not-italic text-paper/85">
              <p>{contact.address.display}</p>
              <p>
                <PhoneLine dark />
              </p>
            </address>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-paper/15 pt-8 text-xs text-paper/60 md:flex-row md:justify-between">
          <p>© {new Date().getFullYear()} {clinic.name}</p>
          <p>Sitedeki bilgiler genel bilgilendirme amaçlıdır; muayenenin yerini tutmaz.</p>
        </div>
      </Container>
    </footer>
  );
}
