import { useEffect } from "react";
import { Language } from "@/contexts/LanguageContext";

const MESSAGES: Record<Language, { text: string; voice: string }> = {
  mr: {
    text: "Labour Connect मध्ये आपले स्वागत आहे. हे एक व्यासपीठ आहे जे कंत्राटदार आणि कामगार यांना जोडते. कामगारांना काम मिळवण्यासाठी आणि कंत्राटदारांना योग्य कामगार शोधण्यासाठी हे बनवले आहे.",
    voice: "mr-IN",
  },
  hi: {
    text: "Labour Connect में आपका स्वागत है। यह एक ऐसा मंच है जो ठेकेदारों और मजदूरों को जोड़ता है।",
    voice: "hi-IN",
  },
  en: {
    text: "Welcome to Labour Connect. This platform connects contractors with skilled workers across India.",
    voice: "en-IN",
  },
};

export const useWelcomeVoice = (lang: Language) => {
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (sessionStorage.getItem("welcome_voice_spoken") === "1") return;

    const speak = () => {
      const cfg = MESSAGES[lang];
      const utterance = new SpeechSynthesisUtterance(cfg.text);
      utterance.lang = cfg.voice;
      utterance.rate = 0.92;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const match = voices.find((v) => v.lang === cfg.voice) || voices.find((v) => v.lang.startsWith(cfg.voice.split("-")[0]));
      if (match) utterance.voice = match;

      utterance.onend = () => {
        sessionStorage.setItem("welcome_voice_spoken", "1");
      };
      utterance.onerror = () => {
        sessionStorage.setItem("welcome_voice_spoken", "1");
      };

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    };

    // Voices load asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      const handler = () => {
        speak();
        window.speechSynthesis.onvoiceschanged = null;
      };
      window.speechSynthesis.onvoiceschanged = handler;
      // Fallback timeout
      setTimeout(() => {
        if (sessionStorage.getItem("welcome_voice_spoken") !== "1") speak();
      }, 600);
    } else {
      speak();
    }
  }, [lang]);
};
