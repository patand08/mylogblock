import { useLayoutEffect, useRef } from "react";
import twemoji from "twemoji";

/**
 * Shared Twemoji asset options (SVG on CDN).
 * Default twemoji package base points at twemoji.maxcdn.com (retired); use jsDelivr GitHub mirror.
 */
export const TWEMOJI_SVG_OPTIONS = {
  base: "https://cdn.jsdelivr.net/gh/twitter/twemoji@v14.0.2/assets/",
  folder: "svg",
  ext: ".svg",
} as const;

interface Props {
  /** Raw emoji string (one grapheme or short string). */
  text: string;
  className?: string;
}

/**
 * Renders text as Twitter-style Twemoji (SVG), consistent across OS fonts.
 */
export default function Twemoji({ text, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.textContent = text || "";
    twemoji.parse(el, TWEMOJI_SVG_OPTIONS);
  }, [text]);

  return (
    <span
      ref={ref}
      className={["twemoji-wrap inline-flex items-center justify-center", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
