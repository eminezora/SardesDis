import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { doctors } from "@/config/site";
import { formatDateLong, istanbulDate } from "@/lib/time";
import { formatMobile } from "@/lib/validation";
import { requireUser } from "@/server/auth";
import { patientAppointments } from "@/server/appointments";
import { getDb } from "@/server/db";
import { MAX_FILE_BYTES } from "@/server/files";
import {
  audit,
  kindLabel,
  listRecords,
  patientAudit,
  recordKinds,
  type RecordKind,
} from "@/server/records";
import { Container } from "@/components/Container";
import { Alert } from "@/components/forms";
import { StatusBadge } from "@/components/account/StatusBadge";
import { DeleteRecord } from "@/components/records/DeleteRecord";
import { NoteForm } from "@/components/records/NoteForm";
import { UploadForm } from "@/components/records/UploadForm";
import { StaffNav } from "@/components/staff/StaffNav";

export const metadata: Metadata = { title: "Hasta dosyası", robots: { index: false } };

type Patient = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  created_at: number;
  kvkk_consent_at: number | null;
  has_account: number;
};

const uploadErrors: Record<string, string> = {
  boyut: `Dosya en fazla ${MAX_FILE_BYTES / 1024 / 1024} MB olabilir.`,
  bicim: "Bu dosya biçimi desteklenmiyor. JPEG, PNG, WebP, PDF veya DICOM yükleyin.",
  dosya: "Lütfen bir dosya seçin.",
  baslik: "Lütfen bir başlık yazın.",
  tur: "Geçersiz kayıt türü.",
};

const actionLabel: Record<string, string> = {
  "patient.view": "Dosyayı görüntüledi",
  "record.view": "Kaydı açtı",
  "record.create": "Kayıt ekledi",
  "record.delete": "Kayıt sildi",
  "patient.password_reset": "Geçici şifre oluşturdu",
};

