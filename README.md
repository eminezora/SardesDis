# Sardes Diş Kliniği — Web Sitesi

Salihli / Manisa'daki Sardes Diş Kliniği'nin **halka açık hasta sitesi**
(Next.js 16, TypeScript, Tailwind CSS 4). Ziyaretçiler kliniği tanır; randevu
almak isteyenler üye olup online randevu talebi oluşturur.

Bu sitede **yönetici / personel girişi yoktur.** Randevular ve hasta kayıtları
burada saklanır ve ileride yapılacak ayrı **yönetim sitesine** güvenli bir
senkronizasyon API'siyle aktarılır (bkz. [Yönetim sitesiyle senkronizasyon](#yönetim-sitesiyle-senkronizasyon)).

## Çalıştırma

Node.js 20.9 veya üzeri gerekir.

```bash
npm install
npm run dev      # geliştirme: http://localhost:3000
npm run build    # yayın derlemesi
npm run start    # yayın derlemesini yerelde çalıştırma
npm run lint     # TypeScript tür denetimi
```

## Bilgileri nereden değiştiririm?

**Neredeyse her şey tek dosyada:** [`src/config/site.ts`](src/config/site.ts)

| Bölüm | Ne var |
| --- | --- |
| `clinic` | Klinik adı, alan adı (`siteUrl`), logo, klinik fotoğrafları |
| `contact` | Adres, telefon, WhatsApp, e-posta, çalışma saatleri, sosyal medya, harita |
| `doctors` | Hekimlerin fotoğraf ve özgeçmiş alanları |
| `treatments` | Tedavi metinleri ve her birinin yayın onayı (`approved`) |
| `faqs` | Sık sorulan sorular |

Kural basit: **bilinmeyen bilgi `null` (ya da boş liste `[]`) kalır ve sitede
hiç görünmez.** Boş özgeçmiş, “yakında” yazısı veya sahte içerik gösterilmez.

Diğer dosyalar:

- Menü sırası: `src/config/navigation.ts`
- Renkler ve yazı tipleri: `src/app/globals.css` içindeki `@theme` bloğu
- Sayfa metinleri: `src/app/*/page.tsx` ve `src/components/Sections.tsx`

### Logo ve renkler

Kliniğin logosu `public/logo.png` dosyasında. Özgün dosya `assets/logo-orijinal.jpg`
olarak saklanır. Logo yeniden çizilmedi: yalnızca yuvarlak rozetin dışındaki
beyaz köşeler saydam yapıldı. Sekme simgeleri (`src/app/icon.png`,
`apple-icon.png`) aynı dosyadan küçültüldü.

Sitenin renkleri logodan alınmıştır: rozet zemini antrasit-siyah, vurgular
sıcak altın. Altın yalnızca ince çizgi ve küçük ayrıntılarda kullanılır.
Renkler `src/app/globals.css` içindeki `@theme` bloğundadır.

Logoyu değiştirmek için yeni dosyayı `public/` içine koyup `clinic.logo`
alanını güncelleyin (`width`/`height` dosyanın gerçek oranı olmalı).

### Fotoğraflar

- Klinik: dosyaları `public/images/klinik/` içine koyup `clinic.photos`
  listesine ekleyin. İlk fotoğraf ana sayfadaki kemer içinde, tümü
  “Kliniğimiz” sayfasındaki galeride görünür.
- Hekim: dosyayı `public/images/hekimler/` içine koyup ilgili hekimin
  `photo` alanını doldurun. Fotoğraf yokken isim baş harfleriyle zarif bir
  düzen kullanılır.
- Her fotoğraf için `alt` metnine fotoğrafta gerçekten ne göründüğünü yazın.
  Stok görselleri gerçek klinik/hekim fotoğrafı gibi kullanmayın.

### Tedaviler

