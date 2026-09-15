import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "@/contexts/LanguageContext";

const TTS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tts`;

/** Cache of generated audio per (lang|text) so repeated phrases are instant and free. */
const cache = new Map<string, string>();

const BROWSER_LANG: Record<Language, string> = { mr: "mr-IN", hi: "hi-IN", en: "en-IN" };

/** Last-resort fallback: browser speech synthesis (used only if the AI voice fails). */
export const browserSpeak = (text: string, lang: Language) => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const voices = window.speechSynthesis.getVoices();
  const pick = (p: string) => voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(p));
  const v = pick(lang) ?? (lang === "mr" ? pick("hi") : undefined) ?? pick("en-in");
  if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = lang === "mr" ? "hi-IN" : BROWSER_LANG[lang]; }
  u.rate = 1.15;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
};

/**
 * Natural, fast multilingual voice (Marathi / Hindi / English) via the backend TTS function.
 * Falls back to the browser voice if the service is unavailable.
 */
export const useAiVoice = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const speak = useCallback(async (text: string, lang: Language) => {
    const clean = text.replace(/[*_#`>]/g, "").trim();
    if (!clean) return;
    stop();
    const key = `${lang}|${clean}`;

    try {
      let url = cache.get(key);
      if (!url) {
        setLoading(true);
        const res = await fetch(TTS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ text: clean, language: lang, speed: 1.15 }),
        });
        if (!res.ok) throw new Error(`tts ${res.status}`);
        url = URL.createObjectURL(await res.blob());
        cache.set(key, url);
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => setSpeaking(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      browserSpeak(clean, lang);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 1500);
    } finally {
      setLoading(false);
    }
  }, [stop]);

  return { speak, stop, speaking, loading };
};
