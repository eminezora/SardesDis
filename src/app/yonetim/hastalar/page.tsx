import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { formatMobile, normalizeMobile } from "@/lib/validation";
import { Container } from "@/components/Container";
import { ResetPassword } from "@/components/staff/ResetPassword";
import { StaffNav } from "@/components/staff/StaffNav";

export const metadata: Metadata = { title: "Hastalar", robots: { index: false } };

type Row = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  created_at: number;
  active: number;
  has_account: number;
};

const dateFmt = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeZone: "Europe/Istanbul" });

export default async function PatientsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser("staff", { next: "/yonetim/hastalar" });
  const q = ((await searchParams).q ?? "").trim().slice(0, 60);

  const phone = normalizeMobile(q);
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const rows = getDb()
    .prepare(
      `SELECT u.id, u.first_name, u.last_name, u.phone, u.email, u.created_at,
              u.password_hash IS NOT NULL AS has_account,
              (SELECT COUNT(*) FROM appointments a WHERE a.patient_id = u.id AND a.status IN ('pending','confirmed')) AS active
         FROM users u
        WHERE u.role = 'patient'
          AND (? = '' OR (u.first_name || ' ' || u.last_name) LIKE ? ESCAPE '\\' OR u.email LIKE ? ESCAPE '\\' OR u.phone = ?)
        ORDER BY u.created_at DESC LIMIT 100`,
    )
    .all(q, like, like, phone ?? "") as Row[];

  return (
    <Container className="py-12 md:py-16">
      <StaffNav active="hastalar" name={`${user.firstName} ${user.lastName}`} />
      <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <h1 className="text-[2.5rem] text-ink md:text-[3rem]">Hastalar</h1>
        <form className="flex items-end gap-2 text-sm" role="search">
          <label className="text-muted">
            Ad, telefon veya e-posta
            <input
              name="q"
              defaultValue={q}
              className="mt-1 block min-h-10 w-64 rounded-[2px] border border-stone-deep bg-paper px-3 text-ink"
            />
          </label>
          <button type="submit" className="min-h-10 rounded-[2px] border border-ink/25 px-4 hover:border-forest">
            Ara
          </button>
        </form>
      </div>

      {rows.length === 0 ? (
        <p className="mt-12 text-muted">{q ? "Eşleşen hasta bulunamadı." : "Henüz kayıtlı hasta yok."}</p>
      ) : (
        <ul className="mt-10 border-t border-stone-deep">
          {rows.map((r) => (
            <li key={r.id} className="grid gap-4 border-b border-stone-deep py-5 md:grid-cols-[1fr_auto] md:items-center">
              <div className="text-[0.9375rem]">
                <p className="font-medium text-ink">
                  <Link
                    href={`/yonetim/hasta/${r.id}`}
                    className="underline decoration-gold underline-offset-4 hover:text-forest"
                  >
                    {r.first_name} {r.last_name}
                  </Link>
                </p>
                <p className="mt-1 text-muted">
                  {formatMobile(r.phone)}
                  {r.email && <span className="ml-3">{r.email}</span>}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Kayıt: {dateFmt.format(r.created_at)} · Aktif randevu: {r.active}
                </p>
              </div>
              {r.has_account ? (
                <ResetPassword id={r.id} />
              ) : (
                <p className="text-sm text-muted">Online hesabı yok (telefonla eklendi)</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