Beş tedavi taslak olarak hazır ve hepsi `approved: false`. Onaylanmamış
tedaviler **yayın derlemesinde asla görünmez.** Klinikte sunulduğu
doğrulanan her tedavi için `approved: true` yapın.

- Hiç onaylı tedavi yokken Tedaviler sayfası ve ana sayfa, genel muayene ve
  planlama sürecini anlatır.
- `npm run dev` sırasında taslaklar “Taslak · yayında görünmez” etiketiyle
  önizlenir. Bunu `.env.development` dosyasındaki `NEXT_PUBLIC_PREVIEW_DRAFTS`
  ile kapatabilirsiniz.

### Telefon, WhatsApp ve harita

- `contact.phone.isPlaceholder: true` iken numara “Örnek numara” etiketiyle
  gösterilir. Arama bağlantısı ve telefondaki alt arama çubuğu kapalıdır.
- Gerçek numarayı girip `isPlaceholder: false` yapınca arama butonları ve
  mobil alt çubuk etkinleşir.
- WhatsApp için `contact.whatsapp` alanına cep numarasını `+905xxxxxxxxx`
  biçiminde girin. Telefon gerçek olmadan WhatsApp butonu görünmez.
- Harita: Google Haritalar'da kliniğin kesin konumunu bulun.
  - “Paylaş → Bağlantıyı kopyala” adresini `contact.map.directionsUrl`
    alanına girin (“Yol Tarifi Al” butonu açılır).
  - “Paylaş → Harita yerleştir” içindeki iframe `src` değerini
    `contact.map.embedUrl` alanına girin (iletişim sayfasında harita açılır).

## Online randevu ve hasta hesabı

- `/kayit`: ad, soyad, cep telefonu, isteğe bağlı e-posta, güçlü şifre ve
  KVKK onayıyla üyelik (veya Google ile).
- `/giris`: cep telefonu / e-posta ve şifreyle giriş.
- `/randevu`: hekim (veya "fark etmez"), gün ve boş saat seçilerek
  **randevu talebi** gönderilir. Tıbbi bilgi veya dosya istenmez.
- `/hesabim`: randevuların durumu ("Onay bekliyor", "Onaylandı" …), süresi
  geçmemiş randevuyu iptal etme, şifre değiştirme.

Talep, klinik onaylayana kadar kesinleşmiş sayılmaz; bu hastaya açıkça
yazılır. Onay, yönetim sitesinden API ile gelir.

### Şu anki durum: AÇIK (örnek takvim ve KVKK taslağıyla)

Online randevu yayında **açıktır**; hastalar üye olup randevu talebi
gönderebilir. Ancak iki bilgi geçicidir ve en kısa sürede değiştirilmelidir:

- ⚠️ **Örnek randevu takvimi:** hafta içi 09.00–12.00 ve 13.00–17.00
  (`booking.schedule`). Kliniğin gerçek saatleriyle değiştirin.
- ⚠️ **KVKK aydınlatma metni taslağı** (`legal.kvkkText`) ve veri sorumlusu
  (`legal.dataController`). Bir hukukçuya kontrol ettirin; veri sorumlusu
  unvanını netleştirin.
- Telefon hâlâ örnek numaradır; sitede "örnek numara" olarak görünür ve
  aranamaz. Randevuyu engellemez, ama gerçek numara girilmelidir.

### Açma / kapatma koşulları

Randevuyu kapatmak için `booking.enabled: false` yapın. Açık kalması için
`src/config/site.ts` dosyasında şunlar dolu olmalıdır:

1. `booking.schedule`: kliniğin gerçek haftalık takvimi, ör.
   `{ 1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], ... }`
   (1 = Pazartesi … 7 = Pazar; kapalı günler yazılmaz).
2. `legal.kvkkText` ve `legal.dataController`: hukuki danışmanlıkla
   hazırlanmış aydınlatma metni. Bir diş kliniğine randevu kaydı sağlık
   verisi sayılabileceğinden bu adım atlanmamalıdır.
