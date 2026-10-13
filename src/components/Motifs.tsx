/**
 * Sardes'in mimari mirasına (yuvarlak kemer, yivli İon sütunu, basamaklı
 * taban) yapılan çok hafif, soyut çizgisel göndermeler. Hepsi dekoratiftir
 * ve ekran okuyuculardan gizlenir.
 */

/** Büyük kemer paneli: ince çift kemer çizgisi, içinde sütun yivleri */
export function ArchPanel({ className = "" }: { className?: string }) {
  const flutes = Array.from({ length: 11 }, (_, i) => 92 + i * 21.6);
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 600"
      preserveAspectRatio="xMidYMax meet"
      className={className}
      fill="none"
    >
      {/* dış ve iç kemer */}
      <path
        d="M40 600V200a160 160 0 0 1 320 0v400"
        stroke="var(--color-gold)"
        strokeWidth="1"
        opacity="0.9"
      />
      <path
        d="M58 600V200a142 142 0 0 1 284 0v400"
        stroke="var(--color-gold)"
        strokeWidth="0.6"
        opacity="0.55"
      />
      {/* kemer içi sütun yivleri */}
      {flutes.map((x) => (
        <line
          key={x}
          x1={x}
          x2={x}
          y1={250}
          y2={540}
          stroke="var(--color-stone-deep)"
          strokeWidth="1"
        />
      ))}
      {/* başlık (abakus) ve taban basamakları */}
      <line x1="78" x2="322" y1="236" y2="236" stroke="var(--color-gold)" strokeWidth="0.8" opacity="0.7" />
      <line x1="70" x2="330" y1="552" y2="552" stroke="var(--color-gold)" strokeWidth="0.8" opacity="0.7" />
      <line x1="58" x2="342" y1="566" y2="566" stroke="var(--color-stone-deep)" strokeWidth="1" />
      <line x1="40" x2="360" y1="580" y2="580" stroke="var(--color-stone-deep)" strokeWidth="1" />
    </svg>
  );
}

/** Küçük kemer işareti — başlık süsü olarak */
export function ArchMark({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 28 36"
      className={className}
      fill="none"
      stroke="var(--color-gold)"
      strokeWidth="1"
    >
      <path d="M2 36V14a12 12 0 0 1 24 0v22" />
      <path d="M9 36V18M14 36V18M19 36V18" opacity="0.6" />
    </svg>
  );
}

/** Yatay ayırıcı: ince çizgi ortasında küçük bir kemer */
export function Divider({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-5 ${className}`}>
      <span className="h-px flex-1 bg-stone-deep" />
      <ArchMark className="h-5 w-4" />
      <span className="h-px flex-1 bg-stone-deep" />
    </div>
  );
}

/** Çok hafif sütun yivi dokusu (arka plan) */
export function FluteTexture({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, currentColor 0 1px, transparent 1px 22px)",
      }}
    />
  );
}
