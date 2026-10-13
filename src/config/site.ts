/**
 * SARDES DİŞ KLİNİĞİ — MERKEZİ AYAR DOSYASI
 * ------------------------------------------------------------------
 * Sitedeki tüm klinik, iletişim, hekim, tedavi ve SSS bilgileri bu
 * dosyadan yönetilir. Bir bilgi henüz kesin değilse alanı `null`
 * bırakın: site o alanı göstermez, uydurmaz.
 *
 * Yayından önce kontrol listesi için README.md dosyasına bakın.
 */

/* ------------------------------------------------------------------ */
/* Türler                                                              */
/* ------------------------------------------------------------------ */

export type Photo = {
  /** `public/` klasörüne göre yol, ör. "/images/klinik/bekleme.jpg" */
  src: string;
  /** Fotoğrafta gerçekten ne göründüğünü anlatan Türkçe açıklama */
  alt: string;
  width: number;
  height: number;
};

export type Doctor = {
  /** Adres çubuğunda ve bağlantılarda kullanılır */
  slug: string;
  title: string;
  name: string;
  /** Gerçek fotoğraf yoksa `null` bırakın; isim temelli düzen kullanılır */
  photo: Photo | null;
  /**
   * Yalnızca doğrulanmış bilgileri girin. Boş bırakılan alanlar
   * sitede hiç görünmez (başlığı da dahil).
   */
  about: string | null;
  education: string[];
  focusAreas: string[];
  languages: string[];
};

export type Treatment = {
  slug: string;
  title: string;
  /** Tek cümlelik özet */
  summary: string;
  /** Kısa bilgilendirici paragraflar */
  body: string[];
  /**
   * Bu hizmetin klinikte sunulduğu doğrulandıysa `true` yapın.
   * `false` olan tedaviler yayımlanan sitede GÖRÜNMEZ.
   */
  approved: boolean;
};

export type FaqItem = {
  question: string;
  answer: string[];
};

/* ------------------------------------------------------------------ */
/* Klinik                                                              */
/* ------------------------------------------------------------------ */

export const clinic = {
  name: "Sardes Diş Kliniği",
  shortName: "Sardes",
  city: "Salihli",
  region: "Manisa",
  /**
   * Yayın adresi, ör. "https://www.ornek.com" (sonunda / olmadan).
   * Alan adı kesinleşene kadar `null` bırakın. Sitemap, paylaşım
   * etiketleri ve yapılandırılmış veride kullanılır.
   */
  siteUrl: null as string | null,

  /**
   * Logo dosyasını `public/` içine koyun ve yolu yazın.
   * `null` iken yazı tabanlı geçici işaret gösterilir.
   * width/height: dosyanın gerçek piksel oranı — logonun oranı bozulmaz.
   */
  logo: { src: "/logo.png", width: 1024, height: 1024 } as null | {
    src: string;
    width: number;
    height: number;
  },

  /** Gerçek klinik fotoğrafları (boş liste = bölüm görünmez) */
  photos: [] as Photo[],
} as const;

/* ------------------------------------------------------------------ */
/* İletişim                                                            */
/* ------------------------------------------------------------------ */

export const contact = {
  address: {
    /** Ziyaretçiye gösterilen adres satırı */
    display: "Avar Caddesi, Salihli / Manisa",
    street: "Avar Caddesi",
    /** Kapı numarası bilinmiyorsa `null` bırakın */
    buildingNo: null as string | null,
    district: "Salihli",
    province: "Manisa",
    postalCode: null as string | null,
    /**
     * Adres kesinleşince `true` yapın. `false` iken adres sokak düzeyinde
     * yapılandırılmış veriye (Google için JSON-LD) eklenmez ve
     * sitede "geçici adres" notu görünür.
     */
    verified: false,
  },

  phone: {
    /** Ekranda görünen biçim */
    display: "0236 000 00 00",
    /** Uluslararası biçim, boşluksuz: +902360000000 */
    e164: "+902360000000",
    /**
     * Örnek numara gerçek numarayla değiştirilene kadar `true` kalmalı.
     * `true` iken arama bağlantısı ve mobil arama çubuğu devre dışıdır.
     */
    isPlaceholder: true,
  },

  /**
   * WhatsApp için kullanılacak cep numarası, uluslararası biçimde
   * (ör. "+905xxxxxxxxx"). `null` iken WhatsApp butonu görünmez.
   */
  whatsapp: null as string | null,

  /** Kesinleşmemiş bilgileri `null` bırakın; sitede gösterilmez. */
  email: null as string | null,

  /**
   * Çalışma saatleri. Kesinleşince ör.
   * [{ days: "Pazartesi – Cuma", hours: "09.00 – 18.00" }]
   */
  hours: null as null | { days: string; hours: string }[],

  /** Ör. [{ label: "Instagram", url: "https://instagram.com/..." }] */
  social: [] as { label: string; url: string }[],

  map: {
    /**
     * Google Haritalar'daki "Paylaş > Bağlantıyı kopyala" adresi.
     * Girildiğinde "Yol tarifi al" butonu etkinleşir.
     */
    directionsUrl: null as string | null,
    /**
     * Google Haritalar'daki "Paylaş > Harita yerleştir" içindeki
     * iframe `src` adresi. Girildiğinde iletişim sayfasında harita görünür.
     */
    embedUrl: null as string | null,
  },
};