3. `booking.enabled: true`.

Gerçek telefon numarası önerilir ama randevuyu engellemez.

Bunlardan biri eksikse sistem açılmaz (`src/lib/booking-status.ts`).
Randevu süresi, en erken/en geç randevu, kişi başı aktif randevu sınırı,
iptal süresi ve tatil günleri de `booking` bölümünden ayarlanır.

### Geliştirmede denemek

`npm run dev` sırasında sistem **örnek takvimle** açıktır
(`.env.development` → `NEXT_PUBLIC_PREVIEW_BOOKING=1`). Örnek saatler
kliniğin gerçek saatleri değildir ve yayında hiçbir zaman kullanılmaz.

## Yönetim sitesiyle senkronizasyon

Bu site randevu ve hasta kayıtlarının **kaynağıdır**. Yönetim sitesi
(ayrı bir proje) verileri buradan çeker ve kararlarını (onay, iptal, telefon
randevusu) buraya geri yazar. Böylece:

- hastanın aldığı her randevu yönetim sitesine aktarılır,
- klinik onayladığında hasta bunu "Hesabım"da görür,
- telefonla verilen randevular online takvimde dolu görünür (çift randevu olmaz).

### Kurulum

Sunucuda ortam değişkenlerini tanımlayın (`.env.example`):

| Değişken | Açıklama |
| --- | --- |
| `SYNC_API_KEY` | Yönetim sitesinin API anahtarı, **en az 32 karakter** rastgele değer. Tanımlı değilse API tamamen kapalıdır. Üretmek için: `openssl rand -base64 36` |
| `SYNC_WEBHOOK_URL` | (İsteğe bağlı) Değişiklik olunca haber verilecek yönetim sitesi adresi |

Her istekte başlık: `Authorization: Bearer <SYNC_API_KEY>`. API yalnızca
HTTPS üzerinden kullanılmalıdır; anahtar yalnızca iki sunucu arasında
kalmalı, tarayıcıya veya mobil uygulamaya konmamalıdır.

### Nasıl çalışır

Hasta ve randevu kayıtlarındaki **her değişiklik**, artan bir sıra numarasıyla
(`seq`) olay olarak kaydedilir. Yönetim sitesi son aldığı `seq` değerini
saklar ve kaldığı yerden devam eder. Bağlantı kopsa, sunucu kapansa bile
olay kaybolmaz. Aynı olay iki kez alınırsa sorun olmaz: kayıtlar `id` ile
güncellenir. Sistem kurulduğunda mevcut tüm hasta ve randevular da ilk
olaylar olarak eklenir.

Webhook açıksa, değişiklikten yaklaşık yarım saniye sonra yönetim sitesine
`{"event":"changes","latest_seq":N}` gönderilir (kişisel veri içermez).
`X-Sardes-Signature: sha256=<HMAC-SHA256(gövde, SYNC_API_KEY)>` başlığıyla
doğrulanır. Webhook gelmese de yönetim sitesi düzenli aralıklarla
(ör. dakikada bir) olayları çekerek eksiksiz kalır.

### Uç noktalar

| Yöntem ve yol | Ne yapar |
| --- | --- |
| `GET /api/sync/info` | Bağlantı testi; hekimler, takvim, randevu süresi, son `seq` |
| `GET /api/sync/events?after=<seq>&limit=100` | Değişiklik akışı (`events`, `next_after`, `has_more`). Her olay kaydın **güncel** halini taşır; randevu olaylarında hasta bilgisi de vardır |
| `GET /api/sync/appointments?from=YYYY-AA-GG&to=YYYY-AA-GG` | Tarih aralığındaki randevular (kontrol / ilk aktarım) |
| `GET /api/sync/appointments/{id}` | Tek randevu |
| `PATCH /api/sync/appointments/{id}` | Klinik kararı: `{"status":"confirmed","doctor_slug":"remzi-oruc"}` |
| `POST /api/sync/appointments` | Telefonla alınan randevu (doğrudan onaylı), aşağıya bakın |
| `GET /api/sync/slots?date=YYYY-AA-GG` | O günün saatleri ve her saatte boş hekimler |
| `GET /api/sync/patients/{id}` | Tek hasta |
| `POST /api/sync/patients/{id}/temporary-password` | Şifresini unutan hasta için geçici şifre (hasta ilk girişte değiştirir) |

