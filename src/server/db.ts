/**
 * SQLite veritabanı (Node.js'in yerleşik `node:sqlite` modülü).
 * Dosya varsayılan olarak `data/sardes.db` içindedir; `DATABASE_PATH`
 * ortam değişkeniyle değiştirilebilir.
 *
 * Bu dosya bilinçli olarak başka proje dosyası içe aktarmaz; böylece
 * `scripts/` altındaki komut satırı araçları da doğrudan kullanabilir.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const MIGRATIONS: string[] = [
  /* 1 — ilk şema */ `
  CREATE TABLE users (
    id              INTEGER PRIMARY KEY,
    role            TEXT    NOT NULL CHECK (role IN ('patient', 'staff')),
    first_name      TEXT    NOT NULL,
    last_name       TEXT    NOT NULL,
    phone           TEXT    UNIQUE,
    email           TEXT    UNIQUE,
    password_hash   TEXT    NOT NULL,
    must_change_pw  INTEGER NOT NULL DEFAULT 0,
    disabled        INTEGER NOT NULL DEFAULT 0,
    kvkk_consent_at INTEGER,
    created_at      INTEGER NOT NULL
  );

  CREATE TABLE sessions (
    token_hash TEXT    PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX sessions_user ON sessions(user_id);

  CREATE TABLE appointments (
    id           INTEGER PRIMARY KEY,
    patient_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    doctor_slug  TEXT,
    date         TEXT    NOT NULL,  -- YYYY-AA-GG (İstanbul saati)
    time         TEXT    NOT NULL,  -- SS:DD
    status       TEXT    NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','confirmed','cancelled','rejected','completed','no_show')),
    cancelled_by TEXT    CHECK (cancelled_by IN ('patient','staff')),
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );
  CREATE INDEX appointments_slot    ON appointments(date, time, status);
  CREATE INDEX appointments_patient ON appointments(patient_id, status);

  CREATE TABLE login_attempts (
    key TEXT    NOT NULL,
    at  INTEGER NOT NULL
  );
  CREATE INDEX login_attempts_key ON login_attempts(key, at);
  `,

  /* 2 — telefonla gelen hasta: personelin eklediği, şifresi olmayan kayıt.
     SQLite'ta NOT NULL kaldırılamadığı için tablo yeniden kurulur. */ `
  CREATE TABLE users_new (
    id              INTEGER PRIMARY KEY,
    role            TEXT    NOT NULL CHECK (role IN ('patient', 'staff')),
    first_name      TEXT    NOT NULL,
    last_name       TEXT    NOT NULL,
    phone           TEXT    UNIQUE,
    email           TEXT    UNIQUE,
    password_hash   TEXT,   -- NULL: online hesabı yok, giriş yapamaz
    must_change_pw  INTEGER NOT NULL DEFAULT 0,
    disabled        INTEGER NOT NULL DEFAULT 0,
    kvkk_consent_at INTEGER,
    created_at      INTEGER NOT NULL,
    CHECK (password_hash IS NOT NULL OR role = 'patient')
  );
  INSERT INTO users_new SELECT * FROM users;
  DROP TABLE users;
  ALTER TABLE users_new RENAME TO users;

  ALTER TABLE appointments ADD COLUMN source TEXT NOT NULL DEFAULT 'online'
    CHECK (source IN ('online', 'staff'));
  `,
  /* 3 — personel rolü (doktor/asistan), Google girişi, hasta dosyası
         kayıtları (not, rapor, röntgen/film, fotoğraf, belge) ve erişim kaydı */ `
  ALTER TABLE users ADD COLUMN staff_role TEXT CHECK (staff_role IN ('doctor', 'assistant'));
  UPDATE users SET staff_role = 'assistant' WHERE role = 'staff';
  ALTER TABLE users ADD COLUMN google_sub TEXT;
  CREATE UNIQUE INDEX users_google_sub ON users(google_sub) WHERE google_sub IS NOT NULL;

  CREATE TABLE google_pending (
    token_hash  TEXT    PRIMARY KEY,
    sub         TEXT    NOT NULL,
    email       TEXT    NOT NULL,
    given_name  TEXT    NOT NULL,
    family_name TEXT    NOT NULL,
    next        TEXT    NOT NULL DEFAULT '',
    expires_at  INTEGER NOT NULL
  );

  CREATE TABLE patient_records (
    id          INTEGER PRIMARY KEY,
    patient_id  INTEGER NOT NULL REFERENCES users(id),
    kind        TEXT    NOT NULL CHECK (kind IN ('note','report','xray','photo','document')),
    title       TEXT    NOT NULL,
    body        TEXT,
    file_key    TEXT    UNIQUE,
    file_name   TEXT,
    file_mime   TEXT,
    file_size   INTEGER,
    record_date TEXT    NOT NULL,          -- YYYY-AA-GG
    created_by  INTEGER NOT NULL REFERENCES users(id),
    created_at  INTEGER NOT NULL,
    deleted_at  INTEGER,
    deleted_by  INTEGER REFERENCES users(id)
  );
  CREATE INDEX patient_records_patient ON patient_records(patient_id, record_date);

  CREATE TABLE audit_log (
    id         INTEGER PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    action     TEXT    NOT NULL,
    patient_id INTEGER,
    record_id  INTEGER,
    at         INTEGER NOT NULL
  );
  CREATE INDEX audit_log_patient ON audit_log(patient_id, at);
  `,
  /* 4 — yönetim sitesiyle senkronizasyon: her değişiklik sıralı bir olay olarak
         kaydedilir; yönetim sitesi /api/sync/events ile kaldığı yerden çeker */ `
  CREATE TABLE sync_events (
    seq       INTEGER PRIMARY KEY AUTOINCREMENT,
    entity    TEXT    NOT NULL CHECK (entity IN ('patient', 'appointment')),
    entity_id INTEGER NOT NULL,
    type      TEXT    NOT NULL,
    at        INTEGER NOT NULL
  );
  CREATE INDEX sync_events_entity ON sync_events(entity, entity_id);

  -- Mevcut kayıtlar ilk aktarımda yönetim sitesine geçsin
  INSERT INTO sync_events (entity, entity_id, type, at)
    SELECT 'patient', id, 'patient.created', created_at FROM users WHERE role = 'patient' ORDER BY id;
  INSERT INTO sync_events (entity, entity_id, type, at)
    SELECT 'appointment', id, 'appointment.created', created_at FROM appointments ORDER BY id;
  `,
];

