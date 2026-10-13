import Image from "next/image";
import { clinic } from "@/config/site";

type Props = {
  /** Koyu zemin üzerinde mi kullanılıyor (yalnızca yazı yedeği için) */
  inverted?: boolean;
  /** Tailwind yükseklik sınıfı; genişlik orana göre otomatik */
  sizeClass?: string;
  priority?: boolean;
  className?: string;
};

/**
 * Logo dosyası `clinic.logo` ile tanımlıysa olduğu gibi gösterilir;
 * yalnızca yükseklik verilir, oran korunur. Tanımlı değilse yazı tabanlı
 * geçici işaret kullanılır.
 */
export function Logo({
  inverted = false,
  sizeClass = "h-14 md:h-16",
  priority = false,
  className = "",
}: Props) {
  if (clinic.logo) {
    return (
      <Image
        src={clinic.logo.src}
        width={clinic.logo.width}
        height={clinic.logo.height}
        alt={clinic.name}
        priority={priority}
        sizes="(min-width: 768px) 128px, 112px"
        className={`w-auto ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <span
      className={`flex flex-col leading-none ${inverted ? "text-paper" : "text-forest"} ${className}`}
    >
      <span className="font-serif text-[1.75rem] font-medium tracking-[0.04em]">
        Sardes
      </span>
      <span
        className={`mt-1 text-[0.625rem] font-medium tracking-[0.34em] ${inverted ? "text-champagne" : "text-muted"}`}
      >
        DİŞ KLİNİĞİ
      </span>
    </span>
  );
}
