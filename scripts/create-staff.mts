/**
 * Klinik personeli (yönetim paneli) hesabı oluşturur veya şifresini sıfırlar.
 *
 *   npm run personel:ekle -- --ad Remzi --soyad Oruç --eposta ornek@klinik.com --rol doktor
 *   npm run personel:ekle -- --ad Ayşe --soyad Yılmaz --eposta asistan@klinik.com --rol asistan
 *
 * Roller: doktor (hasta kaydı silebilir) ve asistan.
 *
 * Geçici bir şifre üretir ve yalnızca bir kez ekrana yazar. Kişi ilk
 * girişte kendi şifresini belirlemek zorundadır.
 */
import { parseArgs } from "node:util";
import { getDb } from "../src/server/db.ts";
import { hashPassword, temporaryPassword } from "../src/server/password.ts";

const { values } = parseArgs({
  options: {
    ad: { type: "string" },
    soyad: { type: "string" },
    eposta: { type: "string" },
    rol: { type: "string" },
  },
});

const email = values.eposta?.trim().toLowerCase();
const staffRole = ({ doktor: "doctor", asistan: "assistant" } as const)[
  (values.rol ?? "").toLocaleLowerCase("tr") as "doktor" | "asistan"
];
if (!values.ad || !values.soyad || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !staffRole) {
  console.error('Kullanım: npm run personel:ekle -- --ad "Ad" --soyad "Soyad" --eposta ad@ornek.com --rol doktor|asistan');
  process.exit(1);
}

const db = getDb();
const temp = temporaryPassword();
const hash = await hashPassword(temp);
const existing = db.prepare("SELECT id, role FROM users WHERE email = ?").get(email) as
  | { id: number; role: string }
  | undefined;

if (existing && existing.role !== "staff") {
  console.error("Bu e-posta bir hasta hesabına ait. Personel için farklı bir e-posta kullanın.");
  process.exit(1);
}

if (existing) {
  db.prepare("UPDATE users SET password_hash = ?, must_change_pw = 1, disabled = 0, staff_role = ? WHERE id = ?").run(
    hash,
    staffRole,
    existing.id,
  );
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(existing.id);
  console.log(`\nPersonel hesabının şifresi sıfırlandı: ${email}`);
} else {
  db.prepare(
    `INSERT INTO users (role, staff_role, first_name, last_name, email, password_hash, must_change_pw, created_at)
     VALUES ('staff', ?, ?, ?, ?, ?, 1, ?)`,
  ).run(staffRole, values.ad.trim(), values.soyad.trim(), email, hash, Date.now());
  console.log(`\nPersonel hesabı oluşturuldu (${values.rol}): ${email}`);
}
console.log(`Geçici şifre: ${temp}`);
console.log("Giriş: /giris  →  ilk girişte yeni şifre belirlenecek.\n");
