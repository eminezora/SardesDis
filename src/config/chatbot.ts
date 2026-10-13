/**
 * SARDES ASİSTAN — YANIT VE ANAHTAR KELİME DOSYASI
 * ------------------------------------------------------------------
 * Sohbet asistanının tüm metinleri buradan düzenlenir. Asistan kural
 * tabanlıdır: yazılan mesajı aşağıdaki anahtar kelimelerle eşleştirir ve
 * hazır yanıtı gösterir. İnternete veya yapay zekâ servisine bağlanmaz,
 * kişisel bilgi toplamaz, randevu kaydı yapmaz.
 *
 * Yanıtlarda şu yer tutucular kullanılabilir (site verisinden doldurulur):
 *   {hekimler}  → "Dt. Remzi Oruç ve Dt. Doğanay Sayın"
 *   {adres}     → src/config/site.ts → contact.address.display
 *   {telefon}   → gerçek telefon girildiyse numara, yoksa iletişim sayfası notu
 *
 * Anahtar kelimeler:
 *   - Türkçe karakterler ve büyük/küçük harf fark etmez ("DİŞ", "dis", "Diş").
 *   - Kelime başı eşleşir: "randevu" → "randevumu", "randevular"…
 *     (3 harf ve daha kısa kelimeler yalnızca tam kelime olarak eşleşir.)
 *   - Birden fazla kelimeli ifadeler ("dis ipi") tam ifade olarak aranır.
 *   - Küçük yazım hataları (bir harf eksik/fazla/yanlış) 5+ harfli
 *     kelimelerde tolere edilir.
 */

export type ChatAction =
  /** Sitedeki bir sayfaya bağlantı */
  | { kind: "link"; label: string; href: string; primary?: boolean }
  /** Mevcut randevu sayfası (açık değilse otomatik olarak İletişim'e döner) */
  | { kind: "booking"; label: string }
  /** Başka bir konuyu açan hızlı seçenek */
  | { kind: "topic"; label: string; topic: string };

export type ChatTopic = {
  /** Kısa kimlik (hızlı seçenekler bu kimlikle bağlanır) */
  id: string;
  /** Eşleşme anahtar kelimeleri (Türkçe karakter kullanılabilir) */
  keywords: string[];
  /** Yanıt paragrafları — kısa tutun (2–3 cümle) */
  reply: string[];
  /** Yanıtın altında gösterilecek butonlar */
  actions?: ChatAction[];
};

export const chatbot = {
  name: "Sardes Asistan",
  subtitle: "Otomatik bilgilendirme asistanı",

  /** Sitenin mevcut randevu sayfası (Header, Footer ve İletişim'de kullanılan bağlantı) */
  bookingHref: "/randevu",

  /** Maskotun yanında bir kez görünen kısa balon */
  teaser: "Size nasıl yardımcı olabilirim?",

  greeting: [
    "Merhaba! Ben Sardes Asistan. Ağız ve diş sağlığı hakkında kısa bilgiler verebilir, randevu sayfasına ulaşmanıza yardımcı olabilirim.",
  ],

  /** Karşılama mesajının altındaki hızlı seçenekler */
  quickOptions: [
    { kind: "booking", label: "Randevu Al" },
    { kind: "topic", label: "Hekimlerimiz", topic: "hekimler" },
    { kind: "topic", label: "Diş Bakımı", topic: "dis-bakimi" },
    { kind: "topic", label: "Sık Sorulan Sorular", topic: "sss" },
    { kind: "topic", label: "Adres ve İletişim", topic: "iletisim" },
  ] satisfies ChatAction[],

  disclaimer: "Genel bilgilendirme sağlar; diş hekimi muayenesinin yerini tutmaz.",
  inputPlaceholder: "Sorunuzu yazın…",
  inputHint: "Lütfen sohbette kişisel veya sağlık bilgisi paylaşmayın.",

  /** Anlaşılamayan mesajlarda */
  fallback: {
    reply: ["Bu konuda size hekimlerimiz yardımcı olabilir. İsterseniz randevu sayfasına geçebilirsiniz."],
    actions: [
      { kind: "booking", label: "Randevu Al" },
      { kind: "topic", label: "Diğer seçenekler", topic: "menu" },
    ] satisfies ChatAction[],
  },

  /** Randevu sayfasına yönlendirme */
  booking: {
    keywords: ["randevu", "randevu almak", "randevu al", "muayene olmak", "gelmek istiyorum", "yer var mı", "uygun saat", "appointment"],
    reply: ["Randevu işlemleri için aşağıdaki butondan randevu sayfamıza geçebilirsiniz."],
    /** Online randevu henüz yayında açık değilken gösterilir */
    closedReply: [
      "Online randevu sistemimiz henüz kullanıma açılmadı. Randevu için iletişim sayfamızdaki bilgilerden kliniğimize ulaşabilirsiniz.",
    ],
  },

  /** Mesajda telefon / kimlik numarası gibi uzun rakam dizisi varsa */
  privacy: {
    reply: [
      "Güvenliğiniz için lütfen sohbette telefon, kimlik numarası veya sağlık bilgisi paylaşmayın. Bu asistan bilgi kaydetmez ve randevu oluşturmaz.",
    ],
  },
} as const;

