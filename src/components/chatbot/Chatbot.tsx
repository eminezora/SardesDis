import { contact, doctors, faqs, treatments } from "@/config/site";
import { bookingOpen } from "@/lib/booking-status";
import { telHref, whatsappHref } from "@/lib/content";
import type { ChatContext } from "@/lib/chatbot-engine";
import { SardesAssistant } from "./SardesAssistant";

/**
 * Sardes Asistan'ı site verileriyle başlatır. Klinik bilgileri yalnızca
 * src/config/site.ts dosyasından gelir; örnek telefon numarası gösterilmez.
 */
export function Chatbot() {
  const ctx: ChatContext = {
    bookingOpen,
    doctors: doctors.map((d) => `Dt. ${d.name}`),
    address: contact.address.display,
    phone: contact.phone.isPlaceholder ? null : contact.phone.display,
    faqs: faqs.map((f) => ({ question: f.question, answer: f.answer })),
    hasPublishedTreatments: treatments.some((t) => t.approved),
  };
  return <SardesAssistant ctx={ctx} hasMobileBar={Boolean(telHref || whatsappHref)} />;
}
