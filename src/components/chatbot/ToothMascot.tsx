"use client";

import { useId } from "react";
import styles from "./chatbot.module.css";

/**
 * Sardes Asistan maskotu: logodaki altın halkaya gönderme yapan, yuvarlak
 * hatlı zarif bir azı dişi. Dekoratiftir; erişilebilir ad, onu kullanan
 * butondan gelir.
 */
export function ToothMascot({
  className = "",
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  // Aynı sayfada birden fazla maskot olabilir; degrade kimlikleri benzersiz olmalı
  const uid = useId().replace(/:/g, "");
  const enamel = `sa-enamel-${uid}`;
  const gold = `sa-gold-${uid}`;
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={`${animated ? styles.mascot : ""} ${className}`}
    >
      <defs>
        <linearGradient id={enamel} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fffdf8" />
          <stop offset="1" stopColor="#efe6d4" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#a8732a" />
          <stop offset="0.5" stopColor="#e2c27a" />
          <stop offset="1" stopColor="#a8732a" />
        </linearGradient>
      </defs>

      {/* halkanın arka yarısı */}
      <path d="M7 41 C 9 33, 55 27, 57 34" fill="none" stroke={`url(#${gold})`} strokeWidth="1.6" opacity="0.55" />

      <g className={animated ? styles.body : ""}>
        {/* diş gövdesi */}
        <path
          d="M22 10c-7 0-11.5 5.6-11.5 12.6 0 5.4 1.9 9 3.6 13.4 1.9 5.2 2.3 11.6 4.4 16 1.8 3.7 5.9 3.3 6.9-.6l1.9-7.6c.9-3.4 5.5-3.4 6.4 0l1.9 7.6c1 3.9 5.1 4.3 6.9.6 2.1-4.4 2.5-10.8 4.4-16 1.7-4.4 3.6-8 3.6-13.4C53.5 15.6 49 10 42 10c-4.4 0-6.6 2.2-10 2.2S26.4 10 22 10Z"
          fill={`url(#${enamel})`}
          stroke="#b88a3a"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        {/* parlaklık */}
        <path d="M17 19c.8-3.4 3.2-5.3 6.2-5.6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.9" />

        {/* gözler */}
        <g className={animated ? styles.eyes : ""}>
          <ellipse cx="25.5" cy="27" rx="2" ry="2.6" fill="#1b1b1b" />
          <ellipse cx="38.5" cy="27" rx="2" ry="2.6" fill="#1b1b1b" />
          <circle cx="26.2" cy="26" r="0.7" fill="#fff" />
          <circle cx="39.2" cy="26" r="0.7" fill="#fff" />
        </g>
        {/* yanaklar ve gülümseme */}
        <ellipse cx="21" cy="32.5" rx="2.4" ry="1.4" fill="#e7b9a2" opacity="0.55" />
        <ellipse cx="43" cy="32.5" rx="2.4" ry="1.4" fill="#e7b9a2" opacity="0.55" />
        <path d="M28.2 33.2c2.2 2.4 5.4 2.4 7.6 0" fill="none" stroke="#1b1b1b" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* halkanın ön yarısı */}
      <path d="M7 41 C 9 49, 55 43, 57 34" fill="none" stroke={`url(#${gold})`} strokeWidth="2" strokeLinecap="round" />
      {/* küçük ışıltı */}
      <path className={animated ? styles.sparkle : ""} d="M52 12l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1z" fill="#e2c27a" />
    </svg>
  );
}
