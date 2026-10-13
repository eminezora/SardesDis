# Sardes Diş Kliniği — Web Sitesi

Salihli / Manisa'daki Sardes Diş Kliniği için Next.js 16, TypeScript ve
Tailwind CSS 4 ile hazırlanmış kurumsal site. Tüm sayfalar statik olarak
üretilir; ek veritabanı veya servis gerekmez.

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

Site, veritabanına bağlı bir randevu sistemi içerir:

- **Hasta:** `/kayit` adresinden kayıt olur (ad, soyad, cep telefonu,
  isteğe bağlı e-posta, şifre, KVKK onayı), `/giris` adresinden giriş yapar.
  `/randevu` sayfasında hekim, gün ve boş saat seçip **randevu talebi**
  gönderir. `/hesabim` sayfasında randevularının durumunu görür ve süresi
  geçmemiş randevusunu iptal eder. Tıbbi bilgi veya dosya istenmez.
- **Klinik personeli:** `/yonetim` panelinde talepleri görür, hekim atayıp
  onaylar ya da "uygun değil" olarak işaretler. Randevu saati geçince
  "tamamlandı" veya "gelmedi" olarak kapatır. Telefonla alınan randevuları
  "Randevu ekle" formuyla doğrudan **onaylı** olarak ekler (aşağıya bakın).
  `/yonetim/hastalar` sayfasında hastaları arar ve şifresini unutan hasta
  için geçici şifre üretir.

### Telefonla alınan randevular

`/yonetim` sayfasındaki "Randevu ekle" formuyla personel kayıtlı bir hastayı
arar ya da yeni hasta için yalnızca ad, soyad ve cep telefonunu yazar; hekim
(veya "belirlenmedi"), gün ve saati seçer. Saatler online takvimle aynı
kurallardan gelir, dolu olanlar seçilemez. Gerekirse takvim dışı bir saat de
girilebilir; çakışma kontrolü her durumda yapılır. Her randevu
`booking.slotMinutes` sürer: takvim dışı 10:15'e eklenen randevu online
takvimde 10:00 ve 10:30'u da doldurur.

Telefonla eklenen yeni hasta **şifresiz** kaydedilir ve giriş yapamaz (KVKK
onayı da yoktur). Hasta daha sonra aynı cep telefonuyla `/kayit` olursa KVKK
onayı vererek bu kaydı sahiplenir ve randevularını "Hesabım"da görür. Kayıtta
telefon doğrulaması (SMS kodu) olmadığından, numarayı bilen biri bu kaydı
sahiplenebilir. Bu riski azaltmak için hasta, "Hesabım"da yalnızca kaydı
sahiplendiği andan **sonra** oluşturulan randevuları görür; önceki randevu
geçmişi ve hasta dosyası kayıtları hastaya hiçbir zaman gösterilmez.
Yine de SMS doğrulaması eklenmeden yayına alınması önerilmez.

Talep, klinik onaylayana kadar kesinleşmiş sayılmaz. Bu durum hastaya da
açıkça yazılır.

### Yayında açmak

Sistem varsayılan olarak **kapalıdır**: menüde “Randevu Al” görünmez ve
`/kayit`, `/randevu` sayfaları 404 verir. Açmak için `src/config/site.ts`
dosyasında:

1. `booking.schedule`: kliniğin gerçek haftalık takvimi, ör.
   `{ 1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "18:00" }], ... }`
   (1 = Pazartesi … 7 = Pazar; kapalı günler yazılmaz).
2. `legal.kvkkText` ve `legal.dataController`: hukuki danışmanlıkla
   hazırlanmış aydınlatma metni. Bir diş kliniğine randevu kaydı sağlık
   verisi sayılabileceğinden bu adım atlanmamalıdır.
3. Gerçek telefon numarası (`contact.phone`, `isPlaceholder: false`).
4. `booking.enabled: true`.

Bunlardan biri eksikse sistem açılmaz. Yönetim paneli eksikleri listeler.
Randevu süresi, en erken/en geç randevu, kişi başı aktif randevu sınırı,
iptal süresi ve tatil günleri de `booking` bölümünden ayarlanır.

### Geliştirmede denemek

`npm run dev` sırasında sistem **örnek takvimle** açıktır
(`.env.development` → `NEXT_PUBLIC_PREVIEW_BOOKING=1`). Örnek saatler
kliniğin gerçek saatleri değildir ve yayında hiçbir zaman kullanılmaz.

### Personel hesabı oluşturma (doktor / asistan)

Personel hesapları siteden açılamaz; sunucuda şu komutla oluşturulur:

```bash
npm run personel:ekle -- --ad "Remzi" --soyad "Oruç" --eposta adres@ornek.com --rol doktor
npm run personel:ekle -- --ad "Ad" --soyad "Soyad" --eposta asistan@ornek.com --rol asistan
```

Komut tek seferlik bir geçici şifre yazar. Personel `/giris` adresinden
e-postası ve bu şifreyle girer, ardından kendi şifresini belirlemek zorundadır.
Aynı komut, mevcut bir personelin şifresini sıfırlamak veya rolünü
değiştirmek için de kullanılır. Doktor ve asistan aynı ekranları görür; hasta
dosyasından kayıt **silme** yalnızca doktorlara açıktır.

Personel oturumu 12 saat sonra kapanır (hasta oturumu 30 gün).

## Hasta dosyaları (yalnızca doktor ve asistan)

`/yonetim/hastalar` listesinden bir hastanın adına tıklayınca hasta dosyası
açılır (`/yonetim/hasta/[id]`). Burada:

- **Kimlik ve iletişim** bilgileri, online hesabı ve KVKK onayı olup olmadığı,
- **Gelecek ve geçmiş randevuların** tamamı,
- **Kayıtlar**: muayene / tedavi notları, raporlar, röntgen ve filmler,
  fotoğraflar ve belgeler. Türlerine göre süzülebilir.
