import { chatbot, topics, type ChatAction } from "@/config/chatbot";

/**
 * Sardes Asistan eşleştirme motoru (tarayıcıda çalışır, dış servis yok).
 * Yanıt metinleri src/config/chatbot.ts dosyasındadır.
 */

/** Sohbette kullanılan site bilgileri (sunucuda site.ts'ten hazırlanır) */
export type ChatContext = {
  bookingOpen: boolean;
  doctors: string[];
  address: string;
  /** Gerçek telefon girildiyse görüntülenecek numara; örnek numarada null */
  phone: string | null;
  faqs: { question: string; answer: string[] }[];
  hasPublishedTreatments: boolean;
};

export type BotReply = { text: string[]; actions: ChatAction[] };

/* Türkçe metin normalleştirme -------------------------------------- */

const MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

/** "DİŞ İPİ!" → "dis ipi"; Türkçe büyük/küçük harf ve aksanlar dikkate alınır */
export function normalize(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/̇/g, "") // "İ".toLowerCase() kalıntısı
    .normalize("NFC")
    .replace(/[çğıöşüâîû]/g, (c) => MAP[c] ?? c)
    .replace(/['’`´]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** En fazla 1 düzenleme farkı (eksik, fazla, yanlış veya yer değiştiren harf) */
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // değiştirme
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // yer değiştirme
  }
  const [s, l] = a.length < b.length ? [a, b] : [b, a];
  return s.slice(i) === l.slice(i + 1); // ekleme/silme
}

function tokenMatches(token: string, kw: string, fuzzy: boolean): boolean {
  if (kw.length <= 3) return token === kw;
  if (token.startsWith(kw)) return true;
  // Yazım hatası (yalnızca ikinci aşamada): ilk harf aynı, 5+ harfli kelime;
  // kelimenin tamamı veya ek almış hali (ör. "fircalma", "randvumu")
  if (fuzzy && kw.length >= 5 && token[0] === kw[0]) {
    if (withinOneEdit(token, kw)) return true;
    for (const len of [kw.length - 1, kw.length, kw.length + 1]) {
      if (len <= token.length && withinOneEdit(token.slice(0, len), kw)) return true;
    }
  }
  return false;
}

function matches(normText: string, keyword: string, fuzzy = false): boolean {
  const kwTokens = normalize(keyword).split(" ");
  const tokens = normText.split(" ");
  // Çok kelimeli ifadeler: art arda gelen kelimeler eşleşmeli
  for (let i = 0; i + kwTokens.length <= tokens.length; i++) {
    if (kwTokens.every((kw, j) => tokenMatches(tokens[i + j], kw, fuzzy))) return true;
  }
  return false;
}

/* Yanıt üretimi ---------------------------------------------------- */

function fill(text: string, ctx: ChatContext) {
  const doctorText =
    ctx.doctors.length > 1
      ? `${ctx.doctors.slice(0, -1).join(", ")} ve ${ctx.doctors[ctx.doctors.length - 1]}`
      : (ctx.doctors[0] ?? "");
  return text
    .replace("{hekimler}", doctorText)
    .replace("{adres}", ctx.address)
    .replace(
      "{telefon}",
      ctx.phone ? `Telefon: ${ctx.phone}.` : "Güncel iletişim bilgilerimize iletişim sayfamızdan ulaşabilirsiniz.",
    )
    .replace(/\s+$/, "");
}

/**
 * Randevu butonu: mevcut randevu sayfasına gider. Online randevu henüz
 * yayında açık değilse (sayfa 404 verir) bozuk bağlantı yerine durumu
 * açıklayan yanıtı ve İletişim butonunu gösterir.
 */
export function resolveAction(action: ChatAction, ctx: ChatContext): ChatAction {
  if (action.kind !== "booking") return action;
  return ctx.bookingOpen
    ? { kind: "link", label: action.label, href: chatbot.bookingHref, primary: true }
    : { kind: "topic", label: action.label, topic: "randevu" };
}

