import { telHref, whatsappHref } from "@/lib/content";

/**
 * Telefonda ekranın altında sabit duran arama / WhatsApp çubuğu.
 * Yalnızca gerçek numara girildiğinde görünür.
 */
export function MobileContactBar() {
  if (!telHref && !whatsappHref) return null;
  return (
    <>
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-deep bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        <div className="flex h-16">
          {telHref && (
            <a
              href={telHref}
              className="flex flex-1 items-center justify-center gap-2 bg-forest text-[0.9375rem] font-medium text-paper"
            >
              Ara
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 text-[0.9375rem] font-medium text-forest"
            >
              WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  );
}