/**
 * Konular. Yukarıdan aşağıya öncelik sırasıyla denenir: sağlık şikâyeti ve
 * ilaç soruları her zaman diğerlerinden önce yakalanır.
 */
export const topics: ChatTopic[] = [
  {
    id: "acil",
    keywords: [
      "çok şiddetli", "dayanılmaz", "yüzüm şişti", "yüzümde şişlik", "yüz şişliği", "ateş",
      "nefes", "yutkunamıyorum", "durmayan kanama", "kanama durmuyor", "kaza", "travma", "diş kırıldı", "diş düştü",
    ],
    reply: [
      "Şiddetli ağrı, yüze veya boyuna yayılan şişlik, ateş, durmayan kanama ya da nefes almada güçlük varsa vakit kaybetmeden bir sağlık kuruluşuna başvurun; acil durumda 112'yi arayın.",
      "Diğer şikâyetleriniz için en kısa sürede bir diş hekimine muayene olmanızı öneririz.",
    ],
    actions: [{ kind: "topic", label: "Adres ve İletişim", topic: "iletisim" }],
  },
  {
    id: "sikayet",
    keywords: [
      "ağrı", "ağrıyor", "sızı", "sızlıyor", "zonkluyor", "acıyor", "hassasiyet", "hassas", "kanıyor", "kanama",
      "şişlik", "şişti", "apse", "iltihap", "çürük", "kırık", "çatlak", "sallanıyor", "ağız kokusu", "yara", "aft",
      "çene", "geçmiyor", "ne yapmalıyım", "normal mi", "hastalık",
    ],
    reply: [
      "Yaşadığınız şikâyetin nedenini ve size uygun yaklaşımı ancak bir diş hekimi muayeneyle değerlendirebilir.",
      "Şikâyetiniz sürüyorsa ya da artıyorsa beklemeden muayene olmanızı öneririz.",
    ],
    actions: [{ kind: "booking", label: "Randevu Al" }],
  },
  {
    id: "ilac",
    keywords: [
      "ilaç", "antibiyotik", "ağrı kesici", "ağrıkesici", "hap", "parol", "majezik", "arveles", "apranax", "dozu",
      "kaç tane", "içebilir miyim", "kullanabilir miyim", "krem", "gargara",
    ],
    reply: [
      "İlaç kullanımı kişiye özel bir karardır; bu konuda öneride bulunamıyorum.",
      "Lütfen diş hekiminize veya eczacınıza danışın.",
    ],
    actions: [{ kind: "booking", label: "Randevu Al" }],
  },
  {
    id: "hekimler",
    keywords: ["hekim", "hekimler", "doktor", "doktorlar", "dişçi", "dt", "remzi", "oruç", "doğanay", "sayın", "kim bakıyor"],
    reply: ["Kliniğimizde {hekimler} hastalarımızı karşılıyor. Hekimlerimiz hakkında bilgiye Hekimlerimiz sayfasından ulaşabilirsiniz."],
    actions: [
      { kind: "link", label: "Hekimlerimiz", href: "/hekimlerimiz" },
      { kind: "booking", label: "Randevu Al" },
    ],
  },
  {
    id: "dis-bakimi",
    keywords: ["diş bakımı", "bakım", "ağız bakımı", "ağız sağlığı", "diş sağlığı", "öneri", "tavsiye", "nasıl korurum"],
    reply: ["Hangi konuda kısa bilgi almak istersiniz?"],
    actions: [
      { kind: "topic", label: "Diş fırçalama", topic: "fircalama" },
      { kind: "topic", label: "Diş arası temizliği", topic: "dis-arasi" },
      { kind: "topic", label: "Rutin kontroller", topic: "kontrol" },
      { kind: "topic", label: "İlk muayeneye hazırlık", topic: "ilk-muayene" },
    ],
  },
  {
    id: "dis-arasi",
    keywords: ["diş ipi", "diş arası", "arayüz", "ara yüz", "arayüz fırçası", "ara fırça", "kürdan", "su jeti", "irrigatör"],
    reply: [
      "Diş fırçası diş aralarına tam ulaşamaz; bu yüzden diş ipi veya ara yüz fırçasıyla günde bir kez diş aralarını temizlemek önerilir.",
      "Diş etinize uygun yöntemi ve fırça boyutunu muayenede birlikte belirleyebiliriz.",
    ],
  },
  {
    id: "fircalama",
    keywords: ["fırça", "fırçalama", "fırçalamak", "fırçalıyorum", "diş macunu", "macun", "florür", "florid", "elektrikli", "kaç kez", "kaç dakika", "dil temizliği"],
    reply: [
      "Dişlerinizi günde iki kez, yaklaşık iki dakika boyunca florürlü diş macunuyla fırçalamanız önerilir.",
      "Yumuşak kıllı bir fırçayla, diş eti çizgisine dikkat ederek nazik hareketler yapın; fırçanızı yaklaşık üç ayda bir yenileyin.",
    ],
    actions: [{ kind: "topic", label: "Diş arası temizliği", topic: "dis-arasi" }],
  },
  {
    id: "kontrol",
    keywords: ["kontrol", "rutin", "check up", "checkup", "ne sıklıkla", "kaç ayda", "yılda", "düzenli", "diş taşı", "temizlik"],
    reply: [
      "Düzenli kontroller, sorunların erken fark edilmesine yardımcı olur.",
      "Kontrol aralığı herkes için aynı değildir; size uygun aralığı diş hekiminiz ağız sağlığınıza göre önerir.",
    ],
    actions: [{ kind: "booking", label: "Randevu Al" }],
  },
  {
    id: "ilk-muayene",
    keywords: ["ilk muayene", "ilk kez", "ilk defa", "ilk randevu", "hazırlık", "hazırlanmalı", "ne getirmeli", "yanımda", "önce ne"],
    reply: [
      "İlk muayenede şikâyetleriniz dinlenir ve ağız içi muayene yapılır; gerekirse ek değerlendirme istenebilir.",
      "Kullandığınız ilaçların adlarını, varsa bilinen sağlık durumunuzu ve önceki diş filmlerinizi yanınızda getirmeniz faydalı olur.",
    ],
    actions: [{ kind: "link", label: "Sık Sorulan Sorular", href: "/sik-sorulan-sorular" }],
  },
  {
    id: "sss",
    keywords: ["sık sorulan", "sss", "sorular", "soru sormak", "merak ediyorum"],
    reply: ["Sık sorulan sorulardan birini seçebilir ya da tüm yanıtları ilgili sayfada okuyabilirsiniz."],
    // Butonlar sitedeki SSS listesinden (src/config/site.ts → faqs) otomatik eklenir
    actions: [{ kind: "link", label: "Tüm sorular", href: "/sik-sorulan-sorular" }],
  },
  {
    id: "iletisim",
    keywords: ["adres", "iletişim", "konum", "nerede", "neredesiniz", "yol tarifi", "harita", "telefon", "numara", "arayabilir", "aramak", "ulaşmak", "whatsapp", "e posta", "eposta", "mail", "avar", "salihli"],
    reply: ["Adresimiz: {adres}. {telefon}"],
    actions: [{ kind: "link", label: "İletişim sayfası", href: "/iletisim" }],
  },
  {
    id: "ucret",
    keywords: ["fiyat", "ücret", "ücreti", "kaç para", "kaç lira", "ne kadar", "tutar", "pahalı", "taksit", "ödeme", "sigorta", "sgk", "anlaşmalı", "kurum"],
    reply: [
      "Ücretler kişiye özel tedavi planına göre değiştiği için burada bilgi veremiyorum.",
      "Ücret, ödeme seçenekleri ve anlaşmalı kurumlar hakkında güncel bilgi için lütfen kliniğimizle iletişime geçin.",
    ],
    actions: [{ kind: "link", label: "Adres ve İletişim", href: "/iletisim" }],
  },
  {
    id: "saat",
    keywords: ["saat", "saatler", "çalışma saati", "kaçta", "açık mı", "açık mısınız", "kapalı", "hafta sonu", "cumartesi", "pazar", "mesai", "bugün"],
    reply: ["Çalışma saatlerimiz için lütfen iletişim sayfamızdaki bilgilerden kliniğimize ulaşın."],
    actions: [{ kind: "link", label: "Adres ve İletişim", href: "/iletisim" }],
  },
  {
    id: "tedaviler",
    keywords: [
      "tedavi", "tedaviler", "hizmet", "implant", "dolgu", "kanal", "beyazlatma", "ortodonti", "tel", "şeffaf plak",
      "protez", "kaplama", "kron", "köprü", "zirkonyum", "lamina", "çekim", "yirmilik", "diş eti", "çocuk",
    ],
    reply: [
      "Size uygun tedavi, muayene ve gerekli değerlendirmeler sonrasında belirlenir.",
      "Sunduğumuz hizmetler hakkında bilgi almak için kliniğimizle iletişime geçebilirsiniz.",
    ],
    // Sitede onaylı tedavi varsa "Tedaviler" sayfası butonu otomatik eklenir
    actions: [{ kind: "booking", label: "Randevu Al" }],
  },
  {
    id: "selam",
    keywords: ["merhaba", "selam", "selamlar", "günaydın", "iyi günler", "iyi akşamlar", "hey", "sa", "slm", "mrb"],
    reply: ["Merhaba! Size nasıl yardımcı olabilirim? Aşağıdaki seçeneklerden birini seçebilir ya da sorunuzu yazabilirsiniz."],
    actions: [{ kind: "topic", label: "Seçenekleri göster", topic: "menu" }],
  },
  {
    id: "tesekkur",
    keywords: ["teşekkür", "teşekkürler", "sağ ol", "sağol", "eyvallah", "tşk", "tesekkur", "çok iyi", "harika"],
    reply: ["Rica ederim! Başka bir konuda yardımcı olabilirsem buradayım. Sağlıklı günler dileriz."],
  },
  {
    id: "menu",
    keywords: ["menü", "seçenek", "seçenekler", "yardım", "neler yapabilirsin", "ne yapabilirsin"],
    reply: ["Size şu konularda yardımcı olabilirim:"],
    // Butonlar karşılamadaki hızlı seçeneklerle aynıdır
  },
];