Olay türleri: `patient.created`, `patient.updated`, `appointment.created`,
`appointment.updated`, `appointment.cancelled`.

Randevu durumları ve izin verilen geçişler:

- `pending` (onay bekliyor) → `confirmed` veya `rejected`
- `confirmed` → `cancelled`; randevu saati geçtikten sonra `completed` veya `no_show`
- Hasta, `booking.cancelUntilHours` öncesine kadar kendisi iptal edebilir
  (`cancelled_by: "patient"`).

Telefon randevusu örneği:

```json
POST /api/sync/appointments
{
  "patient": { "first_name": "Ali", "last_name": "Yılmaz", "phone": "0532 000 00 00" },
  "date": "2026-10-14",
  "time": "10:30",
  "doctor_slug": "doganay-sayin",
  "off_schedule": false
}
```

Kayıtlı hasta için `patient` yerine `"patient_id": 12` gönderilir. Saat dolu
ise `409 booking_conflict` döner. Telefonla eklenen yeni hasta **şifresiz**
kaydedilir; hasta daha sonra aynı cep telefonuyla `/kayit` olursa KVKK onayı
vererek bu kaydı sahiplenir. SMS doğrulaması olmadığından, sahiplenen kişi
yalnızca sahiplendiği andan sonraki randevuları görür.

Hata yanıtları: `{"error":{"code":"...","message":"..."}}`. Durum kodları:
400 hatalı istek, 401 anahtar yanlış, 404 bulunamadı veya API kapalı,
409 çakışma / izin verilmeyen geçiş.

## Sardes Asistan (sohbet)

Sağ alttaki diş maskotuna tıklanınca açılan, kural tabanlı bilgilendirme
asistanı. İnternete veya yapay zekâ servisine bağlanmaz; mesajlar tarayıcıda
eşleştirilir. Kişisel bilgi toplamaz, kaydetmez ve randevu oluşturmaz.

- **Yanıtları düzenlemek:** `src/config/chatbot.ts`. Karşılama mesajı, hızlı
  seçenekler, konu başlıkları, anahtar kelimeler ve yanıt metinleri buradadır.
  `{hekimler}`, `{adres}`, `{telefon}` yer tutucuları `src/config/site.ts`
  dosyasından doldurulur. Örnek telefon numarası hiçbir zaman gösterilmez.
- **Randevu Al:** sitenin mevcut randevu sayfasına (`/randevu`) gider. Online
  randevu yayında henüz açık değilken bu sayfa bulunmadığı için asistan bozuk
  bağlantı yerine durumu açıklar ve İletişim sayfasını önerir. Randevu
  açılınca (`booking.enabled`) buton kendiliğinden randevu sayfasına yönlendirir.
- **Eşleştirme:** Türkçe büyük/küçük harf ve karakter farkı gözetmez
  ("DİŞ İPİ" = "dis ipi"). Ek almış kelimeleri ("randevumu") tanır, küçük
  yazım hatalarını ("randvu", "fırçalma") tolere eder. Sağlık şikâyeti ve
  ilaç soruları her zaman önce yakalanır ve diş hekimine yönlendirilir.
- **Maskot:** `src/components/chatbot/ToothMascot.tsx` (SVG). Göz kırpma ve
  kısa selamlama hareketi, "hareketi azalt" tercihinde kapanır.
- Karşılama balonu her tarayıcıda yalnızca bir kez gösterilir.

