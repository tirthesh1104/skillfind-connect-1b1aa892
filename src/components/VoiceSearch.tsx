import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  onResult: (text: string) => void;
  className?: string;
}

/** Browser-native voice input (Marathi first, Hindi fallback). No API key needed. */
export const VoiceSearchButton = ({ onResult, className }: Props) => {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toast.error("Voice search is not supported in this browser.");
    if (listening) { recRef.current?.stop(); return; }

    const rec = new SR();
    rec.lang = "mr-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let gotResult = false;

    rec.onresult = (e: any) => {
      gotResult = true;
      const text = e.results[0][0].transcript as string;
      onResult(text);
      toast.success(`Heard: ${text}`);
    };
    rec.onerror = (e: any) => {
      if (e.error === "language-not-supported" && rec.lang === "mr-IN") {
        rec.lang = "hi-IN";
        try { rec.start(); return; } catch { /* ignore */ }
      }
      setListening(false);
      if (e.error !== "aborted" && !gotResult) toast.error("Could not hear you. Try again.");
    };
    rec.onend = () => setListening(false);

    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [listening, onResult]);

  return (
    <Button
      type="button"
      variant={listening ? "default" : "outline"}
      size="icon"
      aria-label="Search by voice"
      onClick={start}
      className={cn(listening && "animate-pulse", className)}
    >
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
};

interface SpeakProps {
  text: string;
  lang?: string;
  className?: string;
}

/** Reads text aloud using browser SpeechSynthesis — helps low-literacy users. */
export const SpeakButton = ({ text, lang = "mr-IN", className }: SpeakProps) => {
  const speak = () => {
    if (!("speechSynthesis" in window)) return toast.error("Audio not supported here.");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };
  return (
    <Button type="button" variant="ghost" size="sm" className={className} onClick={speak} aria-label="Listen">
      🔊
    </Button>
  );
};