function open(): DatabaseSync {
  const file =
    process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "sardes.db");
  mkdirSync(path.dirname(file), { recursive: true });

  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  const { user_version } = db.prepare("PRAGMA user_version").get() as {
    user_version: number;
  };
  // Tablo yeniden kurulurken DROP TABLE bağlı kayıtları silmesin diye
  // yabancı anahtarlar kapatılır (işlem içinde değiştirilemez), sonda denetlenir.
  if (user_version < MIGRATIONS.length) db.exec("PRAGMA foreign_keys = OFF");
  for (let v = user_version; v < MIGRATIONS.length; v++) {
    db.exec("BEGIN");
    try {
      db.exec(MIGRATIONS[v]);
      if (db.prepare("PRAGMA foreign_key_check").all().length) {
        throw new Error(`Migration ${v + 1}: yabancı anahtar tutarsızlığı`);
      }
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  }
  db.exec("PRAGMA foreign_keys = ON");
  return db;
}

const g = globalThis as unknown as { __sardesDb?: DatabaseSync };

/** Tek bağlantı; geliştirme sunucusunda yeniden yüklemelerde korunur. */
export function getDb(): DatabaseSync {
  g.__sardesDb ??= open();
  return g.__sardesDb;
}

/** Bir işlemi bütün halinde çalıştırır (çift randevuyu önlemek için). */
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