function dedupe(actions: ChatAction[]) {
  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.kind === "link" ? a.href : a.kind === "topic" ? a.topic : "booking";
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function build(text: readonly string[], actions: readonly ChatAction[] | undefined, ctx: ChatContext): BotReply {
  return {
    text: text.map((t) => fill(t, ctx)),
    actions: dedupe((actions ?? []).map((a) => resolveAction(a, ctx))),
  };
}

export function greetingReply(ctx: ChatContext): BotReply {
  return build(chatbot.greeting, chatbot.quickOptions, ctx);
}

export function bookingReply(ctx: ChatContext): BotReply {
  return ctx.bookingOpen
    ? build(chatbot.booking.reply, [{ kind: "booking", label: "Randevu Al" }], ctx)
    : build(chatbot.booking.closedReply, [{ kind: "link", label: "Adres ve İletişim", href: "/iletisim" }], ctx);
}

/** Hızlı seçenek veya konu butonu için yanıt */
export function topicReply(topicId: string, ctx: ChatContext): BotReply {
  if (topicId === "menu") {
    const t = topics.find((x) => x.id === "menu");
    return build(t?.reply ?? [], chatbot.quickOptions, ctx);
  }
  if (topicId === "randevu") return bookingReply(ctx);
  if (topicId.startsWith("sss:")) {
    const faq = ctx.faqs[Number(topicId.slice(4))];
    if (faq) {
      return build(faq.answer.slice(0, 2), [{ kind: "link", label: "Tüm sorular", href: "/sik-sorulan-sorular" }], ctx);
    }
  }
  const topic = topics.find((x) => x.id === topicId);
  if (!topic) return build(chatbot.fallback.reply, chatbot.fallback.actions, ctx);

  let actions: ChatAction[] = [...(topic.actions ?? [])];
  if (topic.id === "sss") {
    actions = [
      ...ctx.faqs.slice(0, 5).map((f, i) => ({ kind: "topic" as const, label: f.question, topic: `sss:${i}` })),
      ...actions,
    ];
  }
  if (topic.id === "tedaviler" && ctx.hasPublishedTreatments) {
    actions = [{ kind: "link", label: "Tedaviler", href: "/tedaviler" }, ...actions];
  }
  return build(topic.reply, actions, ctx);
}

/** Kullanıcının yazdığı serbest mesaja yanıt */
export function replyTo(message: string, ctx: ChatContext): BotReply {
  // Uzun rakam dizisi: telefon / kimlik numarası paylaşılmış olabilir
  if (/\d[\d\s-]{8,}\d/.test(message)) return build(chatbot.privacy.reply, [], ctx);

  const text = normalize(message);
  if (!text) return build(chatbot.fallback.reply, chatbot.fallback.actions, ctx);

  // Öncelik: acil / şikâyet / ilaç → randevu → diğer konular (dosyadaki sıra).
  // Önce tam eşleşme aranır; hiçbiri yoksa küçük yazım hataları tolere edilir.
  const order = ["acil", "sikayet", "ilac"];
  for (const fuzzy of [false, true]) {
    for (const id of order) {
      const t = topics.find((x) => x.id === id);
      if (t?.keywords.some((k) => matches(text, k, fuzzy))) return topicReply(id, ctx);
    }
    if (chatbot.booking.keywords.some((k) => matches(text, k, fuzzy))) return bookingReply(ctx);
    for (const t of topics) {
      if (order.includes(t.id)) continue;
      if (t.keywords.some((k) => matches(text, k, fuzzy))) return topicReply(t.id, ctx);
    }
  }
  // SSS sorularının kendisi yazılmışsa
  const faqIndex = ctx.faqs.findIndex((f) => {
    const q = normalize(f.question).split(" ").filter((w) => w.length > 4);
    return q.length > 0 && q.filter((w) => text.includes(w)).length >= Math.min(2, q.length);
  });
  if (faqIndex >= 0) return topicReply(`sss:${faqIndex}`, ctx);

  return build(chatbot.fallback.reply, chatbot.fallback.actions, ctx);
}
