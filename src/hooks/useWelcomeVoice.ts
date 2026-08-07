import { useEffect } from "react";
import { Language } from "@/contexts/LanguageContext";

const MESSAGES: Record<Language, { text: string; lang: string }> = {
  mr: {
    text: "Labour Connect मध्ये आपले स्वागत आहे. हे एक व्यासपीठ आहे जे कंत्राटदार आणि कामगार यांना जोडते. कामगारांना काम मिळवण्यासाठी आणि कंत्राटदारांना योग्य कामगार शोधण्यासाठी हे बनवले आहे.",
    lang: "mr-IN",
  },
  hi: {
    text: "Labour Connect में आपका स्वागत है। यह एक ऐसा मंच है जो ठेकेदारों और मजदूरों को जोड़ता है।",
    lang: "hi-IN",
  },
  en: {
    text: "Welcome to Labour Connect. This platform connects contractors with skilled workers across India.",
    lang: "en-IN",
  },
};

/** Pick the best available voice for a language, with sensible fallbacks. */
const pickVoice = (voices: SpeechSynthesisVoice[], lang: Language): SpeechSynthesisVoice | null => {
  const byPrefix = (p: string) => voices.filter((v) => v.lang.toLowerCase().replace("_", "-").startsWith(p));
  const preferNatural = (list: SpeechSynthesisVoice[]) =>
    list.find((v) => /google|natural|female|neural/i.test(v.name)) ?? list[0] ?? null;

  if (lang === "en") {
    const indian = byPrefix("en-in");
    const us = byPrefix("en-us");
    return preferNatural(indian) ?? preferNatural(us) ?? preferNatural(byPrefix("en"));
  }

  if (lang === "hi") {
    return preferNatural(byPrefix("hi"));
  }

  // Marathi: most devices have no mr voice — fall back to Hindi (never English).
  const mr = preferNatural(byPrefix("mr"));
  if (mr) return mr;
  const hi = preferNatural(byPrefix("hi"));
  if (hi) return hi;
  return null;
};

export const useWelcomeVoice = (lang: Language) => {
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (sessionStorage.getItem("welcome_voice_spoken") === "1") return;

    let done = false;

    const speak = () => {
      if (done) return;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return; // wait for voiceschanged
      done = true;

      const cfg = MESSAGES[lang];
      const utterance = new SpeechSynthesisUtterance(cfg.text);
      const voice = pickVoice(voices, lang);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = lang === "mr" ? "hi-IN" : cfg.lang;
        if (import.meta.env.DEV) {
          console.warn(`[welcome-voice] No TTS voice found for "${lang}". Falling back to ${utterance.lang}.`);
        }
      }

      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      const mark = () => sessionStorage.setItem("welcome_voice_spoken", "1");
      utterance.onend = mark;
      utterance.onerror = mark;

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    // Voices load asynchronously in Chrome/Edge.
    speak();
    if (!done) {
      const handler = () => {
        speak();
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      };
      window.speechSynthesis.addEventListener("voiceschanged", handler);
      const t = setTimeout(speak, 800);
      return () => {
        clearTimeout(t);
        window.speechSynthesis.removeEventListener("voiceschanged", handler);
      };
    }
  }, [lang]);
};