/* ------------------------------------------------------------------ */
/* Hekimler                                                            */
/* ------------------------------------------------------------------ */

export const doctors: Doctor[] = [
  {
    slug: "remzi-oruc",
    title: "Diş Hekimi",
    name: "Remzi Oruç",
    photo: null,
    about: null,
    education: [],
    focusAreas: [],
    languages: [],
  },
  {
    slug: "doganay-sayin",
    title: "Diş Hekimi",
    name: "Doğanay Sayın",
    photo: null,
    about: null,
    education: [],
    focusAreas: [],
    languages: [],
  },
];

/* ------------------------------------------------------------------ */
/* Tedaviler (TASLAK — klinikle doğrulanınca approved: true yapın)     */
/* ------------------------------------------------------------------ */

export const treatments: Treatment[] = [
  {
    slug: "dis-dolgusu",
    title: "Diş Dolgusu",
    summary:
      "Çürük ya da kırılma nedeniyle madde kaybı olan dişin, kaybedilen bölümünün uygun bir dolgu malzemesiyle tamamlanması.",
    body: [
      "Dolgu, dişte oluşan çürüğün temizlenmesinin ardından boşalan alanın onarılmasıdır. Amaç dişin işlevini ve yapısını korumaktır.",
      "Çürüğün derinliği, dişin konumu ve kullanılacak malzeme muayene ve gerekli görüldüğünde radyografik değerlendirme sonrasında belirlenir.",
    ],
    approved: false,
  },
  {
    slug: "kanal-tedavisi",
    title: "Kanal Tedavisi",
    summary:
      "Dişin iç kısmındaki dokunun etkilendiği durumlarda, dişi ağızda tutmayı amaçlayan tedavi.",
    body: [
      "Derin çürük, travma veya başka nedenlerle diş içindeki doku (pulpa) etkilenebilir. Kanal tedavisinde bu doku temizlenir, kanallar şekillendirilir ve doldurulur.",
      "Tedavinin seans sayısı ve sonrasında dişin nasıl tamamlanacağı dişin durumuna göre değişir; bu konular muayenede ayrıntılı olarak konuşulur.",
    ],
    approved: false,
  },
  {
    slug: "dis-eti-sagligi",
    title: "Diş Eti Sağlığı",
    summary:
      "Diş etlerinin ve dişleri çevreleyen dokuların değerlendirilmesi, temizliği ve takibi.",
    body: [
      "Diş eti kanaması, şişlik veya hassasiyet diş eti hastalıklarının belirtisi olabilir. Erken değerlendirme, sürecin ilerlemesini önlemeye yardımcı olur.",
      "Diş taşı temizliği ve ağız bakımı önerileri çoğu zaman sürecin bir parçasıdır. Gerekli adımlar, diş etlerinin durumuna göre planlanır.",
    ],
    approved: false,
  },
  {
    slug: "protez-uygulamalari",
    title: "Protez Uygulamaları",
    summary:
      "Eksik dişlerin veya ileri derecede madde kaybı olan dişlerin sabit ya da hareketli protezlerle tamamlanması.",
    body: [
      "Protezler; çiğneme, konuşma ve görünüm açısından eksik dişlerin yerini tutmayı amaçlar. Sabit (kron, köprü) ve hareketli seçenekler bulunur.",
      "Hangi seçeneğin uygun olduğu; ağızdaki dişlerin, diş etlerinin ve kemiğin durumuna göre muayene sonrasında birlikte değerlendirilir.",
    ],
    approved: false,
  },
  {
    slug: "koruyucu-dis-hekimligi",
    title: "Koruyucu Diş Hekimliği",
    summary:
      "Sorunlar ortaya çıkmadan önce ağız ve diş sağlığını korumaya yönelik düzenli kontrol ve bilgilendirme.",
    body: [
      "Düzenli kontroller, olası sorunların erken fark edilmesine yardımcı olur. Ağız bakımı alışkanlıkları da bu görüşmelerde birlikte gözden geçirilir.",
      "Kontrol aralığı herkes için aynı değildir; kişinin ağız sağlığı durumuna göre önerilir.",
    ],
    approved: false,
  },
];

