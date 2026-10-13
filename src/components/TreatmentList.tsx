import Link from "next/link";
import type { Treatment } from "@/config/site";

function DraftBadge() {
  return (
    <span className="ml-3 inline-block translate-y-[-0.35em] rounded-[2px] border border-dashed border-muted/60 px-2 py-0.5 align-middle font-sans text-[0.625rem] font-medium uppercase tracking-[0.16em] text-muted">
      Taslak · yayında görünmez
    </span>
  );
}

/** Ana sayfadaki kısa liste */
export function TreatmentIndex({ items }: { items: Treatment[] }) {
  return (
    <ol className="border-t border-stone-deep">
      {items.map((t, i) => (
        <li key={t.slug} className="border-b border-stone-deep">
          <Link
            href={`/tedaviler#${t.slug}`}
            className="group grid grid-cols-[2.5rem_1fr] gap-x-4 py-6 md:grid-cols-[4rem_minmax(0,18rem)_1fr] md:gap-x-8 md:py-8"
          >
            <span className="pt-1.5 text-xs tabular-nums lining-nums text-muted">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-serif text-[1.625rem] leading-tight text-ink transition-colors group-hover:text-forest md:text-[1.875rem]">
              {t.title}
              {!t.approved && <DraftBadge />}
            </span>
            <span className="col-start-2 mt-2 text-[0.9375rem] text-muted md:col-start-3 md:mt-1">
              {t.summary}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Tedaviler sayfasındaki ayrıntılı liste */
export function TreatmentDetails({ items }: { items: Treatment[] }) {
  return (
    <div className="border-t border-stone-deep">
      {items.map((t, i) => (
        <article
          key={t.slug}
          id={t.slug}
          className="grid scroll-mt-28 gap-6 border-b border-stone-deep py-12 md:grid-cols-[4rem_minmax(0,22rem)_1fr] md:gap-10 md:py-16"
        >
          <span className="text-xs tabular-nums lining-nums text-muted md:pt-3">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div>
            <h2 className="text-[2rem] text-ink md:text-[2.375rem]">
              {t.title}
              {!t.approved && <DraftBadge />}
            </h2>
            <p className="mt-4 text-ink/85">{t.summary}</p>
          </div>
          <div className="space-y-4 text-muted md:pt-2">
            {t.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