- **Dosya yükleme:** JPEG, PNG, WebP, PDF ve DICOM (.dcm), en fazla 30 MB.
  Dosya türü uzantıya değil içeriğe bakılarak doğrulanır.
- **Erişim kaydı:** dosyayı kimin ne zaman açtığı, neyi eklediği veya sildiği.

Hastalar bu bölümü hiçbir şekilde göremez. Giriş yapmamış ya da hasta
hesabıyla gelen biri hem sayfalardan hem dosya bağlantılarından geri
çevrilir.

Güvenlik ayrıntıları:

- Dosyalar `public/` dışında, `data/files/` altında rastgele adlarla
  saklanır (konum `FILES_PATH` ile değiştirilebilir). Yalnızca personel
  oturumuyla `/api/kayitlar/[id]` üzerinden açılır ve tarayıcıda önbelleğe
  alınmaz.
- Silinen kayıt hasta dosyasında görünmez ama veritabanında ve diskte
  kalır, denetim kaydına yazılır. Sağlık kayıtlarının saklama süreleri
  yasal olarak düzenlendiğinden kalıcı silme bilinçli olarak yoktur.
- Yükleme uç noktası başka sitelerden gelen istekleri reddeder (köken kontrolü).

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

Nasıl çalışır:

- **Hasta:** Google hesabının e-postası kayıtlı bir hastayla eşleşirse
  giriş yapar. Eşleşmezse kayıt tamamlama sayfasında cep telefonunu ekler ve
  KVKK metnini onaylar.
- **Doktor / asistan:** yalnızca `npm run personel:ekle` ile açılmış ve
  **aynı e-postaya** sahip bir personel hesabı varsa Google ile girebilir.
  Google ile yeni personel hesabı açılamaz. Personel için Google girişi,
  Google hesabındaki iki adımlı doğrulamadan yararlanmayı sağlar.
- Google ile kayıt olan hastanın site şifresi yoktur; her zaman Google ile girer.

## Şifre kuralları

Hasta ve personel şifreleri en az 10 karakter olmalı; büyük harf, küçük
harf, rakam ve özel karakter içermelidir. Ayrıca kişinin adını, soyadını,
telefonunu ve sık kullanılan ifadeleri ("123456", "sifre", "sardes" vb.)
içeremez. Formda kurallar yazdıkça işaretlenir. Kurallar
`src/lib/password-rules.ts` dosyasındadır.

### Veritabanı ve barındırma

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

### Henüz olmayanlar

- **SMS / e-posta bildirimi:** randevu onaylandığında hastaya otomatik
  bildirim gitmez; hasta durumu “Hesabım” sayfasından görür. Bir SMS veya
  e-posta servisi seçildiğinde eklenebilir.
- **Telefon doğrulaması:** kayıtta SMS kodu yoktur. Telefonla alınan
  randevular artık panelden eklenebiliyor (yukarıya bakın), ancak bu
  hastaların kaydı, numarayı bilen biri tarafından `/kayit` ile
  sahiplenilebilir. SMS servisi eklendiğinde kayıtta doğrulama yapılmalıdır.
- **Randevu düzenleme:** personel eklenmiş bir randevunun gününü/saatini
  değiştiremez; iptal edip yeniden ekler. Hasta adı/telefonu da panelden
  düzeltilemez.

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
- [ ] **Online randevu açılacaksa:** gerçek takvim (`booking.schedule`),
      KVKK aydınlatma metni ve veri sorumlusu (`legal`), personel hesapları
      (`npm run personel:ekle`), kalıcı diskli sunucu, HTTPS ve yedekleme
- [ ] **Hasta dosyaları kullanılacaksa:** sağlık verisi (KVKK özel nitelikli
      kişisel veri) işlendiği için hukuki danışmanlık, VERBİS kaydı, sunucu
      erişim güvenliği, şifreli disk ve düzenli **şifreli** yedekleme
      (`data/sardes.db` ve `data/files/`)
- [ ] **Google ile giriş** kullanılacaksa: Google Cloud OAuth istemcisi ve
      ortam değişkenleri
- [ ] KVKK aydınlatma metni / çerez bilgilendirmesi (form, analiz aracı veya
      harita eklenecekse hukuki danışmanlıkla)

## Yapı

```
src/
  app/                 sayfalar (/, /klinigimiz, /hekimlerimiz, /tedaviler,
                       /sik-sorulan-sorular, /iletisim), sitemap, robots
  components/          tekrar kullanılabilir bileşenler
  config/site.ts       ← tüm klinik bilgileri ve randevu ayarları
  config/navigation.ts menü
  lib/content.ts       görünürlük kuralları (telefon, taslak tedaviler vb.)
  lib/booking-status.ts online randevunun açık olup olmadığı
  actions/             sunucu işlemleri (kayıt, giriş, randevu, yönetim, hasta kayıtları)
  app/api/             Google girişi, hasta dosyası yükleme/indirme
  server/              veritabanı, oturum, randevu, hasta kayıtları, Google
  lib/password-rules.ts şifre kuralları
scripts/create-staff.mts personel hesabı oluşturma (doktor/asistan)
data/                SQLite veritabanı ve hasta dosyaları (depoya ASLA eklenmez)
assets/              logonun özgün dosyası
public/images/         klinik ve hekim fotoğrafları
```

Erişilebilirlik: anlamlı başlık sırası, “İçeriğe geç” bağlantısı, görünür
klavye odağı, klavyeyle çalışan menü ve SSS, `prefers-reduced-motion`
desteği, WCAG AA kontrastına uygun metin renkleri.