## Google ile giriş

Ortam değişkenleri tanımlıysa giriş ve kayıt sayfalarında
“Google ile devam et” butonu görünür (`.env.example` dosyasına bakın):

1. [Google Cloud Console](https://console.cloud.google.com/) → API'ler ve
   Hizmetler → OAuth izin ekranı (uygulama adı, destek e-postası).
2. Kimlik bilgileri → OAuth istemci kimliği → **Web uygulaması**.
   Yetkilendirilmiş yönlendirme URI'si:
   `https://ALANADINIZ/api/auth/google/callback`
3. Sunucuda `APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   değişkenlerini tanımlayın.

Google hesabının e-postası kayıtlı bir hastayla eşleşirse hasta giriş yapar.
Eşleşmezse kayıt tamamlama sayfasında cep telefonunu ekler ve KVKK metnini
onaylar. Google ile kayıt olan hastanın site şifresi yoktur; her zaman Google
ile girer.

## Şifre kuralları

Şifreler en az 10 karakter olmalı; büyük harf, küçük harf, rakam ve özel
karakter içermelidir. Ayrıca kişinin adını, soyadını, telefonunu ve sık
kullanılan ifadeleri ("123456", "sifre", "sardes" vb.) içeremez. Formda
kurallar yazdıkça işaretlenir. Kurallar `src/lib/password-rules.ts`
dosyasındadır.

## Veritabanı ve barındırma

- Node.js'in yerleşik SQLite modülü kullanılır; ek veritabanı sunucusu
  veya paket gerekmez. Veri `data/sardes.db` dosyasındadır (konumu
  `DATABASE_PATH` ortam değişkeniyle değiştirilebilir). Tablolar ilk
  çalıştırmada otomatik oluşturulur.
- **Kalıcı diski olan bir Node.js sunucusunda** çalıştırın: VPS, Node
  destekli bir paylaşımlı hosting ya da kalıcı disk bağlanmış Railway/Render
  gibi. Vercel gibi sunucusuz ortamlarda dosya kalıcı olmaz. Orada
  PostgreSQL gibi bir veritabanına geçmek gerekir.
- **Yedekleme:** `data/sardes.db` dosyasını (ve varsa `-wal` dosyasını)
  düzenli olarak yedekleyin. Bu dosya hasta bilgisi içerir: depoya
  eklenmez (`.gitignore`), erişimi kısıtlı tutulmalıdır.
- **Güvenlik:** Şifreler scrypt ile özetlenir. Oturum anahtarının yalnızca
  özeti saklanır; çerez `httpOnly`, `SameSite=Lax` ve yayında `Secure`
  olarak ayarlanır. 15 dakikada 5 hatalı giriş denemesinden sonra hesap
  geçici olarak kilitlenir. Aynı saate çift randevu, veritabanı işlemiyle
  (transaction) engellenir. Site mutlaka **HTTPS** ile yayınlanmalıdır.
- Veritabanında önceki sürümden kalan `patient_records` / `audit_log`
  tabloları kullanılmıyor; hasta dosyaları (röntgen, rapor vb.) yönetim
  sitesinde tutulacak.

## Henüz olmayanlar

- **Yönetim sitesi:** ayrı proje olarak yapılacak; bu sitedeki
  senkronizasyon API'si hazır.
- **SMS / e-posta bildirimi:** randevu onaylandığında hastaya otomatik
  bildirim gitmez; hasta durumu “Hesabım” sayfasından görür.
- **Telefon doğrulaması:** kayıtta SMS kodu yoktur. Klinikte telefonla
  kaydedilen bir hastanın kaydı, numarayı bilen biri tarafından `/kayit` ile
  sahiplenilebilir. SMS servisi eklendiğinde kayıtta doğrulama yapılmalıdır.
- **Randevu düzenleme:** bir randevunun günü/saati değiştirilemez; iptal
  edilip yeniden eklenir.

## Yayından önce tamamlanması gerekenler

- [ ] **Klinik adı:** logoda “Özel Sardes Ağız ve Diş Sağlığı Polikliniği” yazıyor,
      sitede “Sardes Diş Kliniği” kullanılıyor. Resmî ada göre `clinic.name` güncellenmeli.
- [ ] **Gerçek telefon** numarası ve `isPlaceholder: false`
- [ ] **WhatsApp** numarası (kullanılacaksa)
- [ ] **Kesin adres:** kapı numarası, posta kodu ve ardından `address.verified: true`
      (sokak adresi ancak bundan sonra yapılandırılmış veriye eklenir)
- [ ] **Harita** bağlantıları (`directionsUrl`, `embedUrl`)
- [ ] **Çalışma saatleri** (`contact.hours`)
- [ ] **E-posta** ve **sosyal medya** hesapları (varsa)
- [ ] **Alan adı** (`clinic.siteUrl`). Sitemap ve paylaşım etiketleri için gerekli.
- [ ] **Tedavilerin doğrulanması:** sunulan her tedavi için `approved: true`,
      metinlerin hekimlerce gözden geçirilmesi
- [ ] **Hekim bilgileri:** yalnızca doğrulanmış eğitim, ilgi alanı ve dil bilgileri
- [ ] **Gerçek fotoğraflar** (isteğe bağlı) ve anlamlı `alt` metinleri
- [ ] **SSS yanıtlarının** klinik tarafından onaylanması
- [ ] **Online randevu (şu an açık):** örnek takvimi gerçek saatlerle
      değiştirin (`booking.schedule`); KVKK taslağını ve veri sorumlusunu
      hukukçuya onaylatın (`legal`); kalıcı diskli sunucu, HTTPS ve düzenli
      **şifreli** yedekleme
- [ ] **Yönetim sitesi bağlanacaksa:** `SYNC_API_KEY` (ve isteğe bağlı
      `SYNC_WEBHOOK_URL`) tanımlanmalı; anahtar yalnızca iki sunucuda tutulmalı
- [ ] **Google ile giriş** kullanılacaksa: Google Cloud OAuth istemcisi ve
      ortam değişkenleri
- [ ] KVKK aydınlatma metni / çerez bilgilendirmesi (form, analiz aracı veya
      harita eklenecekse hukuki danışmanlıkla)

## Yapı

```
src/
  app/                  sayfalar (/, /klinigimiz, /hekimlerimiz, /tedaviler,
                        /sik-sorulan-sorular, /iletisim, /kayit, /giris,
                        /randevu, /hesabim), sitemap, robots
  app/api/auth/google/  Google ile giriş
  app/api/sync/         yönetim sitesi senkronizasyon API'si
  components/           tekrar kullanılabilir bileşenler
  config/site.ts        ← tüm klinik bilgileri ve randevu ayarları
  config/navigation.ts  menü
  config/chatbot.ts     ← Sardes Asistan yanıtları ve anahtar kelimeleri
  lib/content.ts        görünürlük kuralları (telefon, taslak tedaviler vb.)
  lib/booking-status.ts online randevunun açık olup olmadığı
  lib/password-rules.ts şifre kuralları
  lib/chatbot-engine.ts sohbet eşleştirme motoru
  components/chatbot/   maskot ve sohbet penceresi
  actions/              sunucu işlemleri (kayıt, giriş, randevu, Google)
  server/               veritabanı, oturum, randevu kuralları, senkronizasyon
data/                   SQLite veritabanı (depoya ASLA eklenmez)
assets/                 logonun özgün dosyası
```

Erişilebilirlik: anlamlı başlık sırası, “İçeriğe geç” bağlantısı, görünür
klavye odağı, klavyeyle çalışan menü ve SSS, `prefers-reduced-motion`
desteği, WCAG AA kontrastına uygun metin renkleri.
