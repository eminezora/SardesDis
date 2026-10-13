"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { chatbot, type ChatAction } from "@/config/chatbot";
import { greetingReply, replyTo, topicReply, type BotReply, type ChatContext } from "@/lib/chatbot-engine";
import { ToothMascot } from "./ToothMascot";
import styles from "./chatbot.module.css";

type Message =
  | { id: number; from: "user"; text: string }
  | ({ id: number; from: "bot" } & BotReply);

const TEASER_KEY = "sardes-asistan-balon";
const MAX_LEN = 300;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sardes Asistan — sağ alt köşedeki maskot ve sohbet penceresi.
 * Kural tabanlıdır (src/config/chatbot.ts); veri göndermez, kaydetmez.
 */
export function SardesAssistant({ ctx, hasMobileBar }: { ctx: ChatContext; hasMobileBar: boolean }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const [teaser, setTeaser] = useState(false);
  const [greet, setGreet] = useState(false);

  const nextId = useRef(1);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const titleId = useId();
  const hintId = useId();

  /* Açılışta: kısa selamlama hareketi ve (tarayıcı başına bir kez) balon */
  useEffect(() => {
    setGreet(true);
    let seen = false;
    try {
      seen = localStorage.getItem(TEASER_KEY) === "1";
    } catch {
      /* depolama kapalıysa balon her ziyarette bir kez gösterilir */
    }
    if (seen) return;
    const show = setTimeout(() => {
      setTeaser(true);
      // Balon yalnızca bir kez: gerçekten gösterildiğinde işaretlenir
      try {
        localStorage.setItem(TEASER_KEY, "1");
      } catch {}
    }, 2500);
    const hide = setTimeout(() => setTeaser(false), 11000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const push = useCallback((m: Omit<Message, "id">) => {
    setMessages((list) => [...list, { ...m, id: nextId.current++ } as Message]);
  }, []);

  const botSays = useCallback(
    (reply: BotReply) => {
      if (prefersReducedMotion()) {
        push({ from: "bot", ...reply });
        return;
      }
      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        push({ from: "bot", ...reply });
      }, 450);
      timers.current.push(t);
    },
    [push],
  );

  const openChat = () => {
    setTeaser(false);
    setOpen(true);
    if (messages.length === 0) push({ from: "bot", ...greetingReply(ctx) });
  };

  const closeChat = useCallback(() => {
    setOpen(false);
    requestAnimationFrame(() => launcherRef.current?.focus());
  }, []);

  /* Açılınca yazı alanına odaklan */
  useEffect(() => {
    if (open) inputRef.current?.focus({ preventScroll: true });
  }, [open]);

  /* Yeni mesajda en alta kaydır */
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, typing]);

  const send = () => {
    const text = input.trim().slice(0, MAX_LEN);
    if (!text || typing) return;
    setInput("");
    push({ from: "user", text });
    botSays(replyTo(text, ctx));
  };

  const choose = (action: ChatAction) => {
    if (action.kind !== "topic" || typing) return;
    push({ from: "user", text: action.label });
    botSays(topicReply(action.topic, ctx));
  };

  const onPanelKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      closeChat();
    }
  };

  // Telefonda alttaki arama çubuğu varsa maskot ve pencere onun üstünde durur
  const bottomOffset = hasMobileBar
    ? "bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6"
    : "bottom-[calc(1rem+env(safe-area-inset-bottom))] md:bottom-6";

  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;

  return (
    <>
      {/* Maskot (başlatıcı) */}
      {!open && (
        <div className={`fixed right-4 z-30 flex items-end gap-3 md:right-6 ${bottomOffset}`}>
          {teaser && (
            <div
              className={`${styles.bubble} relative mb-2 hidden max-w-[14rem] rounded-[2px] border border-stone-deep bg-paper py-2.5 pl-4 pr-9 text-[0.875rem] leading-snug text-ink shadow-[0_6px_20px_-12px_rgba(0,0,0,0.35)] min-[380px]:block`}
            >
              <button type="button" onClick={openChat} className="text-left focus-visible:outline-offset-4">
                {chatbot.teaser}
              </button>
              <button
                type="button"
                onClick={() => setTeaser(false)}
                aria-label="Balonu kapat"
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center text-muted hover:text-ink"
              >
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-2.5 w-2.5" stroke="currentColor" strokeWidth="1.4">
                  <path d="M1 1l10 10M11 1 1 11" />
                </svg>
              </button>
              <span
                aria-hidden="true"
                className="absolute -right-[5px] bottom-4 h-2.5 w-2.5 rotate-45 border-r border-t border-stone-deep bg-paper"
              />
            </div>
          )}
          <button
            ref={launcherRef}
            type="button"
            onClick={openChat}
            aria-haspopup="dialog"
            aria-expanded={false}
            aria-label={`${chatbot.name} ile sohbet et`}
            className={`${styles.launcher} ${greet ? styles.greet : ""} group relative flex h-14 w-14 shrink-0 md:h-16 md:w-16 items-center justify-center rounded-full bg-[#181818] shadow-[0_10px_28px_-12px_rgba(0,0,0,0.6)] ring-1 ring-gold/70 ring-offset-2 ring-offset-transparent transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest`}
          >
            <span aria-hidden="true" className="absolute inset-[3px] rounded-full border border-gold/40" />
            <ToothMascot className="relative h-10 w-10 md:h-12 md:w-12" />
          </button>
        </div>
      )}

      {/* Sohbet penceresi */}
      {open && (
        <section
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          onKeyDown={onPanelKey}
          className={`${styles.panel} fixed inset-x-2 z-30 flex max-h-[calc(100dvh-6.5rem-env(safe-area-inset-bottom))] flex-col overflow-hidden rounded-[3px] border border-stone-deep bg-ivory shadow-[0_24px_60px_-24px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:right-6 sm:w-[23.5rem] ${
            hasMobileBar
              ? "bottom-[calc(4.5rem+env(safe-area-inset-bottom))] h-[min(36rem,calc(100dvh-11rem))] md:bottom-6"
              : "bottom-[calc(0.5rem+env(safe-area-inset-bottom))] h-[min(36rem,calc(100dvh-6.5rem))] sm:bottom-6"
          }`}
        >
          {/* Başlık */}
          <header className="on-dark flex items-center gap-3 border-b border-gold/30 bg-[#181818] px-4 py-3 text-paper">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full ring-1 ring-gold/60">
              <ToothMascot className="h-9 w-9" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="font-serif text-[1.375rem] leading-tight text-paper">
                {chatbot.name}
              </h2>
              <p className="text-xs text-paper/65">{chatbot.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Sohbeti kapat"
              className="flex h-11 w-11 items-center justify-center rounded-full text-paper/80 transition-colors hover:bg-paper/10 hover:text-paper"
            >
              <svg aria-hidden="true" viewBox="0 0 14 14" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth="1.4">
                <path d="M1 1l12 12M13 1 1 13" />
              </svg>
            </button>
          </header>

          {/* Mesajlar */}
          <div
            ref={logRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label="Sohbet mesajları"
            className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5"
          >
            {messages.map((m) =>
              m.from === "user" ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[85%] whitespace-pre-line break-words rounded-[3px] bg-forest px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-paper">
                    <span className="sr-only">Siz: </span>
                    {m.text}
                  </p>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#181818] ring-1 ring-gold/50">
                    <ToothMascot className="h-5 w-5" animated={false} />
                  </span>
                  <div className="min-w-0 max-w-[88%]">
                    <div className="space-y-2 rounded-[3px] border border-stone-deep bg-paper px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink">
                      <span className="sr-only">{chatbot.name}: </span>
                      {m.text.map((t) => (
                        <p key={t}>{t}</p>
                      ))}
                    </div>
                    {m.actions.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2" role="group" aria-label="Seçenekler">
                        {m.actions.map((a) =>
                          a.kind === "link" ? (
                            <Link
                              key={a.href + a.label}
                              href={a.href}
                              onClick={() => setOpen(false)}
                              className={`inline-flex min-h-10 items-center rounded-[2px] border px-3.5 text-[0.875rem] font-medium transition-colors ${
                                a.primary
                                  ? "border-forest bg-forest text-paper hover:bg-forest-deep"
                                  : "border-ink/25 bg-paper text-ink hover:border-forest"
                              }`}
                            >
                              {a.label}
                              {a.primary && (
                                <svg aria-hidden="true" viewBox="0 0 20 10" className="ml-2 h-2.5 w-4" fill="none" stroke="currentColor" strokeWidth="1.2">
                                  <path d="M0 5h19M15 1l4 4-4 4" />
                                </svg>
                              )}
                            </Link>
                          ) : a.kind === "topic" ? (
                            <button
                              key={a.topic}
                              type="button"
                              onClick={() => choose(a)}
                              disabled={typing || m.id !== lastBotId}
                              className="inline-flex min-h-10 items-center rounded-[2px] border border-gold/60 bg-ivory px-3.5 text-left text-[0.875rem] text-ink transition-colors hover:border-forest hover:bg-paper disabled:cursor-default disabled:opacity-50"
                            >
                              {a.label}
                            </button>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            {typing && (
              <div className="flex items-center gap-2.5 text-muted">
                <span aria-hidden="true" className="flex h-7 w-7 items-center justify-center rounded-full bg-[#181818] ring-1 ring-gold/50">
                  <ToothMascot className="h-5 w-5" animated={false} />
                </span>
                <span className={`${styles.dots} flex gap-1 rounded-[3px] border border-stone-deep bg-paper px-3 py-3`}>
                  <span />
                  <span />
                  <span />
                  <span className="sr-only">{chatbot.name} yazıyor</span>
                </span>
              </div>
            )}
          </div>

          {/* Yazma alanı */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-stone-deep bg-paper px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-3"
          >
            <div className="flex items-center gap-2">
              <label htmlFor={`${titleId}-input`} className="sr-only">
                Mesajınız
              </label>
              <input
                ref={inputRef}
                id={`${titleId}-input`}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={MAX_LEN}
                autoComplete="off"
                enterKeyHint="send"
                placeholder={chatbot.inputPlaceholder}
                aria-describedby={hintId}
                className="min-h-11 min-w-0 flex-1 rounded-[2px] border border-stone-deep bg-ivory px-3.5 text-base text-ink outline-none placeholder:text-muted/70 focus:border-forest focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-forest"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                aria-label="Gönder"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[2px] bg-forest text-paper transition-colors hover:bg-forest-deep disabled:opacity-40"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 10h13M11 4.5 16.5 10 11 15.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <p id={hintId} className="mt-2 text-[0.6875rem] leading-snug text-muted">
              <span className="block font-medium text-ink/75">{chatbot.disclaimer}</span>
              <span className="block">{chatbot.inputHint}</span>
            </p>
          </form>
        </section>
      )}
    </>
  );
}
