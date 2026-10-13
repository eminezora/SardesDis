import { contact } from "@/config/site";
import { directionsHref, telHref, whatsappHref } from "@/lib/content";
import { bookingOpen } from "@/lib/booking-status";
import { ButtonLink, DisabledButton } from "./ButtonLink";

function PhoneIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 3.5h3.2l1.6 4-2 1.3a11 11 0 0 0 5.4 5.4l1.3-2 4 1.6V17a2.5 2.5 0 0 1-2.5 2.5A15.5 15.5 0 0 1 2.5 6 2.5 2.5 0 0 1 5 3.5Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 19.5 5.3 16A8 8 0 1 1 8 18.7L4 19.5Z" />
    </svg>
  );
}

/**
 * Arama / WhatsApp / yol tarifi butonları.
 * Gerçek bilgi girilmediyse buton etkin değildir ve nedeni açıkça yazılır.
 */
export function ContactActions({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {bookingOpen && (
        <ButtonLink href="/randevu" variant={dark ? "light" : "primary"}>
          Online Randevu Al
        </ButtonLink>
      )}
      {telHref ? (
        <ButtonLink href={telHref} variant={dark ? "light" : "primary"}>
          <PhoneIcon /> Hemen Arayın
        </ButtonLink>
      ) : (
        <DisabledButton
          note="Örnek numara: gerçek numara girildiğinde arama etkinleşir"
          className={dark ? "border-paper/30 text-paper/70" : ""}
        >
          <PhoneIcon /> Arama henüz etkin değil
        </DisabledButton>
      )}

      {whatsappHref && (
        <ButtonLink href={whatsappHref} variant={dark ? "outline-light" : "outline"}>
          <ChatIcon /> WhatsApp
        </ButtonLink>
      )}

      {directionsHref && (
        <ButtonLink href={directionsHref} variant={dark ? "outline-light" : "outline"}>
          Yol Tarifi Al
        </ButtonLink>
      )}
    </div>
  );
}

/** Telefon satırı: örnek numara ise açıkça belirtilir */
export function PhoneLine({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {telHref ? (
        <a href={telHref} className="underline decoration-gold/70 underline-offset-4 hover:decoration-current">
          {contact.phone.display}
        </a>
      ) : (
        <span>{contact.phone.display}</span>
      )}
      {contact.phone.isPlaceholder && (
        <span
          className={`rounded-[2px] border px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.14em] ${
            dark ? "border-paper/30 text-paper/75" : "border-stone-deep text-muted"
          }`}
        >
          Örnek numara
        </span>
      )}
    </span>
  );
}