/* ------------------------------------------------------------------ */
/* Sık Sorulan Sorular                                                 */
/* ------------------------------------------------------------------ */

export const faqs: FaqItem[] = [
  {
    question: "İlk muayenede neler yapılır?",
    answer: [
      "İlk görüşmede şikâyetlerinizi ve beklentilerinizi dinleriz, ardından ağız içi muayene yapılır. Gerekli görülürse radyografik değerlendirme istenebilir.",
      "Muayene sonunda bulgular ve olası seçenekler size anlaşılır bir dille aktarılır.",
    ],
  },
  {
    question: "Randevuya gelmeden önce nasıl hazırlanmalıyım?",
    answer: [
      "Düzenli kullandığınız ilaçların adlarını ve bilinen bir sağlık durumunuz ya da alerjiniz varsa bunları not etmeniz faydalı olur.",
      "Daha önce çekilmiş diş filmleriniz veya tedavi kayıtlarınız varsa yanınızda getirebilirsiniz.",
    ],
  },
  {
    question: "Tedavi planı nasıl belirlenir?",
    answer: [
      "Tedavi planı, muayene bulgularına ve sizin ihtiyaçlarınıza göre kişiye özel hazırlanır. Her hasta için aynı yaklaşım uygun olmayabilir.",
      "Planın adımları, olası seçenekler ve süreç hakkında size bilgi verilir; kararı sorularınız yanıtlandıktan sonra birlikte veririz.",
    ],
  },
  {
    question: "Tedavi süresi ve seans sayısı önceden belli olur mu?",
    answer: [
      "Yaklaşık bir süre muayene sonrasında paylaşılabilir. Ancak tedavi sırasında karşılaşılan duruma göre plan güncellenebilir; böyle bir durumda sizi bilgilendiririz.",
    ],
  },
  {
    question: "Ücretler ve anlaşmalı kurumlar hakkında nasıl bilgi alabilirim?",
    answer: [
      "Ücretler kişiye özel tedavi planına göre değiştiği için muayene öncesinde kesin bilgi veremiyoruz. Anlaşmalı kurumlar ve ödeme seçenekleri hakkında güncel bilgi için lütfen klinikle iletişime geçin.",
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Online randevu ve hasta hesabı                                      */
/* ------------------------------------------------------------------ */

/** "HH:MM" biçiminde başlangıç ve bitiş, ör. { start: "09:00", end: "12:30" } */
export type TimeRange = { start: string; end: string };

/**
 * Haftalık randevu takvimi. Anahtar: 1 = Pazartesi … 7 = Pazar.
 * Kapalı günleri hiç yazmayın. Öğle arası için aynı güne iki aralık verin.
 */
export type WeeklySchedule = Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, TimeRange[]>>;

export const booking = {
  /**
   * Online randevu ve hasta hesabı yayında açık mı?
   * Açmadan önce şunlar tamamlanmış olmalı: `schedule`, `legal.kvkkText`
   * ve gerçek telefon numarası. Eksik olan varsa sistem açılmaz
   * (bkz. src/lib/booking-status.ts).
   */
  enabled: true,

  /**
   * Randevu takvimi.
   * ⚠️ ŞİMDİLİK ÖRNEK TAKVİM: hafta içi 09.00–12.00 ve 13.00–17.00.
   * Kliniğin gerçek çalışma saatleriyle değiştirin. Bu saatler sitede
   * "çalışma saatleri" olarak yazmaz; yalnızca randevu saatlerini belirler.
   */
  schedule: {
    1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    2: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    3: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    4: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
    5: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
  } as WeeklySchedule | null,

  /** Bir randevunun süresi (dakika) */
  slotMinutes: 30,
  /** En erken kaç saat sonrasına randevu alınabilir */
  minLeadHours: 2,
  /** En fazla kaç gün ilerisi için randevu alınabilir */
  maxDaysAhead: 30,
  /** Bir hastanın aynı anda en fazla kaç bekleyen/onaylı randevusu olabilir */
  maxActivePerPatient: 2,
  /** Hasta, randevusunu en geç kaç saat öncesine kadar iptal edebilir */
  cancelUntilHours: 2,
  /** Resmî tatil vb. kapalı günler, "YYYY-AA-GG" biçiminde */
  closedDates: [] as string[],
};

/**
 * Yalnızca `npm run dev` sırasında, sistemi denemek için kullanılan ÖRNEK
 * takvim. Yayında asla kullanılmaz ve kliniğin gerçek saatleri değildir.
 */
export const devPreviewSchedule: WeeklySchedule = {
  1: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
  2: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
  3: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
  4: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
  5: [{ start: "09:00", end: "12:00" }, { start: "13:00", end: "17:00" }],
};

export const legal = {
  /**
   * KVKK aydınlatma metni (paragraflar). Hukuki danışmanlıkla hazırlanmalı.
   * Boş iken online randevu ve hesap sistemi yayında açılmaz.
   */
  // ⚠️ TASLAK: Yayında kalmadan önce bir hukukçuya kontrol ettirin;
  // veri sorumlusu unvanını (ör. hekim adı veya şirket unvanı) netleştirin.
  kvkkText: [
    "Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) 10. maddesi uyarınca, online randevu ve hasta hesabı süreçlerinde işlenen kişisel verileriniz hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.",
    "İşlenen kişisel veriler: Kimlik bilgileri (ad, soyad); iletişim bilgileri (cep telefonu, isteğe bağlı e-posta); randevu bilgileri (randevu tarihi ve saati, hekim tercihi, randevunun durumu); hesap güvenliği bilgileri (şifrenizin geri döndürülemez biçimde şifrelenmiş hâli, oturum ve giriş denemesi kayıtları). Google ile giriş yapmanız hâlinde Google hesabınıza ait e-posta adresi, ad-soyad ve hesap kimliği. Online randevu formunda sağlık durumunuza ilişkin bilgi istenmez; ancak bir diş kliniğine randevu talebinde bulunmanız, sağlık hizmeti almak istediğinize ilişkin bilgi niteliği taşıyabilir.",
    "İşleme amaçları: Online randevu taleplerinizin alınması, planlanması, onaylanması veya iptal edilmesi; randevunuzla ilgili sizinle iletişime geçilmesi; hasta hesabınızın oluşturulması ve güvenliğinin sağlanması; ilgili mevzuattan doğan yükümlülüklerin yerine getirilmesi.",
    "Hukuki sebepler: Kişisel verileriniz KVKK'nın 5. maddesinde yer alan bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması, veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi ve temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaati hukuki sebeplerine; sağlık hizmetine ilişkin veriler ise KVKK'nın 6. maddesinde öngörülen şartlara dayanılarak işlenir.",
    "Toplama yöntemi: Kişisel verileriniz, bu internet sitesindeki kayıt, giriş ve randevu formları aracılığıyla elektronik ortamda toplanır. Telefonla alınan randevularda bilgileriniz klinik personeli tarafından sisteme girilir.",
    "Aktarım: Kişisel verileriniz, randevu süreçlerinin yürütülmesi amacıyla kliniğimizin kullandığı randevu yönetim sistemine ve sitenin barındırıldığı hizmet sağlayıcısına; hukuki bir yükümlülük bulunması hâlinde yetkili kamu kurum ve kuruluşlarına aktarılabilir. Google ile giriş yöntemini seçmeniz hâlinde giriş işlemi Google LLC tarafından sağlanır.",
    "Saklama süresi: Kişisel verileriniz, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır; bu sürelerin sona ermesiyle silinir, yok edilir veya anonim hâle getirilir.",
    "Haklarınız: KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, işlenmişse buna ilişkin bilgi talep etme, işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme, yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme, eksik veya yanlış işlenmişse düzeltilmesini isteme, KVKK'da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme, bu işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme, münhasıran otomatik sistemlerle analiz edilmesi sonucunda aleyhinize bir sonuç ortaya çıkmasına itiraz etme ve kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme haklarına sahipsiniz.",
    "Başvuru: Bu haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'e uygun olarak, kimliğinizi doğrulayan bilgilerle birlikte yazılı olarak kliniğimizin adresine iletebilirsiniz.",
  ] as string[],
  /** Veri sorumlusu unvanı, ör. "Sardes Diş Kliniği – Dt. ..." */
  dataController: "Sardes Diş Kliniği — Avar Caddesi, Salihli / Manisa" as string | null,
};
