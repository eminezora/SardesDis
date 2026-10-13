import type { ReactNode } from "react";
import { contact } from "@/config/site";
import { PhoneLine } from "./ContactActions";

/** Adres, telefon ve yalnızca girilmiş olan diğer iletişim bilgileri */
export function ContactDetails({ dark = false }: { dark?: boolean }) {
  const label = dark ? "text-champagne" : "text-muted";
  const value = dark ? "text-paper" : "text-ink";
  const rows: { term: string; node: ReactNode; note?: string }[] = [
    {
      term: "Adres",
      node: contact.address.display,
      note: contact.address.verified ? undefined : "Geçici adres bilgisidir.",
    },
    { term: "Telefon", node: <PhoneLine dark={dark} /> },
  ];
  if (contact.email) {
    rows.push({
      term: "E-posta",
      node: (
        <a href={`mailto:${contact.email}`} className="underline decoration-gold/70 underline-offset-4">
          {contact.email}
        </a>
      ),
    });
  }
  if (contact.hours?.length) {
    rows.push({
      term: "Çalışma saatleri",
      node: (
        <ul>
          {contact.hours.map((h) => (
            <li key={h.days}>
              {h.days}: {h.hours}
            </li>
          ))}
        </ul>
      ),
    });
  }
  if (contact.social.length) {
    rows.push({
      term: "Sosyal medya",
      node: (
        <ul className="flex flex-wrap gap-x-5">
          {contact.social.map((s) => (
            <li key={s.url}>
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-gold/70 underline-offset-4">
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      ),
    });
  }

  return (
    <dl className="space-y-7">
      {rows.map((r) => (
        <div key={r.term}>
          <dt className={`text-xs font-medium uppercase tracking-[0.2em] ${label}`}>{r.term}</dt>
          <dd className={`mt-2 text-lg ${value}`}>{r.node}</dd>
          {r.note && <dd className={`mt-1 text-sm ${dark ? "text-paper/70" : "text-muted"}`}>{r.note}</dd>}
        </div>
      ))}
    </dl>
  );
}
