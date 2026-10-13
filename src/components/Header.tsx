"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigation } from "@/config/navigation";
import { contact } from "@/config/site";
import { bookingOpen } from "@/lib/booking-status";
import { Logo } from "./Logo";
import { Container } from "./Container";

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Not: menü açıkken başlığa backdrop-filter verilmez; aksi halde sabit
  // konumlu panel başlığın içine hapsolur.

  // Sayfa değişince menüyü kapat
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Açıkken: kaydırmayı kilitle, Esc ile kapat, odağı menü içinde tut
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = [
        toggleRef.current,
        ...panelRef.current.querySelectorAll<HTMLElement>("a"),
      ].filter(Boolean) as HTMLElement[];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Masaüstü genişliğine geçilince mobil menüyü kapat
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 pt-[env(safe-area-inset-top)] transition-[background-color,border-color] duration-300 ${
        open
          ? "border-b border-stone-deep/70 bg-ivory"
          : scrolled
            ? "border-b border-stone-deep/70 bg-ivory/95 backdrop-blur-sm"
            : "border-b border-transparent bg-ivory"
      }`}
    >
      <a
        href="#icerik"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-forest focus:px-4 focus:py-2 focus:text-paper"
      >
        İçeriğe geç
      </a>
      <Container className="flex h-20 items-center justify-between lg:h-24">
        <Link href="/" aria-label="Sardes Diş Kliniği — Ana Sayfa" className="shrink-0">
          <Logo priority />
        </Link>

        <nav aria-label="Ana menü" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navigation.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative py-2 text-[0.9375rem] tracking-[0.01em] transition-colors duration-300 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300 ${
                      active
                        ? "text-forest after:scale-x-100"
                        : "text-ink/80 after:scale-x-0 hover:text-forest hover:after:scale-x-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {bookingOpen && (
          <Link
            href="/randevu"
            className="hidden min-h-11 items-center rounded-[2px] border border-forest px-5 text-[0.9375rem] font-medium text-forest transition-colors duration-300 hover:bg-forest hover:text-paper lg:inline-flex"
          >
            Randevu Al
          </Link>
        )}

        <button
          ref={toggleRef}
          type="button"
          className="-mr-2 flex h-12 w-12 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls="mobil-menu"
          aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative block h-3 w-7" aria-hidden="true">
            <span
              className={`absolute left-0 h-px w-7 bg-ink transition-transform duration-300 ${
                open ? "top-1.5 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 h-px w-7 bg-ink transition-transform duration-300 ${
                open ? "top-1.5 -rotate-45" : "top-3"
              }`}
            />
          </span>
        </button>
      </Container>

      <div
        id="mobil-menu"
        ref={panelRef}
        hidden={!open}
        className="fixed inset-x-0 bottom-0 top-[calc(5rem+env(safe-area-inset-top))] overflow-y-auto bg-ivory lg:hidden"
      >
        <nav aria-label="Mobil menü">
          <Container>
            <ul className="border-t border-stone-deep/70 py-4">
              {navigation.map((item, i) => {
                const active = isActive(pathname, item.href);
                return (
                  <li key={item.href} className="border-b border-stone-deep/50">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className="flex items-baseline gap-5 py-5"
                    >
                      <span className="w-6 text-xs tabular-nums lining-nums text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`font-serif text-[1.75rem] leading-none ${
                          active ? "text-forest" : "text-ink"
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {bookingOpen && (
              <Link
                href="/randevu"
                className="mt-4 flex min-h-12 items-center justify-center rounded-[2px] bg-forest text-[0.9375rem] font-medium text-paper"
              >
                Online Randevu Al
              </Link>
            )}
            <p className="pb-10 pt-6 text-sm text-muted">
              {contact.address.display}
            </p>
          </Container>
        </nav>
      </div>
    </header>
  );
}
