import { useEffect, useRef } from "react";
import { Language } from "@/contexts/LanguageContext";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;

/** Short greeting per language — short = faster to start and easier to follow. */
const MESSAGES: Record<Language, string> = {
  mr: "Labour Connect मध्ये आपले स्वागत आहे. कंत्राटदार आणि कामगार यांना जोडणारे व्यासपीठ.",
  hi: "Labour Connect में आपका स्वागत है। ठेकेदारों और मजदूरों को जोड़ने वाला मंच।",
  en: "Welcome to Labour Connect. The platform that connects contractors with skilled workers.",
};

const browserFallback = (text: string, lang: Language) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const voices = window.speechSynthesis.getVoices();
  const pick = (p: string) => voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(p));
  const u = new SpeechSynthesisUtterance(text);
  const v = pick(lang) ?? (lang === "mr" ? pick("hi") : undefined) ?? pick("en-in");
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = lang === "mr" ? "hi-IN" : lang === "hi" ? "hi-IN" : "en-IN"; }
  u.rate = 1.15;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
};

/**
 * Plays a natural, quick welcome greeting in the currently selected site language.
 * Uses the AI voice service; if autoplay is blocked it plays on the first tap/click.
 */
export const useWelcomeVoice = (lang: Language) => {
  const playedFor = useRef<Language | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("welcome_voice_lang") === lang) return;
    if (playedFor.current === lang) return;
    playedFor.current = lang;

    let cancelled = false;
    let audio: HTMLAudioElement | null = null;
    let unlock: (() => void) | null = null;
    const text = MESSAGES[lang];

    (async () => {
      try {
        const res = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text, language: lang, speed: 1.15 }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        if (cancelled) return;
        const url = URL.createObjectURL(await res.blob());
        audio = new Audio(url);
        const mark = () => sessionStorage.setItem("welcome_voice_lang", lang);
        try {
          await audio.play();
          mark();
        } catch {
          // Autoplay blocked — play on first user gesture instead.
          unlock = () => {
            audio?.play().then(mark).catch(() => {});
            window.removeEventListener("pointerdown", unlock!);
          };
          window.addEventListener("pointerdown", unlock, { once: true });
        }
      } catch {
        if (!cancelled) browserFallback(text, lang);
      }
    })();

    return () => {
      cancelled = true;
      audio?.pause();
      if (unlock) window.removeEventListener("pointerdown", unlock);
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [lang]);
};