const dtFmt = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});
const sizeFmt = (n: number | null) =>
  n == null ? "" : n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`;
const doctorName = (slug: string | null) =>
  slug ? `Dt. ${doctors.find((d) => d.slug === slug)?.name ?? slug}` : "Hekim belirlenmedi";

export default async function PatientFilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tur?: string; hata?: string; eklendi?: string }>;
}) {
  const { id } = await params;
  const user = await requireUser("staff", { next: `/yonetim/hasta/${id}` });
  const { tur, hata, eklendi } = await searchParams;

  const patient = getDb()
    .prepare(
      `SELECT id, first_name, last_name, phone, email, created_at, kvkk_consent_at,
              (password_hash IS NOT NULL) AS has_account
         FROM users WHERE id = ? AND role = 'patient'`,
    )
    .get(Number(id)) as Patient | undefined;
  if (!patient) notFound();

  audit(user.id, "patient.view", { patientId: patient.id });

  const today = istanbulDate();
  const appointments = patientAppointments(patient.id, { limit: 2000 });
  const upcoming = appointments.filter((a) => a.date >= today && ["pending", "confirmed"].includes(a.status)).reverse();
  const past = appointments.filter((a) => !upcoming.includes(a));

  const all = listRecords(patient.id);
  const filter = recordKinds.some((k) => k.id === tur) ? (tur as RecordKind) : null;
  const records = filter ? all.filter((r) => r.kind === filter) : all;
  const counts = Object.fromEntries(recordKinds.map((k) => [k.id, all.filter((r) => r.kind === k.id).length]));
  const log = patientAudit(patient.id);
  const isDoctor = user.staffRole === "doctor";

  return (
    <Container className="py-12 md:py-16">
      <StaffNav active="hastalar" name={`${user.firstName} ${user.lastName}`} />

      <div className="mt-8">
        <Link href="/yonetim/hastalar" className="text-sm text-muted underline decoration-stone-deep underline-offset-4 hover:text-forest">
          ← Hastalar
        </Link>
      </div>

      {/* Kimlik */}
      <header className="mt-6 flex flex-col gap-6 border-b border-stone-deep pb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">Hasta dosyası · gizli</p>
          <h1 className="mt-4 text-[2.5rem] text-ink md:text-[3.25rem]">
            {patient.first_name} {patient.last_name}
          </h1>
        </div>
        <dl className="grid gap-x-10 gap-y-3 text-[0.9375rem] sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">Telefon</dt>
            <dd className="mt-1 text-ink">
              {patient.phone ? (
                <a href={`tel:${patient.phone}`} className="underline decoration-stone-deep underline-offset-4">
                  {formatMobile(patient.phone)}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">E-posta</dt>
            <dd className="mt-1 text-ink">{patient.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">Kayıt</dt>
            <dd className="mt-1 text-ink">{dtFmt.format(patient.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-muted">Online hesap</dt>
            <dd className="mt-1 text-ink">
              {patient.has_account ? "Var" : "Yok (klinikte kaydedildi)"}
              {patient.kvkk_consent_at ? " · KVKK onayı var" : ""}
            </dd>
          </div>
        </dl>
      </header>

      <div className="mt-12 grid gap-16 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0 space-y-16">
          {/* Kayıtlar */}
          <section id="kayitlar" aria-labelledby="kayitlar-baslik" className="scroll-mt-28">
            <h2 id="kayitlar-baslik" className="text-[2rem] text-ink">
              Kayıtlar
            </h2>
            <div className="mt-4 space-y-3">
              {eklendi && <Alert tone="success">Kayıt eklendi.</Alert>}
              {hata && uploadErrors[hata] && <Alert>{uploadErrors[hata]}</Alert>}
            </div>

            <nav aria-label="Kayıt türü" className="mt-6 flex flex-wrap gap-2 text-sm">
              <FilterLink href={`/yonetim/hasta/${patient.id}#kayitlar`} on={!filter}>
                Tümü ({all.length})
              </FilterLink>
              {recordKinds.map((k) => (
                <FilterLink key={k.id} href={`/yonetim/hasta/${patient.id}?tur=${k.id}#kayitlar`} on={filter === k.id}>
                  {k.label} ({counts[k.id]})
                </FilterLink>
              ))}
            </nav>

            {records.length === 0 ? (
              <p className="mt-8 text-muted">Bu türde kayıt yok.</p>
            ) : (
              <ul className="mt-8 border-t border-stone-deep">
                {records.map((r) => (
                  <li key={r.id} className="grid gap-4 border-b border-stone-deep py-6 sm:grid-cols-[7rem_1fr]">
                    <div>
                      {r.file_mime?.startsWith("image/") ? (
                        <a href={`/api/kayitlar/${r.id}`} target="_blank" rel="noopener" className="block">
                          {/* eslint-disable-next-line @next/next/no-img-element -- yetkili uç noktadan, önbelleğe alınmadan */}
                          <img
                            src={`/api/kayitlar/${r.id}?onizleme=1`}
                            alt={r.title}
                            loading="lazy"
                            className="aspect-square w-28 border border-stone-deep bg-stone object-cover"
                          />
                        </a>
                      ) : (
                        <span className="flex aspect-square w-28 items-center justify-center border border-stone-deep bg-paper text-xs uppercase tracking-[0.14em] text-muted">
                          {r.file_mime === "application/pdf" ? "PDF" : r.file_mime === "application/dicom" ? "DICOM" : "Not"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.16em] text-muted">
                            {kindLabel[r.kind]} · <span className="capitalize">{formatDateLong(r.record_date)}</span>
                          </p>
                          <h3 className="mt-1 font-sans text-lg font-medium leading-snug text-ink">{r.title}</h3>
                        </div>
                        {isDoctor && <DeleteRecord id={r.id} />}
                      </div>
                      {r.body && <p className="mt-2 whitespace-pre-line text-[0.9375rem] text-ink/85">{r.body}</p>}
                      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span>
                          {r.author_first} {r.author_last} · {dtFmt.format(r.created_at)}
                        </span>
                        {r.file_key && (
                          <>
                            <a href={`/api/kayitlar/${r.id}`} target="_blank" rel="noopener" className="text-forest underline decoration-gold underline-offset-4">
                              Aç
                            </a>
                            <a href={`/api/kayitlar/${r.id}?indir=1`} className="text-forest underline decoration-gold underline-offset-4">
                              İndir ({sizeFmt(r.file_size)})
                            </a>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Randevular */}
          <section aria-labelledby="randevular-baslik">
            <h2 id="randevular-baslik" className="text-[2rem] text-ink">
              Randevular
            </h2>
            <h3 className="mt-6 font-sans text-sm font-medium uppercase tracking-[0.16em] text-muted">Gelecek</h3>
            <AppointmentList items={upcoming} empty="Yaklaşan randevu yok." />
            <h3 className="mt-10 font-sans text-sm font-medium uppercase tracking-[0.16em] text-muted">Geçmiş</h3>
            <AppointmentList items={past} empty="Geçmiş randevu yok." />
          </section>
        </div>

        {/* Ekleme formları ve erişim kaydı */}
        <aside className="space-y-12">
          <section aria-labelledby="yukle-baslik" className="border border-stone-deep bg-paper p-6">
            <h2 id="yukle-baslik" className="text-[1.5rem] text-ink">
              Dosya yükle
            </h2>
            <div className="mt-5">
              <UploadForm
                patientId={patient.id}
                today={today}
                kinds={recordKinds.filter((k) => k.file)}
                maxMb={MAX_FILE_BYTES / 1024 / 1024}
              />
            </div>
          </section>
          <section aria-labelledby="not-baslik" className="border border-stone-deep bg-paper p-6">
            <h2 id="not-baslik" className="text-[1.5rem] text-ink">
              Not ekle
            </h2>
            <div className="mt-5">
              <NoteForm patientId={patient.id} today={today} />
            </div>
          </section>
          <section aria-labelledby="erisim-baslik">
            <h2 id="erisim-baslik" className="text-[1.5rem] text-ink">
              Erişim kaydı
            </h2>
            <p className="mt-2 text-sm text-muted">Bu dosyayı kimin ne zaman açtığı ve değiştirdiği.</p>
            <ul className="mt-4 space-y-2 text-sm">
              {log.map((l) => (
                <li key={l.id} className="flex justify-between gap-3 border-b border-stone-deep/60 pb-2">
                  <span className="text-ink">
                    {l.first_name} {l.last_name} — {actionLabel[l.action] ?? l.action}
                  </span>
                  <span className="shrink-0 text-muted">{dtFmt.format(l.at)}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </Container>
  );
}

function FilterLink({ href, on, children }: { href: string; on: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={on ? "true" : undefined}
      className={`inline-flex min-h-10 items-center rounded-[2px] border px-3 ${
        on ? "border-forest bg-forest text-paper" : "border-stone-deep bg-paper text-ink hover:border-forest"
      }`}
    >
      {children}
    </Link>
  );
}

function AppointmentList({ items, empty }: { items: ReturnType<typeof patientAppointments>; empty: string }) {
  if (items.length === 0) return <p className="mt-3 text-muted">{empty}</p>;
  return (
    <ul className="mt-3 border-t border-stone-deep">
      {items.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-deep py-4 text-[0.9375rem]">
          <span className="text-ink">
            <span className="capitalize">{formatDateLong(a.date)}</span> ·{" "}
            <span className="tabular-nums lining-nums">{a.time}</span>
            <span className="ml-2 text-muted">{doctorName(a.doctor_slug)}</span>
          </span>
          <StatusBadge status={a.status} />
        </li>
      ))}
    </ul>
  );
}
